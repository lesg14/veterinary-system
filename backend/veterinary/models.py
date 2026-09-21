from datetime import time, timedelta

from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import RangeOperators
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Func, Q, Value
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator


CLINIC_OPENING_TIME = time(8, 0)
CLINIC_CLOSING_TIME = time(18, 0)
CANCELLATION_LIMIT = timedelta(hours=2)


class Owner(models.Model):
    class IdentificationType(models.TextChoices):
        CITIZENSHIP_ID = "CC", _("Cédula de ciudadanía")
        FOREIGN_ID = "CE", _("Cédula de extranjería")
        PASSPORT = "PASSPORT", _("Pasaporte")
        NIT = "NIT", _("NIT")

    full_name = models.CharField(max_length=150)
    identification_type = models.CharField(max_length=10, choices=IdentificationType.choices, default=IdentificationType.CITIZENSHIP_ID)
    identification = models.CharField(max_length=30, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=10, validators=[RegexValidator(r"^\d{10}$", "El teléfono debe contener exactamente 10 números.")])
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["full_name"]
        verbose_name = "propietario"
        verbose_name_plural = "propietarios"

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        self.full_name = " ".join(word.capitalize() for word in self.full_name.split())
        self.full_clean()
        return super().save(*args, **kwargs)


class Species(models.Model):
    name = models.CharField(max_length=80, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "especie"
        verbose_name_plural = "especies"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.name = " ".join(word.capitalize() for word in self.name.split())
        self.full_clean()
        return super().save(*args, **kwargs)


class Breed(models.Model):
    species = models.ForeignKey(Species, on_delete=models.PROTECT, related_name="breeds")
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["species", "name"], name="unique_breed_per_species"),
        ]
        verbose_name = "raza"
        verbose_name_plural = "razas"

    def __str__(self):
        return f"{self.name} ({self.species.name})"

    def save(self, *args, **kwargs):
        self.name = " ".join(word.capitalize() for word in self.name.split())
        self.full_clean()
        return super().save(*args, **kwargs)


class Pet(models.Model):
    class VitalStatus(models.TextChoices):
        ALIVE = "ALIVE", _("Viva")
        DECEASED = "DECEASED", _("Fallecida")

    owner = models.ForeignKey(Owner, on_delete=models.PROTECT, related_name="pets")
    name = models.CharField(max_length=100)
    species = models.ForeignKey(Species, on_delete=models.PROTECT, related_name="pets")
    breed = models.ForeignKey(Breed, on_delete=models.PROTECT, related_name="pets")
    sex = models.CharField(max_length=20, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    vital_status = models.CharField(
        max_length=10,
        choices=VitalStatus.choices,
        default=VitalStatus.ALIVE,
    )
    death_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(vital_status="ALIVE", death_date__isnull=True)
                    | Q(vital_status="DECEASED", death_date__isnull=False)
                ),
                name="pet_status_matches_death_date",
            )
        ]
        verbose_name = "mascota"
        verbose_name_plural = "mascotas"

    def clean(self):
        super().clean()
        if self.breed_id and self.species_id and self.breed.species_id != self.species_id:
            raise ValidationError({"breed": "La raza debe pertenecer a la especie seleccionada."})
        if self.species_id and not self.species.is_active:
            raise ValidationError({"species": "La especie está inactiva."})
        if self.breed_id and not self.breed.is_active:
            raise ValidationError({"breed": "La raza está inactiva."})
        if self.vital_status == self.VitalStatus.DECEASED and self.death_date is None:
            raise ValidationError({"death_date": "Una mascota fallecida debe tener fecha de fallecimiento."})
        if self.vital_status == self.VitalStatus.ALIVE and self.death_date is not None:
            raise ValidationError({"death_date": "Una mascota viva no puede tener fecha de fallecimiento."})

    def save(self, *args, **kwargs):
        self.name = " ".join(word.capitalize() for word in self.name.split())
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.species})"


class Professional(models.Model):
    class IdentificationType(models.TextChoices):
        CITIZENSHIP_ID = "CC", _("Cédula de ciudadanía")
        FOREIGN_ID = "CE", _("Cédula de extranjería")
        PASSPORT = "PASSPORT", _("Pasaporte")
        NIT = "NIT", _("NIT")

    full_name = models.CharField(max_length=150)
    identification_type = models.CharField(max_length=10, choices=IdentificationType.choices, default=IdentificationType.CITIZENSHIP_ID)
    professional_id = models.CharField(max_length=10, unique=True, validators=[RegexValidator(r"^\d{7,10}$", "La identificación debe contener entre 7 y 10 números.")])
    specialty = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=10, blank=True, validators=[RegexValidator(r"^\d{10}$", "El teléfono debe contener exactamente 10 números.")])
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["full_name"]
        verbose_name = "profesional"
        verbose_name_plural = "profesionales"

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        self.full_name = " ".join(word.capitalize() for word in self.full_name.split())
        self.full_clean()
        return super().save(*args, **kwargs)


