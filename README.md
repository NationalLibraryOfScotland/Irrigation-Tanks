# Irrigation tanks in the Kaveri River Delta, South India

This application was created by Charlotte Evans (Lancaster University) and Chris Fleet (National Library of Scotland). It is part of a PhD project studying water histories and digital mapping in the Kaveri river delta.

The map viewer uses <a href="http://openlayers.org">OpenLayers</a> 4.6.5 for the map interface, <a href="https://jqueryui.com/">JQuery</a> for some interactive features, and a <a href="https://www.maptiler.com/desktop/">MapTiler</a> georeferenced mosaic in the left-hand map panel. For the transparency slider, we used <a href="https://github.com/seiyria/bootstrap-slider">Bootstrap slider</a>.

The original viewer was adapted from the NLS <a href="https://github.com/NationalLibraryOfScotland/SidebySideOL3">Side-by-side viewer</a>.


The <a href="https://github.com/NationalLibraryOfScotland/Irrigation-Tanks/tree/master/scripts/sidebyside.js">sidebyside.js</a> Javascript file contains the bespoke functions for this viewer, and is commented to explain the specific content and functions within it.

View complete application: <a href="https://geo.nls.uk/maps/irrigation-tanks">Irrigation tanks in the Kaveri River Delta, South India
</a>.

## Data Extraction for GIS Research

For researchers and students who want to use the geographic data (irrigation tanks, canals, railways, district boundary) in GIS software such as QGIS, ArcGIS, or Google Earth, this repository includes an automated extraction pipeline.

A single command downloads and converts all datasets into GeoJSON and KML formats ready for import:

```bash
pip install -r scripts/requirements.txt
python3 scripts/extract_all.py
```

See [README_EXTRACTION.md](README_EXTRACTION.md) for full instructions, including how to import the data into QGIS, ArcGIS Pro, and Google Earth.
