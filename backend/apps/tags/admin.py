"""
Admin configuration for tags app.
"""

from django.contrib import admin

from .models import Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """Admin for Tag model."""
    list_display = ['name', 'user', 'color', 'is_predefined', 'create_date_display']
    list_filter = ['is_predefined', 'user']
    search_fields = ['name', 'user__email']
    ordering = ['-is_predefined', 'name']
    
    def create_date_display(self, obj):
        return obj.created_at.strftime('%Y-%m-%d')
    create_date_display.short_description = 'Created'