class ConsultationType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.CheckConstraint(
                condition=Q(duration_minutes__gt=0),
                name="consultation_duration_is_positive",
            )
        ]
        verbose_name = "tipo de consulta"
        verbose_name_plural = "tipos de consulta"

    def clean(self):
        super().clean()
        if self.name.strip().lower() == "otro" and not self.description.strip():
            raise ValidationError({"description": "Debe describir el motivo cuando el tipo es Otro."})

    def save(self, *args, **kwargs):
        self.name = " ".join(word.capitalize() for word in self.name.split())
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Appointment(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", _("Programada")
        ATTENDED = "ATTENDED", _("Atendida")
        CANCELED = "CANCELED", _("Cancelada")
        NO_SHOW = "NO_SHOW", _("Inasistencia")

    pet = models.ForeignKey(Pet, on_delete=models.PROTECT, related_name="appointments")
    professional = models.ForeignKey(
        Professional,
        on_delete=models.PROTECT,
        related_name="appointments",
    )
    consultation_type = models.ForeignKey(
        ConsultationType,
        on_delete=models.PROTECT,
        related_name="appointments",
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(editable=False)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.SCHEDULED,
    )
    cancellation_requested_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["starts_at"]
        constraints = [
            ExclusionConstraint(
                name="scheduled_appointments_do_not_overlap",
                expressions=[
                    ("professional", RangeOperators.EQUAL),
                    (
                        Func(
                            "starts_at",
                            "ends_at",
                            Value("[)"),
                            function="TSTZRANGE",
                        ),
                        RangeOperators.OVERLAPS,
                    )
                ],
                condition=Q(status="SCHEDULED"),
                index_type="GIST",
            ),
        ]
        indexes = [
            models.Index(fields=["professional", "starts_at"]),
            models.Index(fields=["pet", "starts_at"]),
        ]
        verbose_name = "cita"
        verbose_name_plural = "citas"

    def calculate_end(self):
        return self.starts_at + timedelta(
            minutes=self.consultation_type.duration_minutes
        )

    def clean(self):
        super().clean()
        errors = {}

        if self.starts_at is None:
            errors["starts_at"] = "La cita debe tener fecha y hora de inicio."
        elif timezone.is_naive(self.starts_at):
            errors["starts_at"] = "La fecha y hora debe incluir zona horaria."
        else:
            calculated_end = self.calculate_end()
            local_start = timezone.localtime(self.starts_at)
            local_end = timezone.localtime(calculated_end)
            if local_start.date() != local_end.date():
                errors["starts_at"] = "La cita debe finalizar el mismo día."
            elif (
                local_start.time() < CLINIC_OPENING_TIME
                or local_end.time() > CLINIC_CLOSING_TIME
            ):
                errors["starts_at"] = "La cita debe estar dentro del horario 08:00-18:00."

        if self.pet_id and self.pet.vital_status == Pet.VitalStatus.DECEASED:
            if self._state.adding and self.status == self.Status.SCHEDULED:
                errors["pet"] = "Una mascota fallecida no admite nuevas citas."

        if self.professional_id and not self.professional.is_active:
            errors["professional"] = "El profesional está inactivo."

        if self.consultation_type_id and not self.consultation_type.is_active:
            errors["consultation_type"] = "El tipo de consulta está inactivo."

        if errors:
            raise ValidationError(errors)

        if self.pk and self.status != self.Status.SCHEDULED:
            return

        overlapping = Appointment.objects.filter(
            professional_id=self.professional_id,
            status=self.Status.SCHEDULED,
            starts_at__lt=self.ends_at,
            ends_at__gt=self.starts_at,
        ).exclude(pk=self.pk)
        if overlapping.exists():
            raise ValidationError(
                {"starts_at": "El profesional ya tiene una cita en ese intervalo."}
            )

    def save(self, *args, **kwargs):
        if self.starts_at is not None and self.consultation_type_id:
            self.ends_at = self.calculate_end()
        self.full_clean()
        return super().save(*args, **kwargs)

    def cancel(self, requested_at=None):
        if self.status != self.Status.SCHEDULED:
            raise ValidationError("Solo se pueden cancelar citas programadas.")

        requested_at = requested_at or timezone.now()
        if timezone.is_naive(requested_at):
            raise ValidationError("La fecha de cancelación debe incluir zona horaria.")

        self.cancellation_requested_at = requested_at
        if requested_at <= self.starts_at - CANCELLATION_LIMIT:
            self.status = self.Status.CANCELED
        else:
            self.status = self.Status.NO_SHOW
        self.save(update_fields=["status", "cancellation_requested_at", "updated_at"])

    def __str__(self):
        return f"{self.pet} - {self.starts_at:%Y-%m-%d %H:%M}"


class Visit(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.PROTECT, related_name="visits")
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.PROTECT,
        related_name="visit",
        null=True,
        blank=True,
    )
    professional = models.ForeignKey(
        Professional,
        on_delete=models.PROTECT,
        related_name="visits",
    )
    attended_at = models.DateTimeField(default=timezone.now)
    reason = models.TextField()
    diagnosis = models.TextField(blank=True)
    treatment = models.TextField(blank=True)
    medications = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-attended_at"]
        verbose_name = "atención registrada"
        verbose_name_plural = "atenciones registradas"

    def clean(self):
        super().clean()
        if self.appointment_id:
            if self.appointment.pet_id != self.pet_id:
                raise ValidationError("La atención debe pertenecer a la mascota de la cita.")
            if self.appointment.professional_id != self.professional_id:
                raise ValidationError(
                    "La atención debe pertenecer al profesional de la cita."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"Atención de {self.pet} - {self.attended_at:%Y-%m-%d}"
