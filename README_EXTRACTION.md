# Accessing the Data

The geographic data behind this project — irrigation tank outlines, canals, railways, and the Thanjavur district boundary — is a resource for anyone who wants to study, analyse, or build upon the work of mapping water histories in the Kaveri river delta. This might include:

- Overlaying the tank features on other historical or contemporary maps
- Analysing changes in the landscape over time
- Incorporating the data into your own research, visualisations, or applications
- Comparing the mapped features with other environmental or demographic datasets

The data is loaded dynamically by the web viewer from files hosted by the National Library of Scotland. This extraction pipeline gives you a straightforward way to download and work with that data directly, without needing to know how the web application works internally.

## What the pipeline does

- **Download** all geographic datasets from the NLS server
- **Validate** the downloaded files to confirm they are complete and correctly structured
- **Convert** to common open formats (GeoJSON and KML) that can be opened in a wide range of tools

## Quick Start

### 1. Install Dependencies

```bash
# Install required Python packages
pip install -r scripts/requirements.txt
```

Or install manually:
```bash
pip install requests simplekml
```

### 2. Run Extraction

Single command to download, validate, and convert all data:

```bash
python3 scripts/extract_all.py
```

This will:
1. Download 4 GeoJSON files from NLS server
2. Validate structure and coordinates
3. Convert to KML format
4. Generate validation report

### 3. Find Your Files

After extraction, you'll find:

```
irrigation-tanks/
├── data/
│   ├── raw/                    # Original GeoJSON downloads
│   │   ├── tanjoretanks-updated.geojson
│   │   ├── canals.geojson
│   │   ├── railways.geojson
│   │   └── thanjavur.geojson
│   ├── validated/              # Validated GeoJSON files
│   └── kml/                    # KML exports for Google Earth
│       ├── tanjoretanks-updated.kml
│       ├── canals.kml
│       ├── railways.kml
│       └── thanjavur.kml
└── reports/
    └── validation_report.txt   # Detailed validation statistics
```

## Data Sources

The extraction pipeline downloads 4 datasets from the National Library of Scotland:

| Dataset | Description | Geometry Type | Features |
|---------|-------------|---------------|----------|
| **Irrigation Tanks** | Water tank outlines traced from historical Survey of India maps by Charlotte Evans | MultiPolygon | ~thousands |
| **Canals** | Canal network from OpenStreetMap | MultiLineString | Varies |
| **Railways** | Railway lines from OpenStreetMap | MultiLineString | Varies |
| **Thanjavur District** | Administrative boundary | MultiPolygon | 1 |

**Coordinate System:** WGS84 (EPSG:4326)
**Region:** Kaveri River Delta, Tamil Nadu, South India (approx. 10.6°N, 79.3°E)

## Individual Scripts

You can also run each step independently:

### Download Only
```bash
python3 scripts/download_geojson.py
```
Downloads all 4 files from NLS server to `data/raw/`

### Validate Only
```bash
python3 scripts/validate_geojson.py
```
Validates downloaded files, generates report, copies valid files to `data/validated/`

### Convert Only
```bash
python3 scripts/convert_formats.py
```
Converts validated GeoJSON files to KML format in `data/kml/`

## Importing into GIS Software

### QGIS

1. Open QGIS
2. **Layer** → **Add Layer** → **Add Vector Layer**
3. Navigate to `data/validated/` or `data/kml/`
4. Select a `.geojson` or `.kml` file
5. Click **Add**

**Tip:** Use the validated GeoJSON files for best compatibility.

### ArcGIS

1. Open ArcGIS Pro or ArcMap
2. **Add Data** button
3. Navigate to `data/validated/` or `data/kml/`
4. Select a file and add to map

**Note:** ArcGIS Pro has excellent GeoJSON support. For ArcMap, KML may work better.

### Google Earth

1. Open Google Earth (desktop or web)
2. **File** → **Open** (or drag and drop)
3. Navigate to `data/kml/`
4. Select a `.kml` file

The tanks will appear styled in blue, canals in light blue, railways in black, and district boundary in green.

### Other Software

