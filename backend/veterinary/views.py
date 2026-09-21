from datetime import date

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from veterinary.models import Appointment, Breed, ConsultationType, Owner, Pet, Professional, Species, Visit
from veterinary.serializers import (
    AppointmentSerializer,
    ConsultationTypeSerializer,
    OwnerSerializer,
    PetHistorySerializer,
    PetSerializer,
    ProfessionalSerializer,
    BreedSerializer,
    SpeciesSerializer,
    VisitSerializer,
)
from veterinary.services.appointments import cancel_appointment, get_available_starts, get_daily_schedule


class OwnerListCreateView(generics.ListCreateAPIView):
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer


class OwnerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer


class PetListCreateView(generics.ListCreateAPIView):
    queryset = Pet.objects.select_related("owner", "species", "breed").all()
    serializer_class = PetSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        species_id = self.request.query_params.get("species")
        if search:
            queryset = queryset.filter(name__icontains=search)
        if species_id:
            queryset = queryset.filter(species_id=species_id)
        return queryset


class PetDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Pet.objects.select_related("owner", "species", "breed").all()
    serializer_class = PetSerializer


class SpeciesListCreateView(generics.ListCreateAPIView):
    queryset = Species.objects.all()
    serializer_class = SpeciesSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class SpeciesDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Species.objects.all()
    serializer_class = SpeciesSerializer


class BreedListCreateView(generics.ListCreateAPIView):
    queryset = Breed.objects.select_related("species").all()
    serializer_class = BreedSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        species_id = self.request.query_params.get("species")
        if search:
            queryset = queryset.filter(name__icontains=search)
        if species_id:
            queryset = queryset.filter(species_id=species_id)
        return queryset


class BreedDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Breed.objects.select_related("species").all()
    serializer_class = BreedSerializer


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


class AppointmentHistoryView(generics.ListAPIView):
    queryset = Appointment.objects.select_related("pet", "professional", "consultation_type").all()
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        search = self.request.query_params.get("search")
        professional_id = self.request.query_params.get("professional_id")
        pet_id = self.request.query_params.get("pet_id")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if status_filter and status_filter != "ALL":
            queryset = queryset.filter(status=status_filter)
        if search:
            queryset = queryset.filter(
                Q(pet__name__icontains=search)
                | Q(professional__full_name__icontains=search)
                | Q(consultation_type__name__icontains=search)
            )
        if professional_id:
            queryset = queryset.filter(professional_id=professional_id)
        if pet_id:
            queryset = queryset.filter(pet_id=pet_id)
        if date_from:
            queryset = queryset.filter(starts_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(starts_at__date__lte=date_to)
        return queryset.order_by("-starts_at")


class AppointmentAvailabilityView(APIView):
    def get(self, request):
        try:
            requested_date = date.fromisoformat(request.query_params["date"])
            professional_id = int(request.query_params["professional_id"])
            duration_minutes = int(request.query_params["duration_minutes"])
            pet_id = int(request.query_params["pet_id"]) if request.query_params.get("pet_id") else None
        except (KeyError, TypeError, ValueError):
            return Response({"detail": "date, professional_id y duration_minutes son obligatorios."}, status=400)
        starts = get_available_starts(day=requested_date, professional=professional_id, duration_minutes=duration_minutes, pet=pet_id)
        return Response({"date": requested_date, "starts_at": starts})


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
                "work_intervals": [
                    {"starts_at": starts_at, "ends_at": ends_at}
                    for starts_at, ends_at in schedule["work_intervals"]
                ],
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
