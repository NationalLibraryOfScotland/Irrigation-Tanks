#!/usr/bin/env python3
"""
Validate GeoJSON files and generate statistics report.

This script validates downloaded GeoJSON files, checks coordinate validity,
counts features, and generates a validation report.
"""

import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime


def validate_coordinates(coords, geometry_type):
    """
    Validate that coordinates are within valid lat/lon ranges.

    Args:
        coords: Coordinate array (structure depends on geometry type)
        geometry_type: Type of geometry (Point, LineString, Polygon, etc.)

    Returns:
        Tuple of (valid: bool, error_message: str or None)
    """
    def check_point(point):
        """Check a single [lon, lat] point."""
        if len(point) < 2:
            return False, "Point has fewer than 2 coordinates"
        lon, lat = point[0], point[1]
        if not (-180 <= lon <= 180):
            return False, f"Longitude {lon} out of range [-180, 180]"
        if not (-90 <= lat <= 90):
            return False, f"Latitude {lat} out of range [-90, 90]"
        return True, None

    try:
        if geometry_type in ['Point']:
            return check_point(coords)

        elif geometry_type in ['LineString', 'MultiPoint']:
            for point in coords:
                valid, error = check_point(point)
                if not valid:
                    return False, error
            return True, None

        elif geometry_type in ['Polygon', 'MultiLineString']:
            for ring in coords:
                for point in ring:
                    valid, error = check_point(point)
                    if not valid:
                        return False, error
            return True, None

        elif geometry_type in ['MultiPolygon']:
            for polygon in coords:
                for ring in polygon:
                    for point in ring:
                        valid, error = check_point(point)
                        if not valid:
                            return False, error
            return True, None

        else:
            return False, f"Unknown geometry type: {geometry_type}"

    except (IndexError, TypeError) as e:
        return False, f"Coordinate structure error: {e}"


def validate_geojson_file(file_path):
    """
    Validate a single GeoJSON file.

    Args:
        file_path: Path to the GeoJSON file

    Returns:
        Dictionary with validation results and statistics
    """
    result = {
        'file': file_path.name,
        'valid': False,
        'errors': [],
        'warnings': [],
        'stats': {}
    }

    try:
        # Load the file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Check if it's a FeatureCollection
        if data.get('type') != 'FeatureCollection':
            result['errors'].append(f"Root type is '{data.get('type')}', expected 'FeatureCollection'")
            return result

        # Check for features array
        features = data.get('features')
        if not isinstance(features, list):
            result['errors'].append("'features' is not an array")
            return result

        if len(features) == 0:
            result['warnings'].append("FeatureCollection contains 0 features")

        # Validate each feature
        geometry_types = {}
        coordinate_errors = []

        for i, feature in enumerate(features):
            # Check feature structure
            if feature.get('type') != 'Feature':
                result['errors'].append(f"Feature {i}: type is not 'Feature'")
                continue

            geometry = feature.get('geometry')
            if not geometry:
                result['warnings'].append(f"Feature {i}: missing geometry")
                continue

            geom_type = geometry.get('type')
            if not geom_type:
                result['errors'].append(f"Feature {i}: missing geometry type")
                continue

            # Count geometry types
            geometry_types[geom_type] = geometry_types.get(geom_type, 0) + 1

            # Validate coordinates
            coords = geometry.get('coordinates')
            if coords:
                valid, error = validate_coordinates(coords, geom_type)
                if not valid and len(coordinate_errors) < 5:  # Limit error reports
                    coordinate_errors.append(f"Feature {i}: {error}")

        # Add coordinate errors to result
        if coordinate_errors:
            result['errors'].extend(coordinate_errors)
            if len(coordinate_errors) >= 5:
                result['warnings'].append("Additional coordinate errors suppressed")

        # Collect statistics
        result['stats'] = {
            'feature_count': len(features),
            'geometry_types': geometry_types,
            'has_crs': 'crs' in data,
            'file_size_kb': os.path.getsize(file_path) / 1024
        }

        # Determine if valid
        result['valid'] = len(result['errors']) == 0

    except json.JSONDecodeError as e:
        result['errors'].append(f"JSON parsing error: {e}")
    except Exception as e:
        result['errors'].append(f"Unexpected error: {e}")

    return result


