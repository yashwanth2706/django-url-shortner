from django.shortcuts import render, redirect, get_object_or_404
from .models import URL, Click
from .forms import ShortenForm
import string, secrets
from django.contrib.gis.geoip2 import GeoIP2
from geoip2.errors import AddressNotFoundError
from django.http import JsonResponse
from django.utils.timezone import localtime

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


def get_client_ip(request):
    """Get the client's real IP address."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def redirect_view(request, short_code):
    """
    Redirects to the original URL and logs a detailed click event.
    """
    url_instance = get_object_or_404(URL, short_code=short_code)
    
    # Get IP address and user agent data
    ip_address = get_client_ip(request)
    user_agent_string = request.META.get('HTTP_USER_AGENT', '')
    user_agent = request.user_agent

    # Initialize geolocation and language data
    country, city, latitude, longitude = None, None, None, None
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', '').split(',')[0]

    # Geolocation lookup
    try:
        g = GeoIP2()
        location_info = g.city(ip_address)
        country = location_info.get('country_name')
        city = location_info.get('city')
        latitude = location_info.get('latitude')
        longitude = location_info.get('longitude')
    except AddressNotFoundError:
        # IP address not found in the database, so we leave location fields as None
        pass
    except Exception as e:
        country, city, latitude, longitude = None, None, None, None
        # print(f"Geolocation error: {e}")

    # Log the detailed click event
    Click.objects.create(
        url=url_instance,
        ip_address=ip_address,
        user_agent=user_agent_string,
        # Parsed User Agent data
        browser=user_agent.browser.family,
        os_type=user_agent.os.family,
        device=user_agent.device.family,
        # Geolocation data
        country=country,
        city=city,
        latitude=latitude,
        longitude=longitude,
        # Language
        language=language,
    )

    # Finally, redirect to the original URL
    return redirect(url_instance.original_url)

def recent_urls(request):
    """
    API endpoint: Return a list of recently created short URLs as JSON.
    """
    urls = URL.objects.order_by('-created_at')[:10]
    data = []
    for url in urls:
            data.append({
                "id": url.id,
                "original_url": url.original_url,
                "short_url": url.get_short_url(request.get_host()),
                "created_at": localtime(url.created_at).isoformat(),
            })
    return JsonResponse({"urls": data})