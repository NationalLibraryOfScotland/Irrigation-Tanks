import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultControls, OverviewMap} from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import IIIF from 'ol/source/IIIF';
import IIIFInfo from 'ol/format/IIIFInfo';
import {WFS, GeoJSON} from 'ol/format';
import {Vector as VectorLayer} from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import {tile} from 'ol/loadingstrategy';
import {createXYZ} from 'ol/tilegrid';
import {applyTransform} from 'ol/extent';
import {getTransform} from 'ol/proj';
import {Icon, Style} from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

import {
  equalTo as equalToFilter,
  like as likeFilter,
  and as andFilter
} from 'ol/format/filter';

// import {toPng} from 'html-to-image';
// import {toJpeg} from 'html-to-image';
// import {toCanvas} from 'html-to-image';

var args;
var currentZoom;
var currentLat;
var currentLon;

var layer = new TileLayer();
var layer2 = new TileLayer();

var loadFeatures;
var features;
var group;

var printPDFNotinprocess;

printPDFNotinprocess = true;

var mapView;
var overviewView = new View({});


/**
 * Renders a progress bar.
 * @param {HTMLElement} el The target element.
 * @constructor
 */
function Progress(el) {
  this.el = el;
  this.loading = 0;
  this.loaded = 0;
}


/**
 * Increment the count of loading tiles.
 */
Progress.prototype.addLoading = function() {
  if (this.loading === 0) {
    this.show();
  }
  ++this.loading;
  this.update();
};


/**
 * Increment the count of loaded tiles.
 */
Progress.prototype.addLoaded = function() {
  var this_ = this;
  setTimeout(function() {
    ++this_.loaded;
    this_.update();
  }, 100);
};


/**
 * Update the progress bar.
 */
Progress.prototype.update = function() {
  var width = (this.loaded / this.loading * 100).toFixed(1) + '%';
  this.el.style.width = width;
  if (this.loading === this.loaded) {
    this.loading = 0;
    this.loaded = 0;
    var this_ = this;
    setTimeout(function() {
      this_.hide();
    }, 500);
  }
};


/**
 * Show the progress bar.
 */
Progress.prototype.show = function() {
  this.el.style.visibility = 'visible';
};


/**
 * Hide the progress bar.
 */
Progress.prototype.hide = function() {
  if (this.loading === this.loaded) {
    this.el.style.visibility = 'hidden';
    this.el.style.width = 0;
  }
};

var progress = new Progress(document.getElementById('progress'));

var overviewMapControl = new OverviewMap({
  // see in overviewmap-custom.html to see the custom CSS used
  className: 'ol-overviewmap',
  layers: [layer2],
  collapseLabel: '\u00BB',
  label: '\u00AB',
  collapsed: false,
  view: mapView
});


var  map = new Map({
      layers: [layer],
      target: 'map'
    }),
 notifyDiv = document.getElementById('iiif-notification');



function refreshMaplocal(new_url2) {
  fetch(new_url2).then(function(response) {
    response.json().then(function(imageInfo) {
      var options = new IIIFInfo(imageInfo).getTileSourceOptions();
      if (options === undefined || options.version === undefined) {

	notifyDiv.textContent = 'Data seems to be no valid IIIF image information.  Please contact maps@nls.uk citing this page URL.';
        return;
      }
      options.zDirection = -1;
      options.crossOrigin = 'anonymous';
      options.tileSize = 256;
      options.resolutions = [256, 128, 64, 32, 16, 8, 4, 2, 1];
      var iiifTileSource = new IIIF(options);
      var iiifTileSource2 = new IIIF(options);

      layer.setSource(iiifTileSource);
      layer2.setSource(iiifTileSource2);

iiifTileSource.on('tileloadstart', function() {
  progress.addLoading();
  jQuery("#iiif-notification").show();
  if (printPDFNotinprocess)
  {
  notifyDiv.textContent = 'Loading map...';
  }
});

iiifTileSource.on('tileloadend', function() {
  progress.addLoaded();
  jQuery("#iiif-notification").hide();
});
iiifTileSource.on('tileloaderror', function() {
  progress.addLoaded();
  jQuery("#loadmessage").show();
  notifyDiv.textContent = 'Image error - sorry';
});

      var initialresolutions = iiifTileSource.getTileGrid().getResolutions();
      initialresolutions.push(0.5, 0.25, 0.125, 0.0625);
      map.setView(new View({
        resolutions: iiifTileSource.getTileGrid().getResolutions(),
//        resolutions: initialresolutions,
        extent: iiifTileSource.getTileGrid().getExtent(),
	constrainRotation: false,
        constrainOnlyCenter: true
      }));
	var hash = window.location.hash;
	if (hash == '') {
	      map.getView().fit(iiifTileSource.getTileGrid().getExtent());
		}
	else
	{
	getMapHash();
	setZoomLatLon();
	}
      notifyDiv.textContent = '';

map.addControl(overviewMapControl);
      notifyDiv.textContent = '';
    }).catch(function(body) {
      notifyDiv.textContent = 'Could not read image info json. ' + body + ' Please contact maps@nls.uk citing this page URL.';
    });
   }).catch(function() {
    notifyDiv.textContent = 'Could not read data from URL. Please contact maps@nls.uk citing this page URL.';
  });




}




