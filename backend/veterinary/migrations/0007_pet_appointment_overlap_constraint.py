from django.db import migrations, models
from django.db.models import Func, Q, Value
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import RangeOperators


def resolve_existing_pet_overlaps(apps, schema_editor):
    Appointment = apps.get_model("veterinary", "Appointment")
    scheduled = Appointment.objects.filter(status="SCHEDULED").order_by("pet_id", "starts_at", "id")
    retained_by_pet = {}
    for appointment in scheduled.iterator():
        retained = retained_by_pet.setdefault(appointment.pet_id, [])
        if any(
            appointment.starts_at < previous.ends_at
            and appointment.ends_at > previous.starts_at
            for previous in retained
        ):
            appointment.status = "CANCELED"
            appointment.notes = (
                f"{appointment.notes} Cancelada automáticamente durante la migración: "
                "solapamiento previo de citas de la misma mascota."
            ).strip()
            appointment.save(update_fields=["status", "notes", "updated_at"])
        else:
            retained.append(appointment)


class Migration(migrations.Migration):
    dependencies = [("veterinary", "0006_professional_identification_validation")]

    operations = [
        migrations.RunPython(resolve_existing_pet_overlaps, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="appointment",
            constraint=ExclusionConstraint(
                name="pet_scheduled_appointments_do_not_overlap",
                expressions=[
                    ("pet", RangeOperators.EQUAL),
                    (
                        Func(
                            "starts_at",
                            "ends_at",
                            Value("[)"),
                            function="TSTZRANGE",
                        ),
                        RangeOperators.OVERLAPS,
                    ),
                ],
                condition=Q(status="SCHEDULED"),
                index_type="GIST",
            ),
        ),
    ]
