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

    def test_owner_crud_endpoints_create_list_update_and_delete(self):
        response = self.client.post(
            "/api/owners/",
            {"full_name": "Carlos Ruiz", "phone": "3110000000"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        owner_id = response.data["id"]

        response = self.client.put(
            f"/api/owners/{owner_id}/",
            {"full_name": "Carlos Ruiz Actualizado", "phone": "3110000000"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["full_name"], "Carlos Ruiz Actualizado")

        response = self.client.get("/api/owners/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(owner_id, [owner["id"] for owner in response.data])

        response = self.client.delete(f"/api/owners/{owner_id}/")
        self.assertEqual(response.status_code, 204)

    def test_visit_endpoint_registers_attention_and_marks_appointment_attended(self):
        appointment = self.client.post(
            "/api/appointments/",
            {
                "pet": self.pet.id,
                "professional": self.professional.id,
                "consultation_type": self.consultation_type.id,
                "starts_at": self.starts_at.isoformat(),
            },
            format="json",
        )
        appointment_id = appointment.data["id"]

        response = self.client.post(
            "/api/visits/",
            {
                "pet": self.pet.id,
                "professional": self.professional.id,
                "appointment": appointment_id,
                "reason": "Control general",
                "diagnosis": "Paciente saludable",
                "treatment": "Continuar cuidados preventivos",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        appointment_response = self.client.get(f"/api/agenda/?date=2026-09-21&professional_id={self.professional.id}")
        self.assertEqual(appointment_response.data["schedules"][0]["appointments"][0]["status"], "ATTENDED")

    def test_consultation_type_other_requires_description(self):
        response = self.client.post(
            "/api/consultation-types/",
            {"name": "Otro", "duration_minutes": 30},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("description", response.data)

        response = self.client.post(
            "/api/consultation-types/",
            {
                "name": "Otro",
                "description": "Consulta solicitada por comportamiento inusual",
                "duration_minutes": 30,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["description"], "Consulta solicitada por comportamiento inusual")

    def test_appointment_can_be_rescheduled_and_recalculates_end(self):
        appointment = self.client.post(
            "/api/appointments/",
            {
                "pet": self.pet.id,
                "professional": self.professional.id,
                "consultation_type": self.consultation_type.id,
                "starts_at": self.starts_at.isoformat(),
            },
            format="json",
        )
        appointment_id = appointment.data["id"]

        response = self.client.put(
            f"/api/appointments/{appointment_id}/",
            {
                "pet": self.pet.id,
                "professional": self.professional.id,
                "consultation_type": self.consultation_type.id,
                "starts_at": timezone.make_aware(datetime(2026, 9, 21, 11, 0)).isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["starts_at"], "2026-09-21T11:00:00-05:00")
        self.assertEqual(response.data["ends_at"], "2026-09-21T11:30:00-05:00")
