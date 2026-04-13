"""
Management command: python manage.py seed_crops

Seeds the Crop table with all vegetables, fruits, and other commodities
traded at Kalimati Market. The name_nepali values are chosen so the scraper's
substring-matching algorithm correctly groups all site variants to one record.

Examples of grouping:
  "आलु रातो", "आलु रातो(भारतीय)"          → Crop "आलु"
  "गाजर(लोकल)", "गाजर(तराई)"              → Crop "गाजर"
  "च्याउ(कन्य)", "राजा च्याउ", ...        → Crop "च्याउ"
  "खु्र्सानी सुकेको", "खुर्सानी हरियो(बुलेट)" → Crop "खुर्सानी"
     (scraper normalises the ु् variant before matching)
"""
from django.core.management.base import BaseCommand


# ---------------------------------------------------------------------------
# Crop seed data
# Each tuple: (name_nepali, name_english, category, unit, emoji)
# name_nepali must be a substring of every Kalimati commodity it should match.
# ---------------------------------------------------------------------------
CROPS = [
    # ── VEGETABLES ──────────────────────────────────────────────────────────
    # Already seeded in initial fixtures — kept here for idempotency
    ("आलु",          "Potato",          "VEGETABLE", "kg",    "🥔"),
    ("गोलभेंडा",     "Tomato",          "VEGETABLE", "kg",    "🍅"),
    ("प्याज",        "Onion",           "VEGETABLE", "kg",    "🧅"),
    ("काउली",        "Cauliflower",     "VEGETABLE", "kg",    "🥦"),

    # New vegetables
    ("ब्रोकाउली",   "Broccoli",        "VEGETABLE", "kg",    "🥦"),
    ("गाजर",         "Carrot",          "VEGETABLE", "kg",    "🥕"),
    ("बन्दा",        "Cabbage",         "VEGETABLE", "kg",    "🥬"),
    ("मूला",         "Radish",          "VEGETABLE", "kg",    "🌱"),
    ("भन्टा",        "Eggplant",        "VEGETABLE", "kg",    "🍆"),
    ("बोडी",         "Runner Bean",     "VEGETABLE", "kg",    "🫘"),
    ("मटरकोशा",     "Green Peas",      "VEGETABLE", "kg",    "🫛"),
    ("सिमी",         "Beans",           "VEGETABLE", "kg",    "🫘"),
    ("करेला",        "Bitter Gourd",    "VEGETABLE", "kg",    "🥒"),
    ("लौका",         "Bottle Gourd",    "VEGETABLE", "kg",    "🫙"),
    ("परवर",         "Pointed Gourd",   "VEGETABLE", "kg",    "🌿"),
    ("चिचिण्डो",    "Snake Gourd",     "VEGETABLE", "kg",    "🌿"),
    ("घिरौला",       "Sponge Gourd",    "VEGETABLE", "kg",    "🌿"),
    ("फर्सी",        "Pumpkin",         "VEGETABLE", "kg",    "🎃"),
    ("भिण्डी",       "Okra",            "VEGETABLE", "kg",    "🌿"),
    ("सखरखण्ड",     "Sweet Potato",    "VEGETABLE", "kg",    "🍠"),
    ("बरेला",        "Ivy Gourd",       "VEGETABLE", "kg",    "🌿"),
    ("पिंडालू",      "Taro",            "VEGETABLE", "kg",    "🌿"),
    ("स्कूस",        "Chayote",         "VEGETABLE", "kg",    "🌿"),
    ("काक्रो",       "Cucumber",        "VEGETABLE", "kg",    "🥒"),
    ("च्याउ",        "Mushroom",        "VEGETABLE", "kg",    "🍄"),
    ("ब्रोकाउली",   "Broccoli",        "VEGETABLE", "kg",    "🥦"),
    ("कुरीलो",       "Asparagus",       "VEGETABLE", "kg",    "🌿"),
    ("न्यूरो",       "Fiddlehead Fern", "VEGETABLE", "kg",    "🌿"),
    ("चुकुन्दर",    "Beetroot",        "VEGETABLE", "kg",    "🟣"),
    ("सजिवन",        "Drumstick",       "VEGETABLE", "kg",    "🌿"),
    ("कोइरालो",      "Koiralo",         "VEGETABLE", "kg",    "🌸"),
    ("ग्याठ कोबी",  "Kohlrabi",        "VEGETABLE", "kg",    "🥬"),
    ("सेलरी",        "Celery",          "VEGETABLE", "kg",    "🌿"),
    ("पार्सले",      "Parsley",         "VEGETABLE", "kg",    "🌿"),
    ("पुदीना",       "Mint",            "VEGETABLE", "kg",    "🌿"),

    # Greens / साग — name must be substring of site's "XYZको साग" or "XYZ साग"
    ("रायो साग",     "Mustard Greens",  "VEGETABLE", "kg",    "🥬"),
    ("पालूगो साग",   "Spinach Greens",  "VEGETABLE", "kg",    "🥬"),
    ("चमसूर",        "Garden Cress",    "VEGETABLE", "kg",    "🌿"),
    ("तोरी",         "Mustard Leaf",    "VEGETABLE", "kg",    "🌿"),
    ("मेथी",         "Fenugreek",       "VEGETABLE", "kg",    "🌿"),
    ("सौफ",          "Fennel Greens",   "VEGETABLE", "kg",    "🌿"),
    ("जिरी",         "Jiri Herb",       "VEGETABLE", "kg",    "🌿"),
    ("बकूला",        "Bakula",          "VEGETABLE", "kg",    "🌿"),
    ("तरुल",         "Yam",             "VEGETABLE", "kg",    "🌿"),

    # Spices / condiments
    ("अदुवा",        "Ginger",          "VEGETABLE", "kg",    "🫚"),
    ("खुर्सानी",     "Chilli",          "VEGETABLE", "kg",    "🌶️"),
    ("लसुन",         "Garlic",          "VEGETABLE", "kg",    "🧄"),
    ("धनिया",        "Coriander",       "VEGETABLE", "kg",    "🌿"),
    ("छ्यापी",       "Leek",            "VEGETABLE", "kg",    "🌱"),

    # ── FRUITS ──────────────────────────────────────────────────────────────
    ("स्याउ",        "Apple",           "FRUIT",     "kg",    "🍎"),
    ("केरा",         "Banana",          "FRUIT",     "dozen", "🍌"),
    ("कागती",        "Lemon",           "FRUIT",     "kg",    "🍋"),
    ("अनार",         "Pomegranate",     "FRUIT",     "kg",    "🍎"),
    ("अंगुर",        "Grapes",          "FRUIT",     "kg",    "🍇"),
    ("सुन्तला",      "Mandarin Orange", "FRUIT",     "kg",    "🍊"),
    ("तरबुजा",       "Watermelon",      "FRUIT",     "kg",    "🍉"),
    ("कटहर",         "Jackfruit",       "FRUIT",     "kg",    "🍈"),
    ("नासपाती",      "Pear",            "FRUIT",     "kg",    "🍐"),
    ("मेवा",         "Papaya",          "FRUIT",     "kg",    "🍑"),
    ("स्ट्रबेरी",   "Strawberry",      "FRUIT",     "kg",    "🍓"),
    ("किवि",         "Kiwi",            "FRUIT",     "kg",    "🥝"),
    ("आभोकाडो",      "Avocado",         "FRUIT",     "kg",    "🥑"),

    # ── OTHER ────────────────────────────────────────────────────────────────
    ("इमली",         "Tamarind",        "OTHER",     "kg",    "🌿"),
    ("तामा",         "Bamboo Shoot",    "OTHER",     "kg",    "🌿"),
    ("तोफु",         "Tofu",            "OTHER",     "kg",    "🧈"),
    ("गुन्दुक",      "Gundruk",         "OTHER",     "kg",    "🌿"),
    ("माछा",         "Fish",            "OTHER",     "kg",    "🐟"),
]


