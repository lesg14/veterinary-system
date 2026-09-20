from rest_framework import serializers

from veterinary.models import Appointment, Owner, Pet, Professional, Visit
from veterinary.services.appointments import create_appointment


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            "id",
            "pet",
            "professional",
            "consultation_type",
            "starts_at",
            "ends_at",
            "status",
            "notes",
        ]
        read_only_fields = ["id", "ends_at", "status"]

    def create(self, validated_data):
        return create_appointment(**validated_data)


class OwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Owner
        fields = ["id", "full_name", "identification", "phone", "email", "address", "is_active"]
        read_only_fields = ["id"]


class PetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = [
            "id",
            "owner",
            "name",
            "species",
            "breed",
            "sex",
            "birth_date",
            "vital_status",
            "death_date",
            "notes",
            "is_active",
        ]
        read_only_fields = ["id"]


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


class VisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = [
            "id",
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
        read_only_fields = fields


class PetHistorySerializer(serializers.ModelSerializer):
    appointments = AppointmentSerializer(many=True, read_only=True)
    visits = VisitSerializer(many=True, read_only=True)

    class Meta:
        model = Pet
        fields = [
            "id",
            "name",
            "species",
            "breed",
            "vital_status",
            "appointments",
            "visits",
        ]
        read_only_fields = fields