function refreshMap(url) {
  fetch(url).then(function(response) {
    response.json().then(function(imageInfo) {
      var options = new IIIFInfo(imageInfo).getTileSourceOptions();
      if (options === undefined || options.version === undefined) {
	notifyDiv.textContent = 'Data seems to be no valid IIIF image information.  Please contact maps@nls.uk citing this page URL.';
        return;
      }
      options.zDirection = -1;
      options.crossOrigin = 'anonymous';
      options.tileSize = 256;
      options.resolutions = [256, 128, 64, 32, 16, 8, 4, 2, 1];
      var iiifTileSource = new IIIF(options);
      var iiifTileSource2 = new IIIF(options);

      layer.setSource(iiifTileSource);
      layer2.setSource(iiifTileSource2);

iiifTileSource.on('tileloadstart', function() {
  progress.addLoading();
  jQuery("#iiif-notification").show();
  if (printPDFNotinprocess)
  {
  notifyDiv.textContent = 'Loading map...';
  }
});

iiifTileSource.on('tileloadend', function() {
  progress.addLoaded();
  jQuery("#iiif-notification").hide();
});
iiifTileSource.on('tileloaderror', function() {
//  progress.addLoaded();

	if (url.includes("%2F"))
		{
		var new_url1 = url.replace('%2F','/');
		}
	else	
		{
		var new_url1 = url;
		}
	var new_url2 = url1.replace('map-view','mapview');
	refreshMaplocal(new_url2);

// jQuery("#loadmessage").show();
//  notifyDiv.textContent = 'Image error - sorry';
});

      var initialresolutions = iiifTileSource.getTileGrid().getResolutions();
      initialresolutions.push(0.5, 0.25, 0.125, 0.0625);
      map.setView(new View({
        resolutions: iiifTileSource.getTileGrid().getResolutions(),
//        resolutions: initialresolutions,
        extent: iiifTileSource.getTileGrid().getExtent(),
	constrainRotation: false,
        constrainOnlyCenter: true
      }));
	var hash = window.location.hash;
	if (hash == '') {
	      map.getView().fit(iiifTileSource.getTileGrid().getExtent());
		}
	else
	{
	getMapHash();
	setZoomLatLon();
	}
      notifyDiv.textContent = '';

map.addControl(overviewMapControl);
      notifyDiv.textContent = '';
    }).catch(function(body) {

	if (url.includes("%2F"))
		{
		var new_url1 = url.replace('%2F','/');
		}
	else	
		{
		var new_url1 = url;
		}
	var new_url2 = new_url1.replace('map-view','mapview');
	refreshMaplocal(new_url2);


//      notifyDiv.textContent = 'Could not read image info json. ' + body + ' Please contact maps@nls.uk citing this page URL.';
    });
   }).catch(function() {
    notifyDiv.textContent = 'Could not read data from URL. Please contact maps@nls.uk citing this page URL.';
  });




}


refreshMap(url);


document.getElementById('map').focus();

jQuery("#showmaplocationinfo").hide();

function getMapHash() {

	var hash = window.location.hash;
	if (hash !== '') {
	  // try to restore center, zoom-level and rotation from the URL
//	  var hash = window.location.hash.replace('#map=', '');
	  var parts = hash.split('&');

	  if (parts.length === 4) {
	    var ZoomString = parts[0];
	    currentZoom = ZoomString.replace('#zoom=', '');
	    var Lat = parts[1];
	    currentLat = Lat.replace('lat=', '');
	    var Lon = parts[2];
	    currentLon = Lon.replace('lon=', '');

	  }

	}

}

function setZoomLatLon() {

	if ( currentZoom === undefined || currentLat === undefined  || currentLon === undefined)
	  { 
		window.location.href.substr(0, window.location.href.indexOf('#'));
		refreshMap(url);
		return; 
	  }

	var ZoomNo = parseInt(currentZoom);
	map.getView().setZoom(ZoomNo);
	var extent = map.getLayers().getArray()[0].getSource().getTileGrid().getExtent();
	var lat2 = parseInt(Math.abs(extent[1]) - currentLat);
	var lat3 = parseInt(Math.abs(lat2));
	map.getView().setCenter([currentLon,-lat3] );
}


function updateLocationToURL() {
	var zoom = Math.round(map.getView().getZoom());
	var centre = map.getView().getCenter();
	var centre1 = parseInt(centre[0].toFixed(0));
	var centre2 = parseInt(centre[1].toFixed(0));
	window.location.hash = "zoom=" + (zoom ) + "&lat=" + centre2  + "&lon=" + centre1 +  "&layers=BT";
}

var addLocationToURLInput = document.getElementById('addLocationToURL');

