#!/usr/bin/env python3
"""
Convert GeoJSON files to KML format.

This script converts validated GeoJSON files to KML format for use in
Google Earth, ArcGIS, and other GIS software. Styling matches the web viewer.
"""

import os
import sys
import json
from pathlib import Path

try:
    import simplekml
except ImportError:
    print("Error: simplekml package not found.")
    print("Please install it with: pip install simplekml")
    sys.exit(1)


# Color definitions matching the web viewer
STYLES = {
    'tanjoretanks-updated': {
        'color': '280ec2',  # Blue for tanks
        'width': 2,
        'fill': True,
        'fill_opacity': 0.3
    },
    'canals': {
        'color': '5897a6',  # Light blue for canals
        'width': 3,
        'fill': False
    },
    'railways': {
        'color': '000000',  # Black for railways
        'width': 2,
        'fill': False
    },
    'thanjavur': {
        'color': '006400',  # Green for district boundary
        'width': 3,
        'fill': False
    }
}


def hex_to_kml_color(hex_color, opacity=255):
    """
    Convert hex color to KML color format (aabbggrr).

    Args:
        hex_color: Hex color string (e.g., '280ec2')
        opacity: Alpha value (0-255), default 255 (opaque)

    Returns:
        KML color string in aabbggrr format
    """
    # KML uses aabbggrr format
    # Reverse RGB to BGR and add alpha
    r = hex_color[0:2]
    g = hex_color[2:4]
    b = hex_color[4:6]
    alpha = f"{opacity:02x}"
    return f"{alpha}{b}{g}{r}"


def create_kml_style(kml, style_config, style_name):
    """
    Create a KML style from configuration.

    Args:
        kml: simplekml.Kml object
        style_config: Style configuration dictionary
        style_name: Name for the style

    Returns:
        Style object
    """
    style = simplekml.Style()

    # Line style
    color = style_config.get('color', '000000')
    width = style_config.get('width', 2)
    style.linestyle.color = hex_to_kml_color(color)
    style.linestyle.width = width

    # Polygon style (for filled geometries)
    if style_config.get('fill', False):
        fill_opacity = int(style_config.get('fill_opacity', 0.3) * 255)
        style.polystyle.color = hex_to_kml_color(color, fill_opacity)
        style.polystyle.outline = 1
    else:
        style.polystyle.fill = 0
        style.polystyle.outline = 1

    return style


def convert_coordinates(coords, geometry_type):
    """
    Convert GeoJSON coordinates to KML format.

    GeoJSON uses [lon, lat] or [lon, lat, alt].
    KML uses (lon, lat, alt) tuples.

    Args:
        coords: GeoJSON coordinate array
        geometry_type: Type of geometry

    Returns:
        Coordinates in KML format
    """
    if geometry_type == 'Point':
        return [(coords[0], coords[1], coords[2] if len(coords) > 2 else 0)]

    elif geometry_type in ['LineString', 'MultiPoint']:
        return [(pt[0], pt[1], pt[2] if len(pt) > 2 else 0) for pt in coords]

    elif geometry_type == 'Polygon':
        # Return list of rings, each ring is a list of coordinate tuples
        return [[(pt[0], pt[1], pt[2] if len(pt) > 2 else 0) for pt in ring] for ring in coords]

    elif geometry_type == 'MultiLineString':
        # Return list of linestrings
        return [[((pt[0], pt[1], pt[2] if len(pt) > 2 else 0)) for pt in line] for line in coords]

    elif geometry_type == 'MultiPolygon':
        # Return list of polygons, each polygon is a list of rings
        return [[[(pt[0], pt[1], pt[2] if len(pt) > 2 else 0) for pt in ring] for ring in polygon] for polygon in coords]

    return coords


def add_feature_to_kml(kml_container, feature, style):
    """
    Add a GeoJSON feature to a KML container.

    Args:
        kml_container: KML folder or document to add feature to
        feature: GeoJSON feature dictionary
        style: KML style to apply
    """
    geometry = feature.get('geometry', {})
    properties = feature.get('properties', {})
    geom_type = geometry.get('type')
    coords = geometry.get('coordinates')

    if not coords:
        return

    # Get feature name (use id or first property)
    name = properties.get('name') or properties.get('id') or f"{geom_type} feature"

    # Create description from properties
    description = ""
    if properties:
        description = "<![CDATA["
        description += "<table>"
        for key, value in properties.items():
            description += f"<tr><th>{key}</th><td>{value}</td></tr>"
        description += "</table>"
        description += "]]>"

    # Add geometry based on type
    if geom_type == 'Point':
        pnt = kml_container.newpoint(name=name, coords=[convert_coordinates(coords, geom_type)])
        pnt.description = description
        pnt.style = style

    elif geom_type == 'LineString':
        line = kml_container.newlinestring(name=name)
        line.coords = convert_coordinates(coords, geom_type)
        line.description = description
        line.style = style

    elif geom_type == 'Polygon':
        pol = kml_container.newpolygon(name=name)
        kml_coords = convert_coordinates(coords, geom_type)
        pol.outerboundaryis = kml_coords[0]
        if len(kml_coords) > 1:
            pol.innerboundaryis = kml_coords[1:]
        pol.description = description
        pol.style = style

    elif geom_type == 'MultiLineString':
        for i, line_coords in enumerate(convert_coordinates(coords, geom_type)):
            line = kml_container.newlinestring(name=f"{name} [{i+1}]")
            line.coords = line_coords
            line.description = description
            line.style = style

    elif geom_type == 'MultiPolygon':
        for i, polygon_coords in enumerate(convert_coordinates(coords, geom_type)):
            pol = kml_container.newpolygon(name=f"{name} [{i+1}]")
            pol.outerboundaryis = polygon_coords[0]
            if len(polygon_coords) > 1:
                pol.innerboundaryis = polygon_coords[1:]
            pol.description = description
            pol.style = style

    elif geom_type == 'MultiPoint':
        for i, point_coords in enumerate(convert_coordinates(coords, geom_type)):
            pnt = kml_container.newpoint(name=f"{name} [{i+1}]", coords=[point_coords])
            pnt.description = description
            pnt.style = style


