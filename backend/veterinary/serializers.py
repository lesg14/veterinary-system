from rest_framework import serializers

from veterinary.models import Appointment, Pet, Visit
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
