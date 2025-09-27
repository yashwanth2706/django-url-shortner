from django import forms
from .models import URL
import string, secrets

def generate_short_code(length: int = 8):
    """Generate a URL-safe short code of `length` using base62-like chars."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

class ShortenForm(forms.ModelForm):

    short_code = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "Enter Alias (optional)"
        })
    )

    class Meta:
        model = URL
        fields = ["original_url", "short_code"]
        widgets = {
            "original_url": forms.URLInput(attrs={
                "class": "form-control",
                "placeholder": "Enter Long URL here"
            })
        }

    def clean_short_code(self):
        alias = self.cleaned_data.get("short_code", "").strip()
        if alias:
            if len(alias) < 5:
                raise forms.ValidationError("Alias must be at least 5 characters long.")
            if URL.objects.filter(short_code=alias).exists():
                raise forms.ValidationError("Alias not available, please choose another one.")
        return alias

    def save(self, commit=True):
        instance = super().save(commit=False)
        if not instance.short_code:  # If user didn’t enter alias
            instance.short_code = generate_short_code()
        if commit:
            instance.save()
        return instance