if(addLocationToURLInput){

	addLocationToURLInput.addEventListener('click', function() {
		var zoom = Math.round(map.getView().getZoom());
		var centre = map.getView().getCenter();
		var centre1 = parseInt(centre[0].toFixed(0));
		var centre2 = parseInt(centre[1].toFixed(0));
		var extent = map.getLayers().getArray()[0].getSource().getTileGrid().getExtent();
		var lat1 = (extent[1] - centre2);
		window.location.hash = "zoom=" + zoom  + "&lat=" + Math.abs(lat1) + "&lon=" + centre1  +  "&layers=BT";
	});

}


map.on('moveend', function() {
		var hash = window.location.hash;
		if (hash.length > 0)
			{
			getMapHash();
			var zoom = Math.round(map.getView().getZoom());
			var centre = map.getView().getCenter();
			var centre1 = parseInt(centre[0].toFixed(0));
			var centre2 = parseInt(centre[1].toFixed(0));
			var extent = map.getLayers().getArray()[0].getSource().getTileGrid().getExtent();
			var lat1 = (extent[1] - centre2);
			window.location.hash = "zoom=" + zoom  + "&lat=" + Math.abs(lat1) + "&lon=" + centre1  +  "&layers=BT";

			}

	else
		{
		window.location.href.substr(0, window.location.href.indexOf('#'));
		}

});



// export options for html-to-image.
// See: https://github.com/bubkoo/html-to-image#options
// var exportOptions = {
//  filter: function(element) {
//    return !element.className || element.className.indexOf("ol-control") === -1;
//  }
// };



var exportButton = document.getElementById("export-pdf");

