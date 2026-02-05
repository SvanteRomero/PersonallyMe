"""
Serializers for Tag model.
"""

from rest_framework import serializers

from .models import Tag


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model."""

    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'is_predefined']
        read_only_fields = ['id', 'is_predefined']

    def validate_name(self, value):
        """Validate tag name is not empty."""
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Tag name cannot be empty.')
        return value

    def validate_color(self, value):
        """Validate color is a valid hex code."""
        if not value.startswith('#') or len(value) != 7:
            raise serializers.ValidationError('Color must be a valid hex code (e.g., #FF0000).')
        return value
