from datetime import datetime, time, timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from veterinary.models import Breed, ConsultationType, Owner, Pet, Professional, Species


class VeterinaryApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        owner = Owner.objects.create(full_name="Ana Torres", phone="3000000000")
        cls.species, _ = Species.objects.get_or_create(name="Canina")
        cls.breed, _ = Breed.objects.get_or_create(species=cls.species, name="Mestizo")
        cls.pet = Pet.objects.create(owner=owner, name="Luna", species=cls.species, breed=cls.breed)
        cls.professional = Professional.objects.create(
            full_name="Dra. Laura Gomez",
            professional_id="1234567",
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

    def test_pet_cannot_overlap_appointments_across_professionals(self):
        other_professional = Professional.objects.create(
            full_name="Dr. Carlos Perez",
            professional_id="1234569",
        )
        first = self.client.post(
            "/api/appointments/",
            {
                "pet": self.pet.id,
                "professional": self.professional.id,
                "consultation_type": self.consultation_type.id,
                "starts_at": self.starts_at.isoformat(),
            },
            format="json",
        )
        self.assertEqual(first.status_code, 201)
        second = self.client.post(
            "/api/appointments/",
            {
                "pet": self.pet.id,
                "professional": other_professional.id,
                "consultation_type": self.consultation_type.id,
                "starts_at": (self.starts_at + timedelta(minutes=15)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(second.status_code, 400)
        self.assertIn("starts_at", second.data)

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
        self.assertEqual(
            response.data["work_intervals"],
            [
                {"starts_at": self.starts_at.replace(hour=8, minute=0), "ends_at": self.starts_at.replace(hour=12, minute=0)},
                {"starts_at": self.starts_at.replace(hour=13, minute=0), "ends_at": self.starts_at.replace(hour=18, minute=0)},
            ],
        )

    def test_appointment_history_endpoint_filters_all_statuses(self):
        response = self.client.get("/api/appointments/history/?status=ALL&search=Luna")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

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
        self.assertEqual(appointment.status_code, 201)
        response = self.client.get("/api/appointments/history/?status=SCHEDULED&pet_id=%s" % self.pet.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["pet_name"], "Luna")

    def test_appointment_availability_endpoint_uses_duration(self):
        self.client.post(
            "/api/appointments/",
            {
                "pet": self.pet.id,
                "professional": self.professional.id,
                "consultation_type": self.consultation_type.id,
                "starts_at": self.starts_at.isoformat(),
            },
            format="json",
        )
        response = self.client.get(
            "/api/appointments/availability/",
            {
                "date": "2026-09-21",
                "professional_id": self.professional.id,
                "duration_minutes": 60,
            },
        )
        self.assertEqual(response.status_code, 200)
        starts = [value.time() for value in response.data["starts_at"]]
        self.assertNotIn(time(8, 30), starts)
        self.assertIn(time(10, 0), starts)

    def test_owner_crud_endpoints_create_list_update_and_delete(self):
        response = self.client.post(
            "/api/owners/",
            {"full_name": "Carlos Ruiz", "identification_type": "CC", "identification": "1234567", "phone": "3110000000"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        owner_id = response.data["id"]

        response = self.client.put(
            f"/api/owners/{owner_id}/",
            {"full_name": "Carlos Ruiz Actualizado", "identification_type": "CC", "identification": "1234567", "phone": "3110000000"},
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

    def test_professional_validates_identification_phone_and_normalizes_name(self):
        response = self.client.post(
            "/api/professionals/",
            {
                "full_name": "laura gomez",
                "identification_type": "CC",
                "professional_id": "12345678",
                "phone": "3001234567",
                "email": "laura@example.com",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["full_name"], "Laura Gomez")

        invalid = self.client.post(
            "/api/professionals/",
            {
                "full_name": "Otra Persona",
                "identification_type": "CC",
                "professional_id": "ABC123",
                "phone": "300-123",
                "email": "correo-invalido",
            },
            format="json",
        )

        self.assertEqual(invalid.status_code, 400)
        self.assertIn("professional_id", invalid.data)

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

    def test_species_and_breed_catalogs_support_crud_filtering_and_pet_validation(self):
        feline_response = self.client.post(
            "/api/species/",
            {"name": "Felina de prueba"},
            format="json",
        )
        self.assertEqual(feline_response.status_code, 201)
        feline_id = feline_response.data["id"]

        breed_response = self.client.post(
            "/api/breeds/",
            {"species": feline_id, "name": "Siamés"},
            format="json",
        )
        self.assertEqual(breed_response.status_code, 201)
        self.assertEqual(breed_response.data["species_name"], "Felina De Prueba")

        filtered = self.client.get(f"/api/breeds/?species={feline_id}&search=siam")
        self.assertEqual(filtered.status_code, 200)
        self.assertEqual(len(filtered.data), 1)

        invalid_pet = self.client.post(
            "/api/pets/",
            {
                "owner": self.pet.owner_id,
                "name": "Nina",
                "species": feline_id,
                "breed": self.breed.id,
                "vital_status": "ALIVE",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(invalid_pet.status_code, 400)
        self.assertIn("breed", invalid_pet.data)
