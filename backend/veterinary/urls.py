from django.urls import path

from veterinary.views import (
    AppointmentCancelView,
    AppointmentCreateView,
    DailyAgendaView,
    PetHistoryView,
)


urlpatterns = [
    path("appointments/", AppointmentCreateView.as_view(), name="appointment-create"),
    path(
        "appointments/<int:appointment_id>/cancel/",
        AppointmentCancelView.as_view(),
        name="appointment-cancel",
    ),
    path("agenda/", DailyAgendaView.as_view(), name="daily-agenda"),
    path("pets/<int:pet_id>/history/", PetHistoryView.as_view(), name="pet-history"),
]
