from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponseRedirect, HttpResponse
from django.conf import settings
from django.db.models import F
from .models import URL, Click
from .forms import ShortenForm
import string, secrets

def generate_short_code(length: int = 8):
    """Generate a URL-safe short code of `length` using base62-like chars."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def index(request):
    short_url = None
    if request.method == "POST":
        form = ShortenForm(request.POST)
        if form.is_valid():
            url = form.save(commit=False)
            if request.user.is_authenticated:
                url.owner = request.user
            url.save()  # short_code auto-generated in model if missing
            short_url = url.get_short_url(request.get_host())
    else:
        form = ShortenForm()

    return render(request, "index.html", {"form": form, "short_url": short_url})


def redirect_view(request, short_code):
    """Resolve a short code and redirect to the original URL. Track the click."""
    url_obj = get_object_or_404(URL, short_code=short_code)

    # Track click
    try:
        Click.objects.create(
            url=url_obj,
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:1024],
        )
        URL.objects.filter(pk=url_obj.pk).update(click_count=F("click_count") + 1)
    except Exception:
        pass

    return HttpResponseRedirect(url_obj.original_url)