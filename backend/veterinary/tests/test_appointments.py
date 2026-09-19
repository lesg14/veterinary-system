from datetime import datetime, time, timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from veterinary.models import Appointment, ConsultationType, Owner, Pet, Professional
from veterinary.services.appointments import (
    cancel_appointment,
    create_appointment,
    get_daily_schedule,
)


class AppointmentServiceTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = Owner.objects.create(
            full_name="Ana Torres",
            phone="3000000000",
        )
        cls.pet = Pet.objects.create(
            owner=cls.owner,
            name="Luna",
            species="Canina",
        )
        cls.deceased_pet = Pet.objects.create(
            owner=cls.owner,
            name="Milo",
            species="Felina",
            vital_status=Pet.VitalStatus.DECEASED,
            death_date=datetime(2025, 1, 10).date(),
        )
        cls.professional = Professional.objects.create(
            full_name="Dra. Laura Gomez",
            professional_id="VET-001",
        )
        cls.other_professional = Professional.objects.create(
            full_name="Dr. Carlos Perez",
            professional_id="VET-002",
        )
        cls.general = ConsultationType.objects.create(
            name="Consulta general",
            duration_minutes=30,
        )
        cls.specialized = ConsultationType.objects.create(
            name="Control especializado",
            duration_minutes=45,
        )

    def appointment_time(self, hour=9, minute=0):
        return timezone.make_aware(
            datetime.combine(datetime(2026, 9, 21).date(), time(hour, minute))
        )

    def test_duration_is_calculated_from_consultation_type(self):
        appointment = create_appointment(
            pet=self.pet,
            professional=self.professional,
            consultation_type=self.specialized,
            starts_at=self.appointment_time(),
        )

        self.assertEqual(appointment.ends_at, self.appointment_time(9, 45))

    def test_overlapping_appointments_for_same_professional_are_rejected(self):
        create_appointment(
            pet=self.pet,
            professional=self.professional,
            consultation_type=self.general,
            starts_at=self.appointment_time(),
        )

        with self.assertRaises(ValidationError):
            create_appointment(
                pet=self.pet,
                professional=self.professional,
                consultation_type=self.general,
                starts_at=self.appointment_time(9, 15),
            )

    def test_different_professionals_can_have_same_time(self):
        create_appointment(
            pet=self.pet,
            professional=self.professional,
            consultation_type=self.general,
            starts_at=self.appointment_time(),
        )
        appointment = create_appointment(
            pet=self.pet,
            professional=self.other_professional,
            consultation_type=self.general,
            starts_at=self.appointment_time(),
        )

        self.assertEqual(appointment.professional, self.other_professional)

    def test_deceased_pet_cannot_receive_new_appointment(self):
        with self.assertRaises(ValidationError):
            create_appointment(
                pet=self.deceased_pet,
                professional=self.professional,
                consultation_type=self.general,
                starts_at=self.appointment_time(),
            )

    def test_late_cancellation_becomes_no_show(self):
        appointment = create_appointment(
            pet=self.pet,
            professional=self.professional,
            consultation_type=self.general,
            starts_at=self.appointment_time(),
        )

        cancel_appointment(
            appointment,
            requested_at=self.appointment_time(8, 30),
        )

        appointment.refresh_from_db()
        self.assertEqual(appointment.status, Appointment.Status.NO_SHOW)

    def test_cancellation_at_least_two_hours_before_is_allowed(self):
        appointment = create_appointment(
            pet=self.pet,
            professional=self.professional,
            consultation_type=self.general,
            starts_at=self.appointment_time(),
        )

        cancel_appointment(
            appointment,
            requested_at=self.appointment_time(7),
        )
        appointment.refresh_from_db()

        self.assertEqual(appointment.status, Appointment.Status.CANCELED)

    def test_daily_schedule_returns_appointments_and_free_slots(self):
        create_appointment(
            pet=self.pet,
            professional=self.professional,
            consultation_type=self.general,
            starts_at=self.appointment_time(9),
        )

        schedule = get_daily_schedule(
            day=datetime(2026, 9, 21).date(),
            professional=self.professional,
        )
        professional_schedule = schedule["schedules"][0]

        self.assertEqual(len(professional_schedule["appointments"]), 1)
        self.assertEqual(
            professional_schedule["free_slots"][0]["starts_at"].time(),
            time(8, 0),
        )
        self.assertEqual(
            professional_schedule["free_slots"][0]["ends_at"].time(),
            time(9, 0),
        )
