from datetime import datetime, time

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from veterinary.models import ConsultationType, Owner, Pet, Professional


class VeterinaryApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        owner = Owner.objects.create(full_name="Ana Torres", phone="3000000000")
        cls.pet = Pet.objects.create(owner=owner, name="Luna", species="Canina")
        cls.professional = Professional.objects.create(
            full_name="Dra. Laura Gomez",
            professional_id="VET-API-001",
        )
        cls.consultation_type = ConsultationType.objects.create(
            name="Consulta API",
            duration_minutes=30,
        )

    def setUp(self):
        self.client = APIClient()
        self.starts_at = timezone.make_aware(
            datetime.combine(datetime(2026, 9, 21).date(), time(9, 0))
        )

    def test_create_appointment_endpoint(self):
        response = self.client.post(
            "/api/appointments/",
            {
                "pet": self.pet.id,
                "professional": self.professional.id,
                "consultation_type": self.consultation_type.id,
                "starts_at": self.starts_at.isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "SCHEDULED")
        self.assertEqual(response.data["ends_at"], "2026-09-21T09:30:00-05:00")

    def test_daily_agenda_endpoint_returns_free_slots(self):
        response = self.client.get(
            "/api/agenda/",
            {
                "date": "2026-09-21",
                "professional_id": self.professional.id,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["schedules"]), 1)
        first_free_slot = response.data["schedules"][0]["free_slots"][0]
        self.assertEqual(first_free_slot["starts_at"].time(), time(8, 0))
