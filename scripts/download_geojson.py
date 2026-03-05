#!/usr/bin/env python3
"""
Download GeoJSON files from National Library of Scotland server.

This script downloads 4 remote GeoJSON files containing irrigation tank data
from the Kaveri River Delta, South India.
"""

import os
import sys
import json
import requests
from pathlib import Path


# Define the data sources
SOURCES = [
    {
        'name': 'tanjoretanks-updated',
        'url': 'https://geo.nls.uk/maps/irrigation-tanks/scripts/tanjoretanks-updated.js',
        'description': 'Irrigation Tanks (MultiPolygon features)'
    },
    {
        'name': 'canals',
        'url': 'https://geo.nls.uk/maps/irrigation-tanks/scripts/canals.js',
        'description': 'Canals (MultiLineString features)'
    },
    {
        'name': 'railways',
        'url': 'https://geo.nls.uk/maps/irrigation-tanks/scripts/railways.js',
        'description': 'Railways (MultiLineString features)'
    },
    {
        'name': 'thanjavur',
        'url': 'https://geo.nls.uk/maps/irrigation-tanks/scripts/thanjavur.js',
        'description': 'Thanjavur District Boundary (MultiPolygon features)'
    }
]


def download_file(url, output_path):
    """
    Download a file from a URL and save it locally.

    Args:
        url: URL to download from
        output_path: Local path to save the file

    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        print(f"  Downloading from {url}...")
        response = requests.get(url, timeout=30)

        if response.status_code != 200:
            return False, f"HTTP {response.status_code}"

        # Verify it's valid JSON
        try:
            data = json.loads(response.text)
        except json.JSONDecodeError as e:
            return False, f"Invalid JSON: {e}"

        # Save to file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        # Get file size
        file_size = os.path.getsize(output_path)
        size_kb = file_size / 1024

        return True, f"Success ({size_kb:.1f} KB)"

    except requests.exceptions.RequestException as e:
        return False, f"Network error: {e}"
    except Exception as e:
        return False, f"Error: {e}"


def main():
    """Main download function."""
    print("=" * 70)
    print("GeoJSON Downloader - Irrigation Tanks Data")
    print("=" * 70)
    print()

    # Determine output directory
    script_dir = Path(__file__).parent
    output_dir = script_dir.parent / 'data' / 'raw'

    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {output_dir}")
    print()

    # Download each file
    results = []
    for source in SOURCES:
        print(f"[{source['name']}]")
        print(f"  {source['description']}")

        output_path = output_dir / f"{source['name']}.geojson"
        success, message = download_file(source['url'], output_path)

        if success:
            print(f"  ✓ {message}")
            print(f"  → Saved to: {output_path.name}")
        else:
            print(f"  ✗ {message}")

        print()
        results.append((source['name'], success, message))

    # Summary
    print("=" * 70)
    print("Download Summary")
    print("=" * 70)

    successful = sum(1 for _, success, _ in results if success)
    total = len(results)

    for name, success, message in results:
        status = "✓" if success else "✗"
        print(f"  {status} {name}: {message}")

    print()
    print(f"Total: {successful}/{total} files downloaded successfully")

    if successful == total:
        print()
        print("✓ All files downloaded successfully!")
        print(f"  Files saved to: {output_dir}")
        return 0
    else:
        print()
        print("⚠ Some downloads failed. Please check the errors above.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
