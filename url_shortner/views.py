from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponseRedirect, HttpResponse
from django.conf import settings
from .models import URL, Click
from .forms import ShortenForm

def index(request):
    """Show form to create a shortened URL and results."""
    short_url = None
    if request.method == 'POST':
        form = ShortenForm(request.POST)
        if form.is_valid():
            url_obj = form.save(commit=False)
            # Optionally set owner if user is authenticated
            if request.user.is_authenticated:
                url_obj.owner = request.user
            url_obj.save()
            # Build full short url; in dev use request.get_host()
            short_url = url_obj.get_short_url(request.get_host())
    else:
        form = ShortenForm()
    return render(request, 'index.html', {'form': form, 'short_url': short_url})


def redirect_view(request, short_code):
    """Resolve a short code and redirect to the original URL. Track the
    click."""
    url_obj = get_object_or_404(URL, short_code=short_code) # If url not found raise 404
    # Track click (optional)
    try:
        Click.objects.create(
            url=url_obj,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:1024],
        )
    except Exception:
        # If analytics fail, still redirect — don't raise
        pass
    return HttpResponseRedirect(url_obj.original_url)