if(exportButton){


exportButton.addEventListener('click', function() {

printPDFNotinprocess = false;

  jQuery("#iiif-notification").show();

	document.getElementById('iiif-notification').innerHTML = "Generating PDF - please wait..."; 
		setTimeout( function(){
			document.getElementById("iiif-notification").innerHTML = "";
			jQuery("#iiif-notification").hide();

	}, 1500); // delay 1000 ms

map.removeControl(overviewMapControl);

  exportButton.disabled = true;
  document.body.style.cursor = 'progress';

    var format = "a3";
    var resolution = "72";
    var dim = [420, 297];
    var width = Math.round((420 * resolution) / 25.4);
    var height = Math.round((297 * resolution) / 25.4);
    var size = map.getSize();
    var viewResolution = map.getView().getResolution();

  map.once('rendercomplete', function() {
    var mapCanvas = document.createElement('canvas');
    mapCanvas.width = width;
    mapCanvas.height = height;
    var mapContext = mapCanvas.getContext('2d');
    Array.prototype.forEach.call(document.querySelectorAll('.ol-layer canvas'), function(canvas) {
      if (canvas.width > 0) {
        var opacity = canvas.parentNode.style.opacity;
        mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
        var transform = canvas.style.transform;
        // Get the transform parameters from the style's transform matrix
        var matrix = transform.match(/^matrix\(([^\(]*)\)$/)[1].split(',').map(Number);
        // Apply the transform to the export map context
        CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
        mapContext.drawImage(canvas, 0, 0);
      }
    });
    var pdf = new jsPDF('landscape', undefined, format);
    pdf.addImage(mapCanvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, 420, 297);
    pdf.save('map.pdf');
    // Reset original map size
    map.setSize(size);
    map.getView().setResolution(viewResolution);
    exportButton.disabled = false;
    document.body.style.cursor = 'auto';
  });

  // Set print size
  var printSize = [width, height];
  map.setSize(printSize);
  var scaling = Math.min(width / size[0], height / size[1]);
  map.getView().setResolution(viewResolution / scaling);

map.addControl(overviewMapControl);

  }, false);

printPDFNotinprocess = true;

}




   var vectorSource_new = new VectorSource();
   var vectorLayer_new = new VectorLayer({
      name: "vectorLayer_new",
      source: vectorSource_new
    });

map.getLayers().insertAt(1,vectorLayer_new);

	var iconStyle = new Style({
	    image: new Icon({
 		  anchor: [10, 10],
		  anchorXUnits: 'pixels',
		  anchorYUnits: 'pixels',
	        src: 'https://maps.nls.uk/geo/img/cross.png'
	    })
	});

map.on('click', function(event) {

	if (event.originalEvent.altKey == true) {

		if (map.getLayers().getArray()[1].getSource().getFeatures().length > 0)
				{map.getLayers().getArray()[1].getSource().clear(); }
		    var feature = new Feature(
		        new Point(event.coordinate)
		    );
		    feature.setStyle(iconStyle);
	
		vectorSource_new.addFeature(feature);
	
		var coords = feature.getGeometry().getCoordinates();

			var pixels_left = parseInt(coords[0].toFixed(0));
			var pixels_up1 = parseInt(coords[1].toFixed(0));
			var extent = map.getLayers().getArray()[0].getSource().getTileGrid().getExtent();
			var pixels_up2 = (extent[1] - pixels_up1);
			var pixels_up = Math.abs(pixels_up2);

		var extent_sideways = extent[2] - 1000;
		var extent_updownways = Math.abs(extent[1]) - 900;

		var pixels_left_percent = pixels_left / extent_sideways;
		var pixels_up_percent = pixels_up / extent_updownways;

		// alert("left and up fractions: " + pixels_left_percent + ", " + pixels_up_percent);

jQuery("#showmaplocationinfo").show();

	document.getElementById('showmaplocationinfo').innerHTML = "Switching to <em>Explore Georeferenced Maps</em> viewer... please wait";

	var pageurl = window.location.pathname;

	if (pageurl.indexOf("/view/") >= 0)
		{
			var pageURL = pageurl.replace('/view/', '');
		}
	else
	{
	var pageURL = '74428019';
	}

	var group;

	var vectorSource;

	if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25inch/">25 inch to the mile, 1st edition, 1855-1882</a>')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25inch-2nd-and-later/">25 inch 2nd and later editions, 1892-1949</a>')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25inch-2nd-and-later/">25 inch 2nd and later editions, 1892-1949</a>')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/25inch-england-and-wales/">OS 25 inch England and Wales, 1841-1952</a>')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/index.html">Ordnance Survey</a> &gt; <a href="/os/national-grid/">National Grid maps, 1940s-1960s</a>')
	{	var TypeName = 'OS_National_Grid_all_find'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/national-grid/">National Grid maps, 1940s-1960s</a>')
	{	var TypeName = 'OS_National_Grid_all_find'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/townplans-england/">Ordnance Survey Town Plans of England and Wales, 1840s-1890s</a>')
	{	var TypeName = 'OS_Town_Plans_Eng'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/6inch-england-and-wales/">OS Six-inch England and Wales, 1842-1952</a>')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/6inch/">Six-inch 1st edition, 1843-1882</a>')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/6inch-2nd-and-later/">Six-inch 2nd and later editions, 1892-1960</a>')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey maps</a>&gt; <a href="/os/half-inch-mot-roads/">Half-inch MoT road maps (1923)</a>')
	{	var TypeName = 'os_half_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25k-gb-1937-61/">1:25,000 maps of Great Britain, 1945-1969</a>')
	{	var TypeName = 'OS_25000_uk'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25k-gb-admin/">1:25,000 Administrative Area Series of Great Britain, 1945-1968</a>')
	{	var TypeName = 'OS_25000_uk'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/20k-gb/">War Office, Great Britain 1:20,000, GSGS 2748</a>')
	{	var TypeName = 'OS_25000_uk'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/25k-gb-1940-43/">War Office, Great Britain 1:25,000. GSGS 3906 - 1940-43</a>')
	{	var TypeName = 'OS_25000_uk'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25k-gb-outline/">1:25,000 Outline Series of Great Britain, 1945-1965</a>')
	{	var TypeName = 'OS_25000_uk'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/land-utilisation-survey/">Land Utilisation Survey, Scotland, 1931-1935</a>')
	{	var TypeName = 'One_Inch_land_utilisation_scot'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/soils/">Soil Survey of Scotland, 1950s-1980s</a>')
	{	var TypeName = 'Soil_Survey'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/half-inch-layers/">Ordnance Survey Scotland, Half-Inch to the mile, 1908-1918 (layer-coloured)</a>')
	{	var TypeName = 'os_half_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/half-inch-hills/">Ordnance Survey Scotland, Half-Inch to the mile, 1908-1918 (hill-shaded)</a>')
	{	var TypeName = 'os_half_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey maps</a>&gt; <a href="/os/half-inch-mot-roads/">Half-inch MoT road maps (1923)</a>')
	{	var TypeName = 'os_half_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/german-army-100k/">German Army, Karte von Schottland, 1:100,000 - 1939-40</a>')
	{	var TypeName = 'os_half_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/ten-mile/">Ten-mile to the Inch, Planning Maps</a>')
	{	var TypeName = 'OS_ten_mile_planning'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/london-1890s/">OS London, Five feet to the Mile, 1893-1896</a>')
	{	var TypeName = 'os_london_1056'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/air-photos/">Air Photo Mosaics of Scotland, 1944-1950</a>')
	{	var TypeName = 'catalog_air_photos'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/quarter-inch-first/">OS Quarter Inch to the Mile Maps of Scotland, 1st edition - 1901-1914</a>')
	{	var TypeName = 'os_quarter_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/quarter-inch-third/">OS Quarter Inch to the Mile Maps of Scotland, 3rd edition, 1921-1923</a>')
	{	var TypeName = 'os_quarter_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/county-series/">OS Indexes to the County Series maps, Scotland, 1854-1886</a>')
	{	var TypeName = 'os_indexes'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/bart_half_england.html">Bartholomew "Half Inch Maps" of England and Wales, 1902-1906</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/bart_england_wales_halfinch_list.html">Bartholomew "Half Inch Maps" of England and Wales, 1919-1924</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/bart_half_scotland.html">Bartholomew "Half Inch to the Mile Maps" of Scotland, 1899-1905</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/bart_scotland_halfinch_list.html">Bartholomew "Half Inch to the Mile Maps" of Scotland, 1926-1935</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/bart_half_great_britain.html">Bartholomew Revised Half-Inch Map, Great Britain, 1940-47</a>')
	{	var TypeName = 'bart_half_combined'; }	
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/ww1/trenches/">British First World War Trench Maps, 1915-1918</a>')
	{	var TypeName = 'TM_Combined_sorted_27700'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/geological/6inch/">Geological Survey, Six-Inch to the Mile, 1st edition</a>')
	{	var TypeName = 'geol_sixinch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/geological/one-inch/">Geological Survey, One-Inch Maps, 1850s-1940s</a>')
	{	var TypeName = 'geol_sixinch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/geological/6inch/">Geological Survey, Six-Inch to the Mile, 2nd and later editions</a>')
	{	var TypeName = 'geol_sixinch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/towns/">Town plans</a> &gt; <a href="/towns/goad/">Charles Goad Fire Insurance Plans, 1880s-1940s</a>')
	{	var TypeName = 'Goad_Insurance_Plans'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/india/survey-of-india">Survey of India maps</a>')
	{	var TypeName = 'Survey_of_India_Sheet_58'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/">Series maps</a> &gt; <a href="/series/johnston-reduced-ordnance/">Johnston reduced Ordnance maps of Scotland, 1888-1896</a>')
	{	var TypeName = 'Johnston_Scotland_half'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/">Series maps</a> &gt; <a href="/series/johnston-three-miles-to-inch/">Johnston "Three miles to inch" map of Scotland, 1885-1912</a>')
	{	var TypeName = 'Johnston_Scotland'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/">Series maps</a> &gt; <a href="/series/bart_quarter_scotland.html">Bartholomew Quarter-inch to mile map of Scotland, 1911-1932</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/">Series maps</a> &gt; <a href="/series/bart_half_scotland_1886.html">Bartholomew Reduced Ordnance Maps of Scotland, 1875-1891</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/">Series maps</a> &gt; <a href="/series/gall_and_inglis.html">Gall and Inglis graded road maps of Scotland, 1900s-1930s</a>')
	{	var TypeName = 'Gall_and_Inglis'; }
	else
	{
	var TypeName = 'OS_one_inch_combined';
	}


//	alert(TypeName);

	var urlgeoserver =  'https://geoserver3.nls.uk/geoserver/wfs?service=WFS' + 
	 			'&version=2.0.0&request=GetFeature&typename=' + TypeName +
				'&PropertyName=(the_geom,GROUP,IMAGE,IMAGETHUMB,IMAGEURL,SHEET,DATES,YEAR)&outputFormat=text/javascript&format_options=callback:loadFeatures' +
				'&srsname=EPSG:900913&CQL_FILTER=IMAGE=' + pageURL;

		
		var geojsonFormat = new GeoJSON();

		var url = urlgeoserver;

		var vectorSource = new VectorSource();
		var vectorLayer = new VectorLayer({
			mosaic_id: '200',
		  	title: "vectors - vectors",
		        source: vectorSource
		});

		// generate a GetFeature request
		var featureRequest = new WFS().writeGetFeature({
		  srsName: 'EPSG:3857',
		  featureNS: 'http://nls.uk/',
		  featurePrefix: 'nls',
		  featureTypes: [TypeName],
		  propertyNames: ['the_geom','GROUP','IMAGE','IMAGETHUMB','IMAGEURL','SHEET','DATES','YEAR'],
		  outputFormat: 'application/json',
		  filter: equalToFilter ('IMAGE', pageURL)
		});
		
		// then post the request and add the received features to a layer
		fetch('https://geoserver3.nls.uk/geoserver/wfs', {

	      headers : { 
	        'Content-Type': 'application/json',
	        'Accept': 'application/json'
	       },

		  method: 'POST',
		  body: new XMLSerializer().serializeToString(featureRequest)
		}).then(function(response) {

		  return response.json();
		}).then(function(json) {

// console.log(text);



		  var features = new GeoJSON().readFeatures(json);
		  vectorSource.addFeatures(features);


		if (features.length < 1)

	{

		document.getElementById('showmaplocationinfo').innerHTML = "Sorry, couldn't locate this map"; 
		if (map.getLayers().getArray()[1].getSource().getFeatures().length > 0)
				{map.getLayers().getArray()[1].getSource().clear(); }

		setTimeout( function(){
			document.getElementById("showmaplocationinfo").innerHTML = "";
			jQuery("#showmaplocationinfo").hide();

		}, 1500); // delay 1000 ms
		return;
	}


		else if (features.length > 0)

		{

			var coords3857 = [];
			coords3857 = features[0].getGeometry().getExtent();
	
// 			alert("Extents 3857: " + coords3857);
			var coords4326 = [];
	      		var extent4326 = applyTransform(coords3857, getTransform("EPSG:3857" , "EPSG:4326"));

			var lon_extent = extent4326[2] - extent4326[0]; 
			var lat_extent = extent4326[3] - extent4326[1]; 

			var lon_from_pixel = lon_extent * pixels_left_percent;
			var lat_from_pixel = lat_extent * pixels_up_percent;

			var x = extent4326[0] + lon_from_pixel;
			var y = extent4326[1] + lat_from_pixel;

			var group = features[0].get('GROUP');
	
			var zoom = '15';

	  if (group == 8) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=7&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (group == 11) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=9&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if ((group == 14) && (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/25k-gb-1940-43/">War Office, Great Britain 1:25,000. GSGS 3906 - 1940-43</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=195&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if ((group == 14) && (document.getElementById('URHere').innerHTML !== '<a href="/">Maps home</a> &gt; <a href="/os/25k-gb-1940-43/">War Office, Great Britain 1:25,000. GSGS 3906 - 1940-43</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=10&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (group == 22) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=7&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (group == 22) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=7&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (group == 31) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=9&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (group == 32 && y.toFixed(4) > 56) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=195&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (group == 32 && y.toFixed(4) < 56) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=10&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 33) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=168&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 34) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 35) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=171&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 36) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=6&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 37) { window.location = "https://maps.nls.uk/geo/explore/#zoom=5&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4)  + "&layers=10gen"; }
          else if (group == 38) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=163&zoom="  + zoom +  "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4)  + "&layers=10gen"; }
          else if (group == 40) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=164&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 43) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=165&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 44) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=162&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 45) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 55) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=11&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 56) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=2&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 57) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=163&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 59) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=171&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 60) { window.location = "https://maps.nls.uk/geo/explore/#zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4) + "&layers=" + pageURL; }
          else if (group == 61 && y.toFixed(4) > 55) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=170&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 61 && y.toFixed(4) < 55) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=193&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 64) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=176&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 65) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=174&zoom=12&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 66) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=177&zoom=12&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 69) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=107116239&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 70) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=117746211&zoom=17&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 77) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=180&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 79) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=190&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 80) && (document.getElementById('URHere').innerHTML !== '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey maps</a>&gt; <a href="/os/half-inch-mot-roads/">Half-inch MoT road maps (1923)</a>'))
		 { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=191&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 83) && (document.getElementById('URHere').innerHTML !== '<a href="/">Maps home</a> &gt; <a href="/geological/one-inch/">Geological Survey, One-Inch Maps, 1850s-1940s</a>'))
		 { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=197&zoom=12&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 83) && (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/geological/one-inch/">Geological Survey, One-Inch Maps, 1850s-1940s</a>'))
		 { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=196&zoom=12&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 84) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=168&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 101) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=168&zoom=17" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 102) && (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/6inch/">Six-inch 1st edition, 1843-1882</a>')) 
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=5&zoom=15" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 102) && (document.getElementById('URHere').innerHTML !== '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/6inch/">Six-inch 1st edition, 1843-1882</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=171&zoom=15" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 103) && (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/one-inch-rev-new-series/">OS One-Inch to the mile, England and Wales, Revised New Series</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=160&zoom=12" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 103) && (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/one-inch-popular/">OS One-inch "Popular" edition, Scotland, 1921-1930</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=164&zoom=12" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 103) && (document.getElementById('URHere').innerHTML == '<a href=\"/index.html\">Maps home</a> \> <a href=\"/os/one-inch-popular-outline/\">OS One-Inch Popular (Outline), 1921-1930</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=199&zoom=12" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 103) && (document.getElementById('URHere').innerHTML == '<a href=\"/index.html\">Maps home</a> \> <a href=\"/os/one-inch-popular-3908/\">One-Inch Popular, GSGS 3908, 1940-43</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=198&zoom=12" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 103) && (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/one-inch-popular-nat-grid/">One-inch Popular, 1945-1947</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=2&zoom=12" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 103) && (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/one-inch-popular-nat-grid-outline/">OS Scotland One-Inch Popular with National Grid (Outline), 1945-7</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=200&zoom=12" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 103) && (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/one-inch-seventh-series/">One-inch to the mile, 7th Series, 1952-1961</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=11&zoom=12" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 103) && (document.getElementById('URHere').innerHTML == '<a href=\"/index.html\">Maps home</a> \> <a href=\"/geological/one-inch/\">Geological Survey, One-Inch Maps, 1850s-1940s</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=196&zoom=11" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 103) && (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/one-inch-new-popular/">OS One-inch England and Wales, New Popular Edition, 1945-1947</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=12&zoom=11" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if ((group == 103) && (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/one-inch-3rd-colour/">OS One-inch 3rd ed (coloured) (1902-23)</a>'))
		{ window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=102&zoom=11" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 103) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=160&zoom=12" + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 108) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=204&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 109) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=203&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 113) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=208&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 118) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=208&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 120) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 123) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (group == 124) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }


	else {
	window.location = "https://" + window.location.hostname + "/geo/explore/#zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }


		}

	

//		  map.getView().fit(vectorSource.getExtent());



		});



	}



});


