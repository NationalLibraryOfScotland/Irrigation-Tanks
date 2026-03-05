# Irrigation tanks in the Kaveri River Delta, South India

This application was created by Charlotte Evans (Lancaster University) and Chris Fleet (National Library of Scotland). It is part of a PhD project studying water histories and digital mapping in the Kaveri river delta.

The map viewer uses <a href="http://openlayers.org">OpenLayers</a> 4.6.5 for the map interface, <a href="https://jqueryui.com/">JQuery</a> for some interactive features, and a <a href="https://www.maptiler.com/desktop/">MapTiler</a> georeferenced mosaic in the left-hand map panel. For the transparency slider, we used <a href="https://github.com/seiyria/bootstrap-slider">Bootstrap slider</a>.

The original viewer was adapted from the NLS <a href="https://github.com/NationalLibraryOfScotland/SidebySideOL3">Side-by-side viewer</a>.


The <a href="https://github.com/NationalLibraryOfScotland/Irrigation-Tanks/tree/master/scripts/sidebyside.js">sidebyside.js</a> Javascript file contains the bespoke functions for this viewer, and is commented to explain the specific content and functions within it.

View complete application: <a href="https://geo.nls.uk/maps/irrigation-tanks">Irrigation tanks in the Kaveri River Delta, South India
</a>.

## Using the Data

The geographic data behind this viewer — irrigation tank outlines, canals, railways, and the Thanjavur district boundary — is a valuable resource for anyone studying the water histories, landscapes, and changing environment of the Kaveri river delta. Whether you are a researcher, student, or developer looking to build on this work, this repository includes an extraction pipeline so you can easily obtain the data in a form you can work with directly.

A single command downloads all datasets and converts them into standard open formats (GeoJSON and KML):

```bash
pip install -r scripts/requirements.txt
python3 scripts/extract_all.py
```

See [README_EXTRACTION.md](README_EXTRACTION.md) for full instructions, including format details and how to import into common tools.
