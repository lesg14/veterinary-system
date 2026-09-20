from django.urls import path

from veterinary.views import (
    AppointmentCancelView,
    AppointmentCreateView,
    AppointmentDetailView,
    ConsultationTypeDetailView,
    ConsultationTypeListCreateView,
    DailyAgendaView,
    OwnerDetailView,
    OwnerListCreateView,
    PetDetailView,
    PetHistoryView,
    PetListCreateView,
    ProfessionalDetailView,
    ProfessionalListCreateView,
    VisitDetailView,
    VisitListCreateView,
)


urlpatterns = [
    path("owners/", OwnerListCreateView.as_view(), name="owner-list-create"),
    path("owners/<int:pk>/", OwnerDetailView.as_view(), name="owner-detail"),
    path("pets/", PetListCreateView.as_view(), name="pet-list-create"),
    path("pets/<int:pk>/", PetDetailView.as_view(), name="pet-detail"),
    path("professionals/", ProfessionalListCreateView.as_view(), name="professional-list-create"),
    path("professionals/<int:pk>/", ProfessionalDetailView.as_view(), name="professional-detail"),
    path("consultation-types/", ConsultationTypeListCreateView.as_view(), name="consultation-type-list-create"),
    path("consultation-types/<int:pk>/", ConsultationTypeDetailView.as_view(), name="consultation-type-detail"),
    path("visits/", VisitListCreateView.as_view(), name="visit-list-create"),
    path("visits/<int:pk>/", VisitDetailView.as_view(), name="visit-detail"),
    path("appointments/", AppointmentCreateView.as_view(), name="appointment-create"),
    path("appointments/<int:pk>/", AppointmentDetailView.as_view(), name="appointment-detail"),
    path(
        "appointments/<int:appointment_id>/cancel/",
        AppointmentCancelView.as_view(),
        name="appointment-cancel",
    ),
    path("agenda/", DailyAgendaView.as_view(), name="daily-agenda"),
    path("pets/<int:pet_id>/history/", PetHistoryView.as_view(), name="pet-history"),
]