- **Mapbox Studio:** Upload GeoJSON files directly
- **Leaflet/OpenLayers:** Load GeoJSON files in web maps
- **Python (GeoPandas):**
  ```python
  import geopandas as gpd
  tanks = gpd.read_file('data/validated/tanjoretanks-updated.geojson')
  ```

## File Formats

### GeoJSON
- **Location:** `data/raw/` and `data/validated/`
- **Use for:** QGIS, Python analysis, web maps
- **Advantages:** Native web format, readable text, preserves all attributes
- **Best for:** Data analysis and web applications

### KML
- **Location:** `data/kml/`
- **Use for:** Google Earth, ArcGIS, field mapping apps
- **Advantages:** Styled visualization, widely supported
- **Best for:** Quick visualization and field work

## Troubleshooting

### Import Failed: "Invalid coordinates"
Check the validation report at `reports/validation_report.txt` for coordinate errors.

### Files Not Downloading
- Check your internet connection
- Verify the NLS server is accessible: https://geo.nls.uk/maps/irrigation-tanks/
- Run `python3 scripts/download_geojson.py` directly to see detailed error messages

### KML Doesn't Display Correctly
- Try importing the GeoJSON files instead (`data/validated/`)
- Some software has better GeoJSON support than KML support

### Python Module Not Found
Install missing dependencies:
```bash
pip install -r scripts/requirements.txt
```

## Advanced Usage

### Custom Styling in KML

The KML files are styled to match the web viewer. To customize colors, edit `scripts/convert_formats.py` and modify the `STYLES` dictionary:

```python
STYLES = {
    'tanjoretanks-updated': {
        'color': '280ec2',  # Blue (BGR format)
        'width': 2,
        'fill': True,
        'fill_opacity': 0.3
    },
    # ... other styles
}
```

Then re-run: `python3 scripts/convert_formats.py`

### Shapefile Export (Optional)

If you have GDAL installed, you can convert to Shapefiles:

```bash
# Install GDAL (varies by system)
# macOS: brew install gdal
# Ubuntu: sudo apt-get install gdal-bin
# Windows: Use OSGeo4W installer

# Convert to Shapefile
ogr2ogr -f "ESRI Shapefile" data/shapefile/tanks.shp data/validated/tanjoretanks-updated.geojson
```

## Data Attribution

This extraction tool downloads data originally compiled and hosted by:

- **Irrigation Tanks:** Traced by Charlotte Evans from historical Survey of India maps
- **Canals & Railways:** OpenStreetMap contributors
- **Historical Maps:** Survey of India (1910s-1930s), via National Library of Scotland
- **Satellite Imagery:** © Esri, DigitalGlobe, and others

**Source Repository:** https://github.com/NationalLibraryOfScotland/irrigation-tanks

When using this data, please acknowledge:
- The National Library of Scotland
- Charlotte Evans (tank tracing)
- OpenStreetMap contributors (infrastructure data)

## License

The extraction scripts in this repository are provided as-is for educational and research purposes.

The **geographic data** itself is subject to:
- Historical map imagery: Public domain / NLS terms
- OpenStreetMap data: ODbL (Open Database License)
- Traced tank outlines: Check with NLS for specific usage terms

Always verify licensing requirements for your specific use case.

## Technical Details

### Coordinate System
- **EPSG:** 4326
- **Datum:** WGS84
- **Format:** Decimal degrees (longitude, latitude)

### Data Quality
- **Tanks:** High quality, manually traced from historical maps
- **Canals/Railways:** From OpenStreetMap, quality varies
- **Boundary:** Administrative boundary, suitable for overview

### File Sizes
- Tanks: ~2-5 MB (largest dataset)
- Canals: ~500 KB - 1 MB
- Railways: ~200-500 KB
- Thanjavur: ~50-100 KB

## Support

For issues with:
- **Extraction scripts:** Open an issue in this repository
- **Source data:** Contact the National Library of Scotland
- **Web viewer:** See the main README.md

## See Also

- [Main Project README](README.md) - Original web viewer documentation
- [Validation Report](reports/validation_report.txt) - Generated after extraction
- [NLS Irrigation Tanks Project](https://maps.nls.uk/projects/irrigation-tanks/) - Original project page
