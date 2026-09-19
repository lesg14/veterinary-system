from datetime import date, datetime, time, timedelta

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from veterinary.models import (
    Appointment,
    ConsultationType,
    Pet,
    Professional,
)


CLINIC_OPENING_TIME = time(8, 0)
CLINIC_CLOSING_TIME = time(18, 0)
OCCUPIED_STATUSES = (
    Appointment.Status.SCHEDULED,
    Appointment.Status.ATTENDED,
    Appointment.Status.NO_SHOW,
)


def _ensure_aware(value: datetime) -> datetime:
    if timezone.is_naive(value):
        raise ValidationError("La fecha y hora debe incluir zona horaria.")
    return value


def _clinic_day_bounds(day: date) -> tuple[datetime, datetime]:
    current_zone = timezone.get_current_timezone()
    opening = timezone.make_aware(datetime.combine(day, CLINIC_OPENING_TIME), current_zone)
    closing = timezone.make_aware(datetime.combine(day, CLINIC_CLOSING_TIME), current_zone)
    return opening, closing


@transaction.atomic
def create_appointment(
    *,
    pet: Pet | int,
    professional: Professional | int,
    consultation_type: ConsultationType | int,
    starts_at: datetime,
    notes: str = "",
) -> Appointment:
    """Crea una cita aplicando las reglas de agenda en una transacción."""
    starts_at = _ensure_aware(starts_at)
    pet_id = pet.pk if isinstance(pet, Pet) else pet
    professional_id = professional.pk if isinstance(professional, Professional) else professional
    consultation_type_id = (
        consultation_type.pk
        if isinstance(consultation_type, ConsultationType)
        else consultation_type
    )

    locked_professional = Professional.objects.select_for_update().get(pk=professional_id)
    selected_pet = Pet.objects.get(pk=pet_id)
    selected_type = ConsultationType.objects.get(pk=consultation_type_id)

    appointment = Appointment(
        pet=selected_pet,
        professional=locked_professional,
        consultation_type=selected_type,
        starts_at=starts_at,
        notes=notes,
    )
    appointment.save()
    return appointment


def cancel_appointment(
    appointment: Appointment | int,
    *,
    requested_at: datetime | None = None,
) -> Appointment:
    """Cancela una cita o la marca como inasistencia según el límite configurado."""
    selected_appointment = (
        Appointment.objects.get(pk=appointment)
        if isinstance(appointment, int)
        else appointment
    )
    selected_appointment.cancel(requested_at=requested_at)
    return selected_appointment


def get_daily_schedule(
    *,
    day: date,
    professional: Professional | int | None = None,
) -> dict:
    """Devuelve citas y espacios libres por profesional para un día de clínica."""
    opening, closing = _clinic_day_bounds(day)
    professionals = Professional.objects.filter(is_active=True).order_by("full_name")
    if professional is not None:
        professional_id = professional.pk if isinstance(professional, Professional) else professional
        professionals = professionals.filter(pk=professional_id)

    appointments = Appointment.objects.filter(
        starts_at__lt=closing,
        ends_at__gt=opening,
        status__in=OCCUPIED_STATUSES,
    ).select_related("pet", "consultation_type", "professional")
    if professional is not None:
        appointments = appointments.filter(professional_id=professional_id)
    appointments = list(appointments.order_by("professional_id", "starts_at"))

    appointments_by_professional = {item.pk: [] for item in professionals}
    for appointment in appointments:
        appointments_by_professional[appointment.professional_id].append(appointment)

    schedules = []
    for current_professional in professionals:
        current_appointments = appointments_by_professional[current_professional.pk]
        free_slots = []
        cursor = opening
        for appointment in current_appointments:
            appointment_start = max(timezone.localtime(appointment.starts_at), opening)
            if cursor < appointment_start:
                free_slots.append({"starts_at": cursor, "ends_at": appointment_start})
            cursor = max(cursor, timezone.localtime(appointment.ends_at))
        if cursor < closing:
            free_slots.append({"starts_at": cursor, "ends_at": closing})

        schedules.append(
            {
                "professional": current_professional,
                "appointments": current_appointments,
                "free_slots": free_slots,
            }
        )

    return {"date": day, "opening": opening, "closing": closing, "schedules": schedules}
