from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="payment_status",
            field=models.CharField(
                choices=[("UNPAID", "Unpaid"), ("PAID", "Paid"), ("FAILED", "Failed")],
                default="UNPAID",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="payment_method",
            field=models.CharField(
                choices=[("PENDING", "Pending"), ("ESEWA", "eSewa"), ("CASH", "Cash")],
                default="PENDING",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="esewa_transaction_id",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="order",
            name="esewa_ref_id",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="order",
            name="amount_paid",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
