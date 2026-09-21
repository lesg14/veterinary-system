from datetime import date, datetime, time, timedelta

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from veterinary.models import (
    Appointment,
    ConsultationType,
    Pet,
    Professional,
    clinic_datetimes_for_day,
)


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
    intervals = clinic_datetimes_for_day(day)
    if not intervals:
        current_zone = timezone.get_current_timezone()
        closed = timezone.make_aware(datetime.combine(day, time(0, 0)), current_zone)
        return closed, closed
    return intervals[0][0], intervals[-1][1]


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
    try:
        appointment.save()
    except ValidationError as error:
        message = " ".join(error.messages)
        if "solapamiento" in message.lower() or "intervalo" in message.lower():
            next_starts = get_available_starts(
                day=timezone.localtime(starts_at).date(),
                professional=locked_professional,
                duration_minutes=selected_type.duration_minutes,
                after=starts_at,
            )
            if next_starts:
                message = f"{message} Próxima hora disponible: {timezone.localtime(next_starts[0]):%H:%M}."
            else:
                message = f"{message} No hay otro horario disponible para ese día."
            raise ValidationError({"starts_at": message}) from error
        raise
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


def get_available_starts(*, day: date, professional: Professional | int, duration_minutes: int, pet: Pet | int | None = None, after: datetime | None = None) -> list[datetime]:
    """Devuelve inicios de 15 minutos que caben completos en la jornada y no se solapan."""
    professional_id = professional.pk if isinstance(professional, Professional) else professional
    intervals = clinic_datetimes_for_day(day)
    pet_id = pet.pk if isinstance(pet, Pet) else pet
    occupied = Appointment.objects.filter(
        Q(professional_id=professional_id) | Q(pet_id=pet_id) if pet_id else Q(professional_id=professional_id),
        status__in=OCCUPIED_STATUSES,
        starts_at__lt=intervals[-1][1] if intervals else timezone.now(),
        ends_at__gt=intervals[0][0] if intervals else timezone.now(),
    ).values_list("starts_at", "ends_at") if intervals else []
    occupied = [(timezone.localtime(start), timezone.localtime(end)) for start, end in occupied]
    step = timedelta(minutes=15)
    duration = timedelta(minutes=duration_minutes)
    available = []
    for interval_start, interval_end in intervals:
        cursor = interval_start
        while cursor + duration <= interval_end:
            candidate_end = cursor + duration
            if (after is None or cursor > timezone.localtime(after)) and not any(
                cursor < occupied_end and candidate_end > occupied_start
                for occupied_start, occupied_end in occupied
            ):
                available.append(cursor)
            cursor += step
    return available


def get_daily_schedule(
    *,
    day: date,
    professional: Professional | int | None = None,
) -> dict:
    """Devuelve citas y espacios libres por profesional para un día de clínica."""
    opening, closing = _clinic_day_bounds(day)
    clinic_intervals = clinic_datetimes_for_day(day)
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
        local_appointments = [
            (timezone.localtime(appointment.starts_at), timezone.localtime(appointment.ends_at))
            for appointment in current_appointments
        ]
        for interval_start, interval_end in clinic_intervals:
            cursor = interval_start
            for appointment_start, appointment_end in local_appointments:
                if appointment_end <= interval_start or appointment_start >= interval_end:
                    continue
                appointment_start = max(appointment_start, interval_start)
                if cursor < appointment_start:
                    free_slots.append({"starts_at": cursor, "ends_at": appointment_start})
                cursor = max(cursor, min(appointment_end, interval_end))
            if cursor < interval_end:
                free_slots.append({"starts_at": cursor, "ends_at": interval_end})

        schedules.append(
            {
                "professional": current_professional,
                "appointments": current_appointments,
                "free_slots": free_slots,
            }
        )

    return {
        "date": day,
        "opening": opening,
        "closing": closing,
        "work_intervals": clinic_intervals,
        "schedules": schedules,
    }