var showMapLocationInput = document.getElementById("ol6showmaplocation");

if(showMapLocationInput){

showMapLocationInput.addEventListener('click', function() {


jQuery("#showmaplocationinfo").show();

	document.getElementById('showmaplocationinfo').innerHTML = "Switching to <em>Find by Place</em> viewer... please wait";

	var pageurl = window.location.pathname;

	if (pageurl.indexOf("/view/") >= 0)
		{
			var pageURL = pageurl.replace('/view/', '');
		}
	else
	{
	var pageURL = '74428019';
	}

	var group;

	var vectorSource;

	if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25inch/">25 inch to the mile, 1st edition, 1855-1882</a>')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25inch-2nd-and-later/">25 inch 2nd and later editions, 1892-1949</a>')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25inch-2nd-and-later/">25 inch 2nd and later editions, 1892-1949</a>')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/25inch-england-and-wales/">OS 25 inch England and Wales, 1841-1952</a>')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/index.html">Ordnance Survey</a> &gt; <a href="/os/national-grid/">National Grid maps, 1940s-1960s</a>')
	{	var TypeName = 'OS_National_Grid_all_find'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/national-grid/">National Grid maps, 1940s-1960s</a>')
	{	var TypeName = 'OS_National_Grid_all_find'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/townplans-england/">Ordnance Survey Town Plans of England and Wales, 1840s-1890s</a>')
	{	var TypeName = 'OS_Town_Plans_Eng'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/6inch-england-and-wales/">OS Six-inch England and Wales, 1842-1952</a>')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/6inch/">Six-inch 1st edition, 1843-1882</a>')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/6inch-2nd-and-later/">Six-inch 2nd and later editions, 1892-1960</a>')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey maps</a>&gt; <a href="/os/half-inch-mot-roads/">Half-inch MoT road maps (1923)</a>')
	{	var TypeName = 'os_half_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25k-gb-1937-61/">1:25,000 maps of Great Britain, 1937-1961</a>')
	{	var TypeName = 'OS_25000_uk'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25k-gb-admin/">1:25,000 Administrative Area Series of Great Britain, 1945-1968</a>')
	{	var TypeName = 'OS_25000_uk'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/20k-gb/">War Office, Great Britain 1:20,000, GSGS 2748</a>')
	{	var TypeName = 'OS_25000_uk'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/25k-gb-1940-43/">War Office, Great Britain 1:25,000. GSGS 3906 - 1940-43</a>')
	{	var TypeName = 'OS_25000_uk'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/25k-gb-outline/">1:25,000 Outline Series of Great Britain, 1945-1965</a>')
	{	var TypeName = 'OS_25000_uk'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/land-utilisation-survey/">Land Utilisation Survey, Scotland, 1931-1935</a>')
	{	var TypeName = 'One_Inch_land_utilisation_scot'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/soils/">Soil Survey of Scotland, 1950s-1980s</a>')
	{	var TypeName = 'Soil_Survey'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/half-inch-layers/">Ordnance Survey Scotland, Half-Inch to the mile, 1908-1918 (layer-coloured)</a>')
	{	var TypeName = 'os_half_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/half-inch-hills/">Ordnance Survey Scotland, Half-Inch to the mile, 1908-1918 (hill-shaded)</a>')
	{	var TypeName = 'os_half_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey maps</a>&gt; <a href="/os/half-inch-mot-roads/">Half-inch MoT road maps (1923)</a>')
	{	var TypeName = 'os_half_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/german-army-100k/">German Army, Karte von Schottland, 1:100,000 - 1939-40</a>')
	{	var TypeName = 'os_half_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/ten-mile/">Ten-mile to the Inch, Planning Maps</a>')
	{	var TypeName = 'OS_ten_mile_planning'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/london-1890s/">OS London, Five feet to the Mile, 1893-1896</a>')
	{	var TypeName = 'os_london_1056'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/">Ordnance Survey</a> &gt; <a href="/os/air-photos/">Air Photo Mosaics of Scotland, 1944-1950</a>')
	{	var TypeName = 'catalog_air_photos'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/quarter-inch-first/">OS Quarter Inch to the Mile Maps of Scotland, 1st edition - 1901-1914</a>')
	{	var TypeName = 'os_quarter_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/quarter-inch-third/">OS Quarter Inch to the Mile Maps of Scotland, 3rd edition, 1921-1923</a>')
	{	var TypeName = 'os_quarter_inch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/os/county-series/">OS Indexes to the County Series maps, Scotland, 1854-1886</a>')
	{	var TypeName = 'os_indexes'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/bart_half_england.html">Bartholomew "Half Inch Maps" of England and Wales, 1902-1906</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/bart_england_wales_halfinch_list.html">Bartholomew "Half Inch Maps" of England and Wales, 1919-1924</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/bart_half_scotland.html">Bartholomew "Half Inch to the Mile Maps" of Scotland, 1899-1905</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/bart_scotland_halfinch_list.html">Bartholomew "Half Inch to the Mile Maps" of Scotland, 1926-1935</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/bart_half_great_britain.html">Bartholomew Revised Half-Inch Map, Great Britain, 1940-47</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/ww1/trenches/">British First World War Trench Maps, 1915-1918</a>')
	{	var TypeName = 'TM_Combined_sorted_27700'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/geological/6inch/">Geological Survey, Six-Inch to the Mile, 1st edition</a>')
	{	var TypeName = 'geol_sixinch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/geological/one-inch/">Geological Survey, One-Inch Maps, 1850s-1940s</a>')
	{	var TypeName = 'geol_sixinch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/geological/6inch/">Geological Survey, Six-Inch to the Mile, 2nd and later editions</a>')
	{	var TypeName = 'geol_sixinch'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/towns/">Town plans</a> &gt; <a href="/towns/goad/">Charles Goad Fire Insurance Plans, 1880s-1940s</a>')
	{	var TypeName = 'Goad_Insurance_Plans'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/india/survey-of-india">Survey of India maps</a>')
	{	var TypeName = 'Survey_of_India_Sheet_58'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/">Series maps</a> &gt; <a href="/series/johnston-reduced-ordnance/">Johnston reduced Ordnance maps of Scotland, 1888-1896</a>')
	{	var TypeName = 'Johnston_Scotland_half'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/">Series maps</a> &gt; <a href="/series/johnston-three-miles-to-inch/">Johnston "Three miles to inch" map of Scotland, 1885-1912</a>')
	{	var TypeName = 'Johnston_Scotland'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/">Series maps</a> &gt; <a href="/series/bart_quarter_scotland.html">Bartholomew Quarter-inch to mile map of Scotland, 1911-1932</a>')
	{	var TypeName = 'bart_half_combined'; }
	else if (document.getElementById('URHere').innerHTML == '<a href="/">Maps home</a> &gt; <a href="/series/">Series maps</a> &gt; <a href="/series/gall_and_inglis.html">Gall and Inglis graded road maps of Scotland, 1900s-1930s</a>')
	{	var TypeName = 'Gall_and_Inglis'; }
	else
	{
	var TypeName = 'OS_one_inch_combined';
	}



	var urlgeoserver =  'https://geoserver3.nls.uk/geoserver/wfs?service=WFS' + 
	 			'&version=2.0.0&request=GetFeature&typename=' + TypeName +
				'&PropertyName=(the_geom,GROUP,IMAGE,IMAGETHUMB,IMAGEURL,SHEET,DATES,YEAR)&outputFormat=text/javascript&format_options=callback:loadFeatures' +
				'&srsname=EPSG:900913&CQL_FILTER=IMAGE=' + pageURL;



		var geojsonFormat = new GeoJSON();

		var url = urlgeoserver;

		var vectorSource = new VectorSource();
		var vectorLayer = new VectorLayer({
			mosaic_id: '200',
		  	title: "vectors - vectors",
		        source: vectorSource
		});

		// generate a GetFeature request
		var featureRequest = new WFS().writeGetFeature({
		  srsName: 'EPSG:3857',
		  featureNS: 'http://nls.uk/',
		  featurePrefix: 'nls',
		  featureTypes: [TypeName],
		  propertyNames: ['the_geom','GROUP','IMAGE','IMAGETHUMB','IMAGEURL','SHEET','DATES','YEAR'],
		  outputFormat: 'application/json',
		  filter: equalToFilter ('IMAGE', pageURL)
		});
		
		// then post the request and add the received features to a layer
		fetch('https://geoserver3.nls.uk/geoserver/wfs', {

	      headers : { 
	        'Content-Type': 'application/json',
	        'Accept': 'application/json'
	       },

		  method: 'POST',
		  body: new XMLSerializer().serializeToString(featureRequest)
		}).then(function(response) {

		  return response.json();
		}).then(function(json) {

// console.log(text);



		  var features = new GeoJSON().readFeatures(json);
		  vectorSource.addFeatures(features);

		if (features.length > 0)

		{

			var coords3857 = [];
			coords3857 = features[0].getGeometry().getExtent();
	
// 			alert("Extents 3857: " + coords3857);
			var coords4326 = [];
	      		var extent = applyTransform(coords3857, getTransform("EPSG:3857" , "EPSG:4326"));

			 var x = extent[0] + (extent[2] - extent[0]) / 2; 
			 var y = extent[1] + (extent[3] - extent[1]) / 2; 

			var group = features[0].get('GROUP');
	
			var zoom = '20';

			window.location = "https://maps.nls.uk/geo/find/#zoom=" + zoom + "&lat=" + y.toFixed(4)  + 
				"&lon=" + x.toFixed(4)  + "&layers=" + group + "&point=" + y.toFixed(4)  + "," + x.toFixed(4); 

		}

			else



		{ 
		document.getElementById('showmaplocationinfo').innerHTML = "Sorry, couldn't locate this map"; 
		setTimeout( function(){
			document.getElementById("showmaplocationinfo").innerHTML = "";
			jQuery("#showmaplocationinfo").hide();

		}, 1500); // delay 1000 ms
		return;
		}

		

//		  map.getView().fit(vectorSource.getExtent());



		});

	   });


       }


