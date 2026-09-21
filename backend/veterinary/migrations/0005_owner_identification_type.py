from django.db import migrations, models
from django.core.validators import RegexValidator


class Migration(migrations.Migration):
    dependencies = [("veterinary", "0004_seed_canine_feline_breeds")]

    operations = [
        migrations.AddField(
            model_name="owner",
            name="identification_type",
            field=models.CharField(
                choices=[
                    ("CC", "Cédula de ciudadanía"),
                    ("CE", "Cédula de extranjería"),
                    ("PASSPORT", "Pasaporte"),
                    ("NIT", "NIT"),
                ],
                default="CC",
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name="owner",
            name="phone",
            field=models.CharField(
                max_length=10,
                validators=[
                    RegexValidator(
                        "^\\d{10}$",
                        "El teléfono debe contener exactamente 10 números.",
                    )
                ],
            ),
        ),
    ]