def main():
    """Main validation function."""
    print("=" * 70)
    print("GeoJSON Validator - Irrigation Tanks Data")
    print("=" * 70)
    print()

    # Determine directories
    script_dir = Path(__file__).parent
    raw_dir = script_dir.parent / 'data' / 'raw'
    validated_dir = script_dir.parent / 'data' / 'validated'
    reports_dir = script_dir.parent / 'reports'

    # Create output directories
    validated_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    # Find all GeoJSON files
    geojson_files = sorted(raw_dir.glob('*.geojson'))

    if not geojson_files:
        print(f"✗ No GeoJSON files found in {raw_dir}")
        print()
        print("Please run download_geojson.py first to download the files.")
        return 1

    print(f"Found {len(geojson_files)} GeoJSON file(s) to validate")
    print()

    # Validate each file
    results = []
    for file_path in geojson_files:
        print(f"Validating: {file_path.name}")
        result = validate_geojson_file(file_path)
        results.append(result)

        if result['valid']:
            print(f"  ✓ Valid GeoJSON")
            print(f"    Features: {result['stats']['feature_count']}")
            print(f"    Geometry types: {result['stats']['geometry_types']}")

            # Copy to validated directory
            dest_path = validated_dir / file_path.name
            shutil.copy2(file_path, dest_path)
            print(f"    → Copied to validated/")
        else:
            print(f"  ✗ Validation failed")
            for error in result['errors'][:3]:  # Show first 3 errors
                print(f"    - {error}")
            if len(result['errors']) > 3:
                print(f"    ... and {len(result['errors']) - 3} more errors")

        if result['warnings']:
            for warning in result['warnings'][:2]:
                print(f"    ⚠ {warning}")

        print()

    # Generate report
    report_path = reports_dir / 'validation_report.txt'
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("=" * 70 + "\n")
        f.write("GeoJSON Validation Report\n")
        f.write("=" * 70 + "\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Files validated: {len(results)}\n")
        f.write("\n")

        for result in results:
            f.write("-" * 70 + "\n")
            f.write(f"File: {result['file']}\n")
            f.write(f"Status: {'✓ VALID' if result['valid'] else '✗ INVALID'}\n")
            f.write("\n")

            if result['stats']:
                f.write("Statistics:\n")
                f.write(f"  Features: {result['stats'].get('feature_count', 'N/A')}\n")
                f.write(f"  Geometry types: {result['stats'].get('geometry_types', {})}\n")
                f.write(f"  File size: {result['stats'].get('file_size_kb', 0):.1f} KB\n")
                f.write(f"  Has CRS: {result['stats'].get('has_crs', False)}\n")
                f.write("\n")

            if result['errors']:
                f.write("Errors:\n")
                for error in result['errors']:
                    f.write(f"  - {error}\n")
                f.write("\n")

            if result['warnings']:
                f.write("Warnings:\n")
                for warning in result['warnings']:
                    f.write(f"  - {warning}\n")
                f.write("\n")

    # Summary
    print("=" * 70)
    print("Validation Summary")
    print("=" * 70)

    valid_count = sum(1 for r in results if r['valid'])
    total_count = len(results)

    for result in results:
        status = "✓" if result['valid'] else "✗"
        print(f"  {status} {result['file']}")

    print()
    print(f"Total: {valid_count}/{total_count} files valid")
    print()
    print(f"✓ Validation report saved to: {report_path}")

    if valid_count == total_count:
        print(f"✓ All validated files copied to: {validated_dir}")
        return 0
    else:
        print()
        print("⚠ Some files failed validation. Check the report for details.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
