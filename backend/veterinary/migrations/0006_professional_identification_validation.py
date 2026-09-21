from django.db import migrations, models
from django.core.validators import RegexValidator


class Migration(migrations.Migration):
    dependencies = [("veterinary", "0005_owner_identification_type")]

    operations = [
        migrations.AddField(
            model_name="professional",
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
            model_name="professional",
            name="professional_id",
            field=models.CharField(
                max_length=10,
                unique=True,
                validators=[RegexValidator("^\\d{7,10}$", "La identificación debe contener entre 7 y 10 números.")],
            ),
        ),
        migrations.AlterField(
            model_name="professional",
            name="phone",
            field=models.CharField(
                blank=True,
                max_length=10,
                validators=[RegexValidator("^\\d{10}$", "El teléfono debe contener exactamente 10 números.")],
            ),
        ),
    ]
