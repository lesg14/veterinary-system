from django.db import migrations, models
import django.db.models.deletion


def migrate_pet_catalog_values(apps, schema_editor):
    Pet = apps.get_model("veterinary", "Pet")
    Species = apps.get_model("veterinary", "Species")
    Breed = apps.get_model("veterinary", "Breed")

    for pet in Pet.objects.all().iterator():
        species, _ = Species.objects.get_or_create(name=pet.species)
        breed_name = pet.breed or "Sin raza registrada"
        breed, _ = Breed.objects.get_or_create(species=species, name=breed_name)
        pet.species_catalog_id = species.id
        pet.breed_catalog_id = breed.id
        pet.save(update_fields=["species_catalog", "breed_catalog"])


def reverse_pet_catalog_values(apps, schema_editor):
    Pet = apps.get_model("veterinary", "Pet")
    for pet in Pet.objects.select_related("species_catalog", "breed_catalog").all().iterator():
        pet.species = pet.species_catalog.name
        pet.breed = pet.breed_catalog.name
        pet.save(update_fields=["species", "breed"])


class Migration(migrations.Migration):
    dependencies = [("veterinary", "0002_remove_appointment_scheduled_appointments_do_not_overlap_and_more")]

    operations = [
        migrations.CreateModel(
            name="Species",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=80, unique=True)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["name"], "verbose_name": "especie", "verbose_name_plural": "especies"},
        ),
        migrations.CreateModel(
            name="Breed",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("is_active", models.BooleanField(default=True)),
                ("species", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="breeds", to="veterinary.species")),
            ],
            options={"ordering": ["name"], "verbose_name": "raza", "verbose_name_plural": "razas"},
        ),
        migrations.AddConstraint(
            model_name="breed",
            constraint=models.UniqueConstraint(fields=("species", "name"), name="unique_breed_per_species"),
        ),
        migrations.AddField(
            model_name="pet",
            name="species_catalog",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name="catalog_pets", to="veterinary.species"),
        ),
        migrations.AddField(
            model_name="pet",
            name="breed_catalog",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name="catalog_pets", to="veterinary.breed"),
        ),
        migrations.RunPython(migrate_pet_catalog_values, reverse_pet_catalog_values),
        migrations.RemoveField(model_name="pet", name="species"),
        migrations.RemoveField(model_name="pet", name="breed"),
        migrations.RenameField(model_name="pet", old_name="species_catalog", new_name="species"),
        migrations.RenameField(model_name="pet", old_name="breed_catalog", new_name="breed"),
        migrations.AlterField(
            model_name="pet",
            name="species",
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="pets", to="veterinary.species"),
        ),
        migrations.AlterField(
            model_name="pet",
            name="breed",
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="pets", to="veterinary.breed"),
        ),
    ]
