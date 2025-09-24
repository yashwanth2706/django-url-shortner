from django.contrib import admin
from .models import URL, Click

@admin.register(URL)
class URLAdmin(admin.ModelAdmin):
    list_display = ('short_code', 'original_url', 'created_at', 'owner')
    search_fields = ('short_code', 'original_url')

@admin.register(Click)
class ClickAdmin(admin.ModelAdmin):
    list_display = ('url', 'timestamp')
    list_filter = ('timestamp',)
