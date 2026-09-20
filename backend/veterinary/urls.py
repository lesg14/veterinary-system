from django.urls import path

from veterinary.views import (
    AppointmentCancelView,
    AppointmentCreateView,
    DailyAgendaView,
    OwnerDetailView,
    OwnerListCreateView,
    PetDetailView,
    PetHistoryView,
    PetListCreateView,
    ProfessionalDetailView,
    ProfessionalListCreateView,
)


urlpatterns = [
    path("owners/", OwnerListCreateView.as_view(), name="owner-list-create"),
    path("owners/<int:pk>/", OwnerDetailView.as_view(), name="owner-detail"),
    path("pets/", PetListCreateView.as_view(), name="pet-list-create"),
    path("pets/<int:pk>/", PetDetailView.as_view(), name="pet-detail"),
    path("professionals/", ProfessionalListCreateView.as_view(), name="professional-list-create"),
    path("professionals/<int:pk>/", ProfessionalDetailView.as_view(), name="professional-detail"),
    path("appointments/", AppointmentCreateView.as_view(), name="appointment-create"),
    path(
        "appointments/<int:appointment_id>/cancel/",
        AppointmentCancelView.as_view(),
        name="appointment-cancel",
    ),
    path("agenda/", DailyAgendaView.as_view(), name="daily-agenda"),
    path("pets/<int:pet_id>/history/", PetHistoryView.as_view(), name="pet-history"),
]