class Command(BaseCommand):
    help = "Seed Crop table with all Kalimati market vegetables, fruits and other items"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing Crop records before seeding (USE WITH CAUTION)",
        )

    def handle(self, *args, **options):
        from apps.crops.models import Crop

        if options["reset"]:
            count = Crop.objects.count()
            Crop.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {count} existing crop records."))

        created_count = 0
        skipped_count = 0

        # Deduplicate the CROPS list on name_nepali (in case of duplicates in the list)
        seen = set()
        unique_crops = []
        for row in CROPS:
            if row[0] not in seen:
                seen.add(row[0])
                unique_crops.append(row)

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f"\nSeeding {len(unique_crops)} crops into the database...\n"
            )
        )

        for name_nepali, name_english, category, unit, emoji in unique_crops:
            _, created = Crop.objects.get_or_create(
                name_nepali=name_nepali,
                defaults={
                    "name_english": name_english,
                    "category": category,
                    "unit": unit,
                    "emoji": emoji,
                    "is_active": True,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(
                    f"  {self.style.SUCCESS('+')} {emoji}  {name_nepali:<20} ({name_english})"
                )
            else:
                skipped_count += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Created : {created_count} new crops"))
        if skipped_count:
            self.stdout.write(f"Skipped : {skipped_count} already existed")
        self.stdout.write(
            self.style.SUCCESS(
                f"Total in DB: {Crop.objects.filter(is_active=True).count()} active crops\n"
            )
        )