def convert_geojson_to_kml(geojson_path, kml_path, style_config):
    """
    Convert a GeoJSON file to KML format.

    Args:
        geojson_path: Path to input GeoJSON file
        kml_path: Path to output KML file
        style_config: Style configuration dictionary

    Returns:
        Tuple of (success: bool, message: str, feature_count: int)
    """
    try:
        # Load GeoJSON
        with open(geojson_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if data.get('type') != 'FeatureCollection':
            return False, "Not a FeatureCollection", 0

        features = data.get('features', [])
        if not features:
            return False, "No features found", 0

        # Create KML document
        kml = simplekml.Kml()
        kml.document.name = geojson_path.stem

        # Create style
        style = create_kml_style(kml, style_config, geojson_path.stem)

        # Add description to document
        description = f"Converted from {geojson_path.name}\n"
        description += f"Total features: {len(features)}"
        kml.document.description = description

        # Add each feature
        for feature in features:
            add_feature_to_kml(kml.document, feature, style)

        # Save KML
        kml.save(str(kml_path))

        return True, "Success", len(features)

    except Exception as e:
        return False, f"Error: {e}", 0


def main():
    """Main conversion function."""
    print("=" * 70)
    print("Format Converter - GeoJSON to KML")
    print("=" * 70)
    print()

    # Determine directories
    script_dir = Path(__file__).parent
    validated_dir = script_dir.parent / 'data' / 'validated'
    kml_dir = script_dir.parent / 'data' / 'kml'

    # Create output directory
    kml_dir.mkdir(parents=True, exist_ok=True)

    # Find validated GeoJSON files
    geojson_files = sorted(validated_dir.glob('*.geojson'))

    if not geojson_files:
        print(f"✗ No validated GeoJSON files found in {validated_dir}")
        print()
        print("Please run validate_geojson.py first to validate the files.")
        return 1

    print(f"Found {len(geojson_files)} file(s) to convert")
    print()

    # Convert each file
    results = []
    for geojson_path in geojson_files:
        print(f"Converting: {geojson_path.name}")

        # Get base name without extension
        base_name = geojson_path.stem

        # Get style configuration (use default if not found)
        style_config = STYLES.get(base_name, {
            'color': '0000ff',
            'width': 2,
            'fill': False
        })

        # Convert to KML
        kml_path = kml_dir / f"{base_name}.kml"
        success, message, feature_count = convert_geojson_to_kml(
            geojson_path, kml_path, style_config
        )

        if success:
            file_size = os.path.getsize(kml_path) / 1024
            print(f"  ✓ {message}")
            print(f"    Features: {feature_count}")
            print(f"    Size: {file_size:.1f} KB")
            print(f"    → Saved to: {kml_path.name}")
        else:
            print(f"  ✗ {message}")

        print()
        results.append((base_name, success, message, feature_count))

    # Summary
    print("=" * 70)
    print("Conversion Summary")
    print("=" * 70)

    successful = sum(1 for _, success, _, _ in results if success)
    total = len(results)
    total_features = sum(count for _, success, _, count in results if success)

    for name, success, message, count in results:
        status = "✓" if success else "✗"
        if success:
            print(f"  {status} {name}.kml ({count} features)")
        else:
            print(f"  {status} {name}: {message}")

    print()
    print(f"Total: {successful}/{total} files converted successfully")
    print(f"Total features: {total_features}")

    if successful == total:
        print()
        print("✓ All files converted successfully!")
        print(f"  KML files saved to: {kml_dir}")
        print()
        print("You can now open these files in:")
        print("  • Google Earth")
        print("  • ArcGIS")
        print("  • QGIS")
        print("  • Other GIS software that supports KML format")
        return 0
    else:
        print()
        print("⚠ Some conversions failed. Please check the errors above.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
