from datetime import date

from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import generics, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from veterinary.models import Appointment, ConsultationType, Owner, Pet, Professional, Visit
from veterinary.serializers import (
    AppointmentSerializer,
    ConsultationTypeSerializer,
    OwnerSerializer,
    PetHistorySerializer,
    PetSerializer,
    ProfessionalSerializer,
    VisitSerializer,
)
from veterinary.services.appointments import cancel_appointment, get_daily_schedule


class OwnerListCreateView(generics.ListCreateAPIView):
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer


class OwnerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer


class PetListCreateView(generics.ListCreateAPIView):
    queryset = Pet.objects.select_related("owner").all()
    serializer_class = PetSerializer


class PetDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Pet.objects.select_related("owner").all()
    serializer_class = PetSerializer


class ProfessionalListCreateView(generics.ListCreateAPIView):
    queryset = Professional.objects.all()
    serializer_class = ProfessionalSerializer


class ProfessionalDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Professional.objects.all()
    serializer_class = ProfessionalSerializer


class ConsultationTypeListCreateView(generics.ListCreateAPIView):
    queryset = ConsultationType.objects.all()
    serializer_class = ConsultationTypeSerializer


class ConsultationTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ConsultationType.objects.all()
    serializer_class = ConsultationTypeSerializer


class VisitListCreateView(generics.ListCreateAPIView):
    queryset = Visit.objects.select_related("pet", "professional", "appointment").all()
    serializer_class = VisitSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        pet_id = self.request.query_params.get("pet_id")
        if pet_id:
            queryset = queryset.filter(pet_id=pet_id)
        return queryset


class VisitDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Visit.objects.select_related("pet", "professional", "appointment").all()
    serializer_class = VisitSerializer


class AppointmentCreateView(APIView):
    def post(self, request):
        serializer = AppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            appointment = serializer.save()
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.message_dict if hasattr(error, "message_dict") else error.messages)
        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_201_CREATED,
        )


class AppointmentDetailView(generics.RetrieveUpdateAPIView):
    queryset = Appointment.objects.select_related("pet", "professional", "consultation_type").all()
    serializer_class = AppointmentSerializer


class AppointmentCancelView(APIView):
    def post(self, request, appointment_id):
        appointment = get_object_or_404(Appointment, pk=appointment_id)
        try:
            cancel_appointment(appointment)
        except DjangoValidationError as error:
            return Response({"detail": error.messages}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AppointmentSerializer(appointment).data)


class DailyAgendaView(APIView):
    def get(self, request):
        requested_date = request.query_params.get("date")
        if not requested_date:
            return Response({"detail": "El parámetro date es obligatorio."}, status=400)
        try:
            agenda_date = date.fromisoformat(requested_date)
        except ValueError:
            return Response({"detail": "date debe usar el formato YYYY-MM-DD."}, status=400)

        professional_id = request.query_params.get("professional_id")
        professional = None
        if professional_id:
            professional = get_object_or_404(Professional, pk=professional_id)
        schedule = get_daily_schedule(day=agenda_date, professional=professional)
        return Response(
            {
                "date": schedule["date"],
                "opening": schedule["opening"],
                "closing": schedule["closing"],
                "schedules": [
                    {
                        "professional_id": item["professional"].id,
                        "professional": item["professional"].full_name,
                        "appointments": AppointmentSerializer(
                            item["appointments"], many=True
                        ).data,
                        "free_slots": item["free_slots"],
                    }
                    for item in schedule["schedules"]
                ],
            }
        )


class PetHistoryView(APIView):
    def get(self, request, pet_id):
        pet = get_object_or_404(
            Pet.objects.prefetch_related("appointments", "visits"),
            pk=pet_id,
        )
        return Response(PetHistorySerializer(pet).data)
