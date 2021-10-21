# IIIFViewer
A customised version of the <a href="https://openlayers.org/en/master/examples/iiif.html">OpenLayers IIIF Example Viewer</a>, to incorporate extra functions in the former National Library of Scotland viewer, based on the KlokanTech <a href="https://klokantech.github.io/iiifviewer/">IIIF Viewer</a>. We needed to upgrade this to use OpenLayers 6 to address a problem for <a href="https://github.com/openlayers/openlayers/issues/9291">Safari users on iOS12</a>.

The additional functions inlcude:
- an overview window based on the <a href="https://openlayers.org/en/latest/examples/overviewmap-custom.html?q=overview">OpenLayers custom overview example</a>.
- allowing overzooming of the image beyond a 1:1 setting.
- a customised Permalink function "Link to this view" based on OpenLayers2 format, and used in existing links.
- allowing a PDF Print function, based on the <a href="https://openlayers.org/en/latest/examples/export-pdf.html?q=PDF"> OpenLayers Export PDF example</a>.
- allowing a 'Zoom to this location' function, based on a Web Feature Service request to the map metadata.
- incorporating drawing tools for map annotation

The finished viewer can be viewed on the <a href="https://maps.nls.uk/view/00000207">NLS website</a>.
