from rest_framework import serializers

from veterinary.models import Appointment, Breed, ConsultationType, Owner, Pet, Professional, Species, Visit
from veterinary.services.appointments import create_appointment


class AppointmentSerializer(serializers.ModelSerializer):
    pet_name = serializers.CharField(source="pet.name", read_only=True)
    professional_name = serializers.CharField(source="professional.full_name", read_only=True)
    consultation_type_name = serializers.CharField(source="consultation_type.name", read_only=True)
    consultation_duration_minutes = serializers.IntegerField(
        source="consultation_type.duration_minutes",
        read_only=True,
    )

    class Meta:
        model = Appointment
        fields = [
            "id",
            "pet",
            "professional",
            "consultation_type",
            "pet_name",
            "professional_name",
            "consultation_type_name",
            "consultation_duration_minutes",
            "starts_at",
            "ends_at",
            "status",
            "notes",
        ]
        read_only_fields = ["id", "ends_at", "status"]

    def create(self, validated_data):
        return create_appointment(**validated_data)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class OwnerSerializer(serializers.ModelSerializer):
    identification = serializers.RegexField(regex=r"^\d{7,10}$", allow_null=True, allow_blank=True)
    phone = serializers.RegexField(regex=r"^\d{10}$")

    class Meta:
        model = Owner
        fields = ["id", "full_name", "identification_type", "identification", "phone", "email", "address", "is_active"]
        read_only_fields = ["id"]

    def validate_full_name(self, value):
        return " ".join(word.capitalize() for word in value.split())


class PetSerializer(serializers.ModelSerializer):
    species_name = serializers.CharField(source="species.name", read_only=True)
    breed_name = serializers.CharField(source="breed.name", read_only=True)

    class Meta:
        model = Pet
        fields = [
            "id",
            "owner",
            "name",
            "species",
            "species_name",
            "breed",
            "breed_name",
            "sex",
            "birth_date",
            "vital_status",
            "death_date",
            "notes",
            "is_active",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        species = attrs.get("species", getattr(self.instance, "species", None))
        breed = attrs.get("breed", getattr(self.instance, "breed", None))
        if species and not species.is_active:
            raise serializers.ValidationError({"species": "La especie está inactiva."})
        if breed and not breed.is_active:
            raise serializers.ValidationError({"breed": "La raza está inactiva."})
        if species and breed and breed.species_id != species.id:
            raise serializers.ValidationError({"breed": "La raza debe pertenecer a la especie seleccionada."})
        return attrs


class SpeciesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Species
        fields = ["id", "name", "is_active"]
        read_only_fields = ["id"]


class BreedSerializer(serializers.ModelSerializer):
    species_name = serializers.CharField(source="species.name", read_only=True)

    class Meta:
        model = Breed
        fields = ["id", "species", "species_name", "name", "is_active"]
        read_only_fields = ["id", "species_name"]


class ProfessionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Professional
        fields = [
            "id",
            "full_name",
            "professional_id",
            "specialty",
            "phone",
            "email",
            "is_active",
        ]
        read_only_fields = ["id"]


class ConsultationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultationType
        fields = ["id", "name", "description", "duration_minutes", "is_active"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        name = attrs.get("name", getattr(self.instance, "name", ""))
        description = attrs.get("description", getattr(self.instance, "description", ""))
        if name.strip().lower() == "otro" and not description.strip():
            raise serializers.ValidationError(
                {"description": "Debe describir el motivo cuando el tipo es Otro."}
            )
        return attrs


class VisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = [
            "id",
            "pet",
            "appointment",
            "professional",
            "attended_at",
            "reason",
            "diagnosis",
            "treatment",
            "medications",
            "recommendations",
            "notes",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        visit = Visit(**validated_data)
        visit.save()
        if visit.appointment_id and visit.appointment.status == Appointment.Status.SCHEDULED:
            visit.appointment.status = Appointment.Status.ATTENDED
            visit.appointment.save(update_fields=["status", "updated_at"])
        return visit


class PetHistorySerializer(serializers.ModelSerializer):
    species_name = serializers.CharField(source="species.name", read_only=True)
    breed_name = serializers.CharField(source="breed.name", read_only=True)
    appointments = AppointmentSerializer(many=True, read_only=True)
    visits = VisitSerializer(many=True, read_only=True)

    class Meta:
        model = Pet
        fields = [
            "id",
            "name",
            "species_name",
            "breed_name",
            "vital_status",
            "appointments",
            "visits",
        ]
        read_only_fields = fields
