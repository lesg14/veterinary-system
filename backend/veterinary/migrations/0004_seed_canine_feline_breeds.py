from django.db import migrations


CANINE_BREEDS = [
    "Affenpinscher",
    "Akita inu",
    "Alaskan malamute",
    "American staffordshire terrier",
    "Australian shepherd",
    "Basenji",
    "Basset hound",
    "Beagle",
    "Bernese mountain dog",
    "Bichón frisé",
    "Bichón maltés",
    "Border collie",
    "Boston terrier",
    "Bóxer",
    "Boyero de Berna",
    "Braco alemán",
    "Briard",
    "Brittany spaniel",
    "Bulldog francés",
    "Bulldog inglés",
    "Bullmastiff",
    "Bull terrier",
    "Cairn terrier",
    "Cane corso",
    "Caniche",
    "Chihuahua",
    "Chow chow",
    "Cocker spaniel americano",
    "Cocker spaniel inglés",
    "Collie",
    "Dachshund",
    "Dálmata",
    "Dóberman",
    "Fila brasileño",
    "Fox terrier",
    "Galgo español",
    "Golden retriever",
    "Gran danés",
    "Husky siberiano",
    "Jack russell terrier",
    "Labrador retriever",
    "Lebrel afgano",
    "Leonberger",
    "Lhasa apso",
    "Mastín napolitano",
    "Mastín tibetano",
    "Mastín español",
    "Mestizo",
    "Papillón",
    "Pastor australiano",
    "Pastor belga malinois",
    "Pastor alemán",
    "Pastor de Shetland",
    "Pastor holandés",
    "Pastor inglés",
    "Pekinés",
    "Pinscher miniatura",
    "Pitbull terrier americano",
    "Pointer inglés",
    "Pomerania",
    "Poodle",
    "Presa canario",
    "Pug",
    "Rhodesian ridgeback",
    "Rottweiler",
    "Samoyedo",
    "San bernardo",
    "Schnauzer gigante",
    "Schnauzer miniatura",
    "Schnauzer estándar",
    "Shar pei",
    "Shiba inu",
    "Shih tzu",
    "Staffordshire bull terrier",
    "Terranova",
    "Terrier escocés",
    "Vizsla",
    "Weimaraner",
    "West highland white terrier",
    "Whippet",
    "Yorkshire terrier",
]

FELINE_BREEDS = [
    "Abisinio",
    "American shorthair",
    "American wirehair",
    "Angora turco",
    "Azul ruso",
    "Bengalí",
    "Birmano",
    "Bombay",
    "British shorthair",
    "Burmés",
    "Burmilla",
    "Cartujo",
    "Cornish rex",
    "Devon rex",
    "Esfinge",
    "Europeo común",
    "Exótico de pelo corto",
    "Fold escocés",
    "Himalayo",
    "Javanés",
    "Korat",
    "LaPerm",
    "Maine coon",
    "Manx",
    "Mestizo",
    "Munchkin",
    "Nebelung",
    "Noruego del bosque",
    "Ocicat",
    "Oriental de pelo corto",
    "Persa",
    "Peterbald",
    "Ragdoll",
    "Ragamuffin",
    "Savannah",
    "Scottish fold",
    "Siamés",
    "Siberiano",
    "Singapura",
    "Somalí",
    "Sphynx",
    "Tonkines",
    "Toyger",
    "Van turco",
]


def seed_breeds(apps, schema_editor):
    Species = apps.get_model("veterinary", "Species")
    Breed = apps.get_model("veterinary", "Breed")

    species_by_name = {
        name: Species.objects.get_or_create(name=name, defaults={"is_active": True})[0]
        for name in ("Canina", "Felina")
    }

    for species_name, breed_names in (
        ("Canina", CANINE_BREEDS),
        ("Felina", FELINE_BREEDS),
    ):
        species = species_by_name[species_name]
        Breed.objects.bulk_create(
            [
                Breed(species=species, name=breed_name, is_active=True)
                for breed_name in breed_names
                if not Breed.objects.filter(species=species, name=breed_name).exists()
            ]
        )


class Migration(migrations.Migration):
    dependencies = [("veterinary", "0003_species_breed_catalogs")]

    operations = [migrations.RunPython(seed_breeds, migrations.RunPython.noop)]
