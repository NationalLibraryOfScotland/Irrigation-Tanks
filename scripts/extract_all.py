#!/usr/bin/env python3
"""
Master orchestration script for GeoJSON extraction pipeline.

This script runs the complete extraction pipeline:
1. Download GeoJSON files from remote sources
2. Validate GeoJSON structure and coordinates
3. Convert to KML format

Single-command extraction: python3 scripts/extract_all.py
"""

import sys
import subprocess
from pathlib import Path
from datetime import datetime


def run_script(script_name, description):
    """
    Run a Python script and return its exit code.

    Args:
        script_name: Name of the script file (e.g., 'download_geojson.py')
        description: Human-readable description of the step

    Returns:
        Exit code (0 for success, non-zero for failure)
    """
    script_dir = Path(__file__).parent
    script_path = script_dir / script_name

    if not script_path.exists():
        print(f"✗ Script not found: {script_path}")
        return 1

    print()
    print("=" * 70)
    print(f"STEP: {description}")
    print("=" * 70)
    print()

    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            check=False
        )
        return result.returncode
    except Exception as e:
        print(f"✗ Error running script: {e}")
        return 1


def main():
    """Main orchestration function."""
    start_time = datetime.now()

    print("=" * 70)
    print("Irrigation Tanks GeoJSON Extraction Pipeline")
    print("=" * 70)
    print()
    print("This script will:")
    print("  1. Download GeoJSON files from NLS server")
    print("  2. Validate GeoJSON structure and coordinates")
    print("  3. Convert to KML format")
    print()
    print(f"Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Define pipeline steps
    steps = [
        ('download_geojson.py', 'Download GeoJSON Files'),
        ('validate_geojson.py', 'Validate GeoJSON Structure'),
        ('convert_formats.py', 'Convert to KML Format')
    ]

    # Execute pipeline
    results = []
    for script_name, description in steps:
        exit_code = run_script(script_name, description)
        results.append((description, exit_code == 0))

        if exit_code != 0:
            print()
            print(f"⚠ Step failed: {description}")
            print()
            print("Pipeline stopped. Please fix the errors above and try again.")
            return exit_code

    # Success summary
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    print()
    print("=" * 70)
    print("Pipeline Completed Successfully!")
    print("=" * 70)
    print()

    for description, success in results:
        status = "✓" if success else "✗"
        print(f"  {status} {description}")

    print()
    print(f"Completed at: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Duration: {duration:.1f} seconds")
    print()

    # Output locations
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / 'data'

    print("Output files:")
    print(f"  • Raw GeoJSON:       {data_dir / 'raw'}")
    print(f"  • Validated GeoJSON: {data_dir / 'validated'}")
    print(f"  • KML files:         {data_dir / 'kml'}")
    print(f"  • Validation report: {script_dir.parent / 'reports' / 'validation_report.txt'}")
    print()

    print("Next steps:")
    print("  • Open KML files in Google Earth or GIS software")
    print("  • Import GeoJSON files into QGIS or ArcGIS")
    print("  • Read README_EXTRACTION.md for detailed usage instructions")
    print()

    return 0


if __name__ == '__main__':
    sys.exit(main())
