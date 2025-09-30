from django.conf import settings
from django.db import models, IntegrityError, transaction
from django.utils import timezone
import string, secrets

def generate_short_code(length: int = 8):
    """Generate a URL-safe short code of `length` using base62-like chars."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

class URL(models.Model):
    """Main model mapping a short code to an original URL."""

    expiry = models.DateTimeField(null=True, blank=True, default=None)
    is_deleted = models.BooleanField(default=False)
    original_url = models.URLField(max_length=2048)
    short_code = models.CharField(max_length=12, unique=True, db_index=True)
    created_at = models.DateTimeField(default=timezone.now)
    click_count = models.IntegerField(default=0)  # stored in DB
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text="Optional owner of the short URL",
    )

    class Meta:
        indexes = [models.Index(fields=['short_code'])]

    def save(self, *args, **kwargs):
        """Generate a unique short_code safely before saving."""
        if not self.short_code:
            short_code_length = 8
            max_attempts = 10  # avoid infinite loops

            for attempt in range(max_attempts):
                code = generate_short_code(short_code_length)
                try:
                    with transaction.atomic():  # atomic save to avoid race conditions
                        self.short_code = code
                        super().save(*args, **kwargs)
                    break  # saved successfully
                except IntegrityError:
                    # Collision occurred, try a slightly longer code next
                    short_code_length = min(short_code_length + 1, 12)
            else:
                # Extremely rare fallback if all attempts fail
                raise ValueError(
                    "Could not generate a unique short code after multiple attempts. "
                    "Consider increasing code length."
                )
        else:
            super().save(*args, **kwargs)

    def get_short_url(self, site_domain: str) -> str:
        """Return the full short URL for a given site domain (e.g. example.com)."""
        return f"https://{site_domain}/{self.short_code}"

    def increment_click_count(self):
        """Safely increment click count (avoids race conditions)."""
        self.click_count = models.F('click_count') + 1
        self.save(update_fields=['click_count'])

class Click(models.Model):
    """Stores a single click event for a shortened URL."""
    url = models.ForeignKey(URL, on_delete=models.CASCADE, related_name="clicks")
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    country = models.CharField(max_length=100, blank=True, null=True, default="unknown")
    city = models.CharField(max_length=100, blank=True, null=True, default="unknown")
    language = models.CharField(max_length=50, blank=True, default="unknown")
    os_type = models.CharField(max_length=50, blank=True, default="unknown")
    device = models.CharField(max_length=50, blank=True)
    browser = models.CharField(max_length=50, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Click on {self.url.short_code} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
