from django.conf import settings
from django.db import models
from django.utils import timezone
import secrets
import string

def generate_short_code(length: int = 8):
    """Generate a URL-safe short code of `length` using base62-like chars."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

class URL(models.Model):
    """Main model mapping a short code to an original URL."""

    original_url = models.URLField(max_length=2048)
    short_code = models.CharField(max_length=12, unique=True, db_index=True)
    created_at = models.DateTimeField(default=timezone.now)
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
        # If no short_code, create one (ensure uniqueness)
        if not self.short_code:
            for _ in range(5):  # try 5 times then raise
                code = generate_short_code(6)
                if not URL.objects.filter(short_code=code).exists():
                    self.short_code = code
                    break
            else:
                raise ValueError(
                    "Couldn't generate a unique short code; try a larger length"
                )
        super().save(*args, **kwargs)

    def get_short_url(self, site_domain: str):
        """Return the full short URL for a given site domain (e.g. example.com)."""
        return f"https://{site_domain}/{self.short_code}"


class Click(models.Model):
    """Store click events for analytics."""

    url = models.ForeignKey(URL, on_delete=models.CASCADE, related_name='clicks')
    timestamp = models.DateTimeField(default=timezone.now)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=['url', 'timestamp'])]
