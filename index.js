import Map from 'ol/Map';
import {Draw, Modify, Snap} from 'ol/interaction';
import {defaults as defaultInteractions} from 'ol/interaction';
import View from 'ol/View';
import {Circle as CircleStyle, Fill, Icon, Stroke, Style} from 'ol/style';
import {LineString, Polygon} from 'ol/geom';
import Overlay from 'ol/Overlay';
import {defaults as defaultControls, OverviewMap} from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import IIIF from 'ol/source/IIIF';
import IIIFInfo from 'ol/format/IIIFInfo';
import {GPX, GeoJSON, IGC, KML, TopoJSON, WFS} from 'ol/format';
import {Vector as VectorLayer} from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import {tile} from 'ol/loadingstrategy';
import {createXYZ} from 'ol/tilegrid';
import {applyTransform} from 'ol/extent';
import {getTransform} from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {unByKey} from 'ol/Observable';
import DragAndDrop from 'ol/interaction/DragAndDrop';

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
var previousUrl;
var iiifTileSource;
var iiifTileSource2;

var layer = new TileLayer();
var layer2 = new TileLayer();

var loadFeatures;
var features;
var group;

var printPDFNotinprocess;

printPDFNotinprocess = true;

var mapView;
var overviewView = new View({});

var colorsource;
var colorhex;
var rgb_r;
var rgb_g;
var rgb_b;

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
  interactions: defaultInteractions({
  }),
      layers: [layer],
      target: 'map'
    }),
 notifyDiv = document.getElementById('iiif-notification');


function refreshMaplocal(new_url2) {
  fetch(new_url2).then(function(response) {
    response.json().then(function(imageInfo) {
      var options = new IIIFInfo(imageInfo).getTileSourceOptions();
      if (options === undefined || options.version === undefined) {

	notifyDiv.textContent = 'Data seems to be no valid IIIF image information. If refreshing this page again in 30 seconds does not display the map, please contact maps@nls.uk citing this page URL.';
        return;
      }
      options.zDirection = -1;
      options.crossOrigin = 'anonymous';
//     options.tileSize = 256;
//      options.resolutions = [256, 128, 64, 32, 16, 8, 4, 2, 1];
      iiifTileSource = new IIIF(options);
      iiifTileSource2 = new IIIF(options);

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
	if (hash == '')  {
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
      notifyDiv.textContent = 'Could not read image info json. ' + body + ' If refreshing this page again in 30 seconds does not display the map, please contact maps@nls.uk citing this page URL.';
    });
   }).catch(function() {
    notifyDiv.textContent = 'Could not read data from URL. If refreshing this page again in 30 seconds does not display the map, please contact maps@nls.uk citing this page URL.';
  });



}




function refreshMap(url) {
  fetch(url).then(function(response) {
    response.json().then(function(imageInfo) {
      var options = new IIIFInfo(imageInfo).getTileSourceOptions();
      if (options === undefined || options.version === undefined) {
	notifyDiv.textContent = 'Data seems to be no valid IIIF image information. If refreshing this page again in 30 seconds does not display the map, please contact maps@nls.uk citing this page URL.';
        return;
      }
      options.zDirection = -1;
      options.crossOrigin = 'anonymous';
//      options.tileSize = 256;
//      options.resolutions = [256, 128, 64, 32, 16, 8, 4, 2, 1];
      iiifTileSource = new IIIF(options);
      iiifTileSource2 = new IIIF(options);

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
	var new_url2 = new_url1.replace('map-view','mapview');
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

      notifyDiv.textContent = '';


	var hash = window.location.hash;
	if (hash == '') {
	      map.getView().fit(iiifTileSource.getTileGrid().getExtent());
		}
	else if (hash == '#B')
	{
	mapHashBack();
	}
	else
	{
	getMapHash();
	setZoomLatLon();

	}
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


//      notifyDiv.textContent = 'Could not read image info json. ' + body + ' If refreshing this page again in 30 seconds does not display the map, please contact maps@nls.uk citing this page URL.';
    });
   }).catch(function() {
    notifyDiv.textContent = 'Could not read data from URL. If refreshing this page again in 30 seconds does not display the map, please contact maps@nls.uk citing this page URL.';
  });




}


refreshMap(url);


document.getElementById('map').focus();

jQuery("#showmaplocationinfo").hide();

jQuery("#showIIIFinfo").hide();

jQuery("#showlocationinfo").hide();


function mapHashBack()  {

	var hash = window.location.hash;
	  var parts = hash.split('&');

	  if ((parts.length === 1) && (parts[0] == '#B'))
		{
		jQuery("#viewerback").show();
	        map.getView().fit(iiifTileSource.getTileGrid().getExtent());
		history.pushState("", document.title, window.location.pathname + window.location.search);
		}
}

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
		document.getElementById("map").focus();
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
    document.getElementById("map").focus();
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

	history.pushState("", document.title, window.location.pathname + window.location.search);

	var pageurl1 = window.location.href;

	if (pageurl1.indexOf("https://maps.nls.uk/view/") >= 0)
		{
			var pageurl = pageurl1.replace('https://maps.nls.uk/view/', '');
		}
	else
	{
	var pageurl = '74428019';
	}

console.log("pageurl1: "  + pageurl1);
console.log("pageurl: "  + pageurl);

	var group;

	var vectorSource;

	if (map_group_no == '31')
	{	var TypeName = 'catalog_air_photos'; }
	else if (map_group_no == '32')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '33')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (map_group_no == '34')
	{	var TypeName = 'OS_25inch_all_find';	}

	else if (map_group_no == '35')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (map_group_no == '36')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (map_group_no == '42')
	{	var TypeName = 'os_indexes'; }
	else if (map_group_no == '43')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '44')
	{	var TypeName = 'OS_ten_mile_planning'; }
	else if (map_group_no == '45')
	{	var TypeName = 'bart_half_combined'; }

	else if (map_group_no == '49')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '50')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '51')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '57')
	{	var TypeName = 'os_london_1056'; }
	else if (map_group_no == '59')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (map_group_no == '60')
	{	var TypeName = 'TM_Combined_sorted_27700'; }
	else if (map_group_no == '61')
	{	var TypeName = 'OS_National_Grid_all_find'; }
	else if (map_group_no == '64')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (map_group_no == '60')
	{	var TypeName = 'TM_Combined_sorted_27700'; }
	else if (map_group_no == '65')
	{	var TypeName = 'One_Inch_land_utilisation_scot'; }
	else if (map_group_no == '66')
	{	var TypeName = 'Soil_Survey'; }
	else if (map_group_no == '69')
	{	var TypeName = 'hong_kong'; }
	else if (map_group_no == '70')
	{	var TypeName = 'OS_Town_Plans_Eng'; }
	else if (map_group_no == '80')
	{	var TypeName = 'bart_half_combined'; }  
	else if (map_group_no == '83')
	{	var TypeName = 'cyprus_kitchener_3857'; }   
	else if (map_group_no == '84')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '85')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '92')
	{	var TypeName = 'geol_sixinch'; }
	else if (map_group_no == '93')
	{	var TypeName = 'geol_sixinch'; }
	else if (map_group_no == '95')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '96')
	{	var TypeName = 'geol_sixinch'; }
	else if (map_group_no == '99')
	{	var TypeName = 'OS_National_Grid_all_find'; }
	else if (map_group_no == '103')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '104')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '105')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '106')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '107')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '108')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '110')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '111')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '113')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '116')
	{	var TypeName = 'Goad_Insurance_Plans'; }
	else if (map_group_no == '118')
	{	var TypeName = 'Survey_of_India_Sheet_58'; }
	else if (map_group_no == '119')
	{	var TypeName = 'Survey_of_India_Sheet_58'; }
	else if (map_group_no == '120')
	{	var TypeName = 'Johnston_Scotland'; }
	else if (map_group_no == '121')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '122')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '123')
	{	var TypeName = 'Johnston_Scotland_half'; }

	else if (map_group_no == '124')
	{	var TypeName = 'Gall_and_Inglis'; }
	else if (map_group_no == '125')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '147')
	{	var TypeName = 'os_half_inch'; }

	else if (map_group_no == '148')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '149')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '150')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '151')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '152')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '153')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '154')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '155')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '156')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '157')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '158')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '159')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '160')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '161')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '162')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '163')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '167')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '168')
	{	var TypeName = 'OS_National_Grid_all_find'; }

	else if (map_group_no == '167')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '168')
	{	var TypeName = 'OS_National_Grid_all_find'; } 
	else if (map_group_no == '169')
	{	var TypeName = 'os_indexes'; } 
	else if (map_group_no == '170')
	{	var TypeName = 'os_indexes'; } 
	else if (map_group_no == '171')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '173')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '174')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '176')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '180')
	{	var TypeName = 'OS_25inch_blue_and_black'; } 
	else
	{
	var TypeName = 'OS_one_inch_combined';
	}


//	alert(TypeName);

	var urlgeoserver =  'https://geo-server.nls.uk/geoserver/wfs?service=WFS' + 
	 			'&version=2.0.0&request=GetFeature&typename=' + TypeName +
				'&PropertyName=(the_geom,GROUP,IMAGE,IMAGETHUMB,IMAGEURL,SHEET,DATES,YEAR)&outputFormat=text/javascript&format_options=callback:loadFeatures' +
				'&srsname=EPSG:900913&CQL_FILTER=IMAGE=' + pageurl;

		
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
		  filter: equalToFilter ('IMAGE', pageurl)
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
	
			var zoom = '13';

        	  if (map_group_no == 8) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=7&zoom=12&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 31) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=9&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 32) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=10&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
      	  else if (map_group_no == 33) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=168&zoom=15&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 34) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=168&zoom=15&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 35) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=5&zoom=14&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 36) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=6&zoom=14&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 37) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=2&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 38) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=205&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 39) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=1&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 40) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=164&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 43) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=165&zoom=10&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 44) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=162&zoom=7&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }

          else if (map_group_no == 45) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 49) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=8&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 50) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 51) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=179&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 54) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=160&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 55) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=11&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 56) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=12&zoom=" + "&lat="  + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 57) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=163&zoom=17&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 58) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=161&zoom="  + zoom +  "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 59) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=171&zoom=14&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 60) { window.location = "https://maps.nls.uk/geo/explore/#zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4) + "&layers=" + pageurl; }
          else if (map_group_no == 61) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=193&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 63) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=74428076&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 64) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=176&zoom=15&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 65) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=174&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 66) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=177&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 69) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=107116239&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 70) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=117746211&zoom=17&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 77) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=180&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 80) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=179&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 83) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=190&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 84) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=191&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 85) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=192&zoom=10&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 89) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=199&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 90) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=199&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 92) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=196&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 93) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=197&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 95) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=195&zoom=10&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 96) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=196&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 97) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=164&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 98) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=199&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 99) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=173&zoom=17&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 100) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=198&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 101) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=200&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 102) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=198&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 103) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=220&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 104) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=10&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 105) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=10&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 106) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=219&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 107) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=204&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 108) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=203&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 109) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=202&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 110) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=224&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 111) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 113) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=10&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 116) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=168&zoom=13&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 118) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=208&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 119) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=210&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 120) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 121) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=7&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 122) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 123) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 124) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 125) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 126) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 147) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=220&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 148) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=224&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 149) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=224&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 150) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=221&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 151) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=165&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 152) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=223&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 153) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=165&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 154) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 155) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 156) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 157) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 158) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 159) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 160) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 161) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 162) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 163) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 164) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=11&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 165) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=11&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 166) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=11&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 167) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=165&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if ((map_group_no == 168) && (y.toFixed(4) > 54)) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=170&zoom=16&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if ((map_group_no == 168) && (y.toFixed(4) < 54)) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=173&zoom=16&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 171) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=226&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 172) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=172&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 173) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=226&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 174) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=227&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 175) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=175&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 176) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=227&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 180) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=241&zoom=13&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
	else {
	window.location = "https://" + window.location.hostname + "/geo/explore/#zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
		}

	

//		  map.getView().fit(vectorSource.getExtent());



		});



	}



});


jQuery('#viewgeoreferencedlocationpopup').click(function(){ 

	jQuery("#showlocationinfo").hide();

	jQuery("#showmaplocationinfo").show();

	document.getElementById('showmaplocationinfo').innerHTML = "Click on your place of interest to see it in the <em>Explore Georeferenced Maps</em> viewer";

	document.getElementById("map").focus();

	var pointerMoveHandler = function (evt) {
	  if (evt.dragging) {
	    return;
	  }

           var helpMsg = 'Click on your place of interest to see it <br/>in the <em>Explore Georeferenced Maps</em> viewer';

	  helpTooltipElement.innerHTML = helpMsg;
	  helpTooltip.setPosition(evt.coordinate);
	
	  helpTooltipElement.classList.remove('hidden');
	};

	function createHelpTooltip() {
	  if (helpTooltipElement) {
	    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
	  }
	  helpTooltipElement = document.createElement('div');
	  helpTooltipElement.className = 'ol-tooltip hidden';
	  helpTooltip = new Overlay({
	    element: helpTooltipElement,
	    offset: [25, 5],
	    positioning: 'center-left',
	  });
	  map.addOverlay(helpTooltip);
	}

	createHelpTooltip();
	map.on('pointermove', pointerMoveHandler);


  map.on('click', function(event) {

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

	history.pushState("", document.title, window.location.pathname + window.location.search);

	var pageurl1 = window.location.href;

	if (pageurl1.indexOf("https://maps.nls.uk/view/") >= 0)
		{
			var pageurl = pageurl1.replace('https://maps.nls.uk/view/', '');
		}
	else
	{
	var pageurl = '74428019';
	}

console.log("pageurl1: "  + pageurl1);
console.log("pageurl: "  + pageurl);

	var group;

	var vectorSource;

	if (map_group_no == '31')
	{	var TypeName = 'catalog_air_photos'; }
	else if (map_group_no == '32')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '33')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (map_group_no == '34')
	{	var TypeName = 'OS_25inch_all_find';	}

	else if (map_group_no == '35')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (map_group_no == '36')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (map_group_no == '42')
	{	var TypeName = 'os_indexes'; }
	else if (map_group_no == '43')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '44')
	{	var TypeName = 'OS_ten_mile_planning'; }
	else if (map_group_no == '45')
	{	var TypeName = 'bart_half_combined'; }

	else if (map_group_no == '49')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '50')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '51')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '57')
	{	var TypeName = 'os_london_1056'; }
	else if (map_group_no == '59')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (map_group_no == '60')
	{	var TypeName = 'TM_Combined_sorted_27700'; }
	else if (map_group_no == '61')
	{	var TypeName = 'OS_National_Grid_all_find'; }
	else if (map_group_no == '64')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (map_group_no == '60')
	{	var TypeName = 'TM_Combined_sorted_27700'; }
	else if (map_group_no == '65')
	{	var TypeName = 'One_Inch_land_utilisation_scot'; }
	else if (map_group_no == '66')
	{	var TypeName = 'Soil_Survey'; }
	else if (map_group_no == '69')
	{	var TypeName = 'hong_kong'; }
	else if (map_group_no == '70')
	{	var TypeName = 'OS_Town_Plans_Eng'; }
	else if (map_group_no == '80')
	{	var TypeName = 'bart_half_combined'; }  
	else if (map_group_no == '83')
	{	var TypeName = 'cyprus_kitchener_3857'; }   
	else if (map_group_no == '84')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '85')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '92')
	{	var TypeName = 'geol_sixinch'; }
	else if (map_group_no == '93')
	{	var TypeName = 'geol_sixinch'; }
	else if (map_group_no == '95')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '96')
	{	var TypeName = 'geol_sixinch'; }
	else if (map_group_no == '99')
	{	var TypeName = 'OS_National_Grid_all_find'; }
	else if (map_group_no == '103')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '104')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '105')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '106')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '107')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '108')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '110')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '111')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '113')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '116')
	{	var TypeName = 'Goad_Insurance_Plans'; }
	else if (map_group_no == '118')
	{	var TypeName = 'Survey_of_India_Sheet_58'; }
	else if (map_group_no == '119')
	{	var TypeName = 'Survey_of_India_Sheet_58'; }
	else if (map_group_no == '120')
	{	var TypeName = 'Johnston_Scotland'; }
	else if (map_group_no == '121')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '122')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '123')
	{	var TypeName = 'Johnston_Scotland_half'; }

	else if (map_group_no == '124')
	{	var TypeName = 'Gall_and_Inglis'; }
	else if (map_group_no == '125')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '147')
	{	var TypeName = 'os_half_inch'; }

	else if (map_group_no == '148')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '149')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '150')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '151')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '152')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '153')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '154')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '155')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '156')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '157')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '158')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '159')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '160')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '161')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '162')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '163')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '167')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '168')
	{	var TypeName = 'OS_National_Grid_all_find'; } 
	else if (map_group_no == '169')
	{	var TypeName = 'os_indexes'; } 
	else if (map_group_no == '170')
	{	var TypeName = 'os_indexes'; } 
	else if (map_group_no == '171')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '173')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '174')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '176')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '180')
	{	var TypeName = 'OS_25inch_blue_and_black'; } 
	else
	{
	var TypeName = 'OS_one_inch_combined';
	}


//	alert(TypeName);

	var urlgeoserver =  'https://geo-server.nls.uk/geoserver/wfs?service=WFS' + 
	 			'&version=2.0.0&request=GetFeature&typename=' + TypeName +
				'&PropertyName=(the_geom,GROUP,IMAGE,IMAGETHUMB,IMAGEURL,SHEET,DATES,YEAR)&outputFormat=text/javascript&format_options=callback:loadFeatures' +
				'&srsname=EPSG:900913&CQL_FILTER=IMAGE=' + pageurl;

		
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
		  filter: equalToFilter ('IMAGE', pageurl)
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
	
			var zoom = '13';

        	  if (map_group_no == 8) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=7&zoom=12&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 31) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=9&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 32) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=10&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
      	  else if (map_group_no == 33) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=168&zoom=15&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 34) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=168&zoom=15&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 35) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=5&zoom=14&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 36) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=6&zoom=14&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 37) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=2&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 38) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=205&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 39) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=1&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 40) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=164&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 43) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=165&zoom=10&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 44) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=162&zoom=7&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }

          else if (map_group_no == 45) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 49) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=8&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 50) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 51) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=179&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 54) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=160&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 55) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=11&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 56) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=12&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 57) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=163&zoom=17&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 58) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=161&zoom="  + zoom +  "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 59) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=171&zoom=14&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 60) { window.location = "https://maps.nls.uk/geo/explore/#zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4) + "&layers=" + pageurl; }
          else if (map_group_no == 61) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=193&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 63) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=74428076&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 64) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=176&zoom=15&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 65) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=174&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 66) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=177&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 69) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=107116239&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 70) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=117746211&zoom=17&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 77) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=180&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 80) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=179&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 83) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=190&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 84) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=191&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 85) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=192&zoom=10&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 89) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=199&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 90) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=199&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 92) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=196&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 93) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=197&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 95) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=195&zoom=10&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 96) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=196&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 97) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=164&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 98) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=199&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 99) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=173&zoom=17&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 100) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=198&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 101) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=200&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 102) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=198&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 103) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=220&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 104) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=10&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 105) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=10&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 106) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=219&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 107) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=204&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 108) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=203&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 109) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=202&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 110) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=224&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 111) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 113) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=10&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 116) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=168&zoom=13&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 118) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=208&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 119) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=210&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 120) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 121) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=7&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 122) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 123) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 124) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 125) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 126) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=156&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 147) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=220&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 148) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=224&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 149) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=224&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 150) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=221&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 151) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=165&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 152) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=223&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 153) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=165&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 154) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 155) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 156) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 157) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 158) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 159) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 160) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 161) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 162) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 163) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=222&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 164) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=11&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 165) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=11&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
          else if (map_group_no == 166) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=11&zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 167) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=165&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if ((map_group_no == 168) && (y.toFixed(4) > 54)) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=170&zoom=16&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if ((map_group_no == 168) && (y.toFixed(4) < 54)) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=173&zoom=16&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 171) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=226&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 172) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=172&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 173) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=226&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 174) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=227&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 175) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=175&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 176) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=227&zoom=11&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
     	  else if (map_group_no == 180) { window.location = "https://maps.nls.uk/openlayers.cfm?m=1&id=241&zoom=13&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }

	else {
	window.location = "https://" + window.location.hostname + "/geo/explore/#zoom=" + zoom + "&lat=" + y.toFixed(4) + "&lon=" + x.toFixed(4); }
		}


//		  map.getView().fit(vectorSource.getExtent());



		});
	});

});


var showiiifInput = document.getElementById("showiiif");

if(showiiifInput){

showiiifInput.addEventListener('click', function() {

	if(jQuery('#showlocationinfo').is(':visible')){
		jQuery("#showlocationinfo").hide();
	};

	history.pushState("", document.title, window.location.pathname + window.location.search);

	var pageurl1 = window.location.href;

	if (pageurl1.indexOf("https://maps.nls.uk/view/") >= 0)


	{

	console.log("pageurl: " + pageurl);


			var pageurl = pageurl1.replace('https://maps.nls.uk/view/', '');

	console.log("pageurl1: " + pageurl1);

			var image_id = pageurl1.replace('https://maps.nls.uk/view/','');
			var image_id_length = image_id.length;
			var image_id_prefix4 = image_id.substring(0, 4); 
			if ((image_id_length == 8) && (image_id_prefix4 !== '0000'))
			{ 
			var iiifurl = 'https://map-view.nls.uk/iiif/2/' + image_id_prefix4 + '%2F' + image_id + '/info.json'; 
			}
			else if ((image_id_length == 8) && (image_id_prefix4 == '0000'))
			{ 

			var image_id_4 = image_id.replace('0000','');
			var image_id_4_prefix1 = image_id_4.substring(0, 1); 
				if (image_id_4_prefix1 == '0')
				{ 
				var image_id_4_new = image_id_4.substring(1, 4);
				var iiifurl = 'https://map-view.nls.uk/iiif/2/' + image_id_4_new + '/info.json'; 

				}
				else 
				{
				var iiifurl = 'https://map-view.nls.uk/iiif/2/' + image_id_4 + '/info.json'; 
				}
			}
			else if (image_id_length == 9) 
			{ var image_id_prefix5 = image_id.substring(0, 5); 
		
			var iiifurl = 'https://map-view.nls.uk/iiif/2/' + image_id_prefix5 + '%2F' + image_id + '/info.json'; 
			}
			console.log("iifurl :" + iiifurl);
			var iiifurl_escape = encodeURI(iiifurl);
			var allmaps_editor = 'https://editor.allmaps.org/#/collection?url=' + iiifurl_escape;

			jQuery("#showIIIFinfo").show();
			document.getElementById('showIIIFinfo').innerHTML = '<button type="button" id="hideIIIF" class="close" aria-label="Close">' +
                  						    '<span aria-hidden="true">&times;</span></button><h3>IIIF Image API - <code>info.json</code> for this map:</h3><a href="' + iiifurl + '" target="remotes">' + iiifurl + '</a><br/>' +
								    '<p>This <a href="https://iiif.io/api/image/2.1/" target="remotes">IIIF Image API</a> <code>info.json</code> endpoint can be' +
								    ' used inside <a href="https://iiif.io/apps-demos/" target="remotes">IIIF viewers</a>, in <a href="https://www.georeferencer.com/">Georeferencer</a> or<br/><a href="' + allmaps_editor +'">Allmaps Editor</a> (for georeferencing), or in transcription software ' +
								    '(eg. <a href="https://recogito.pelagios.org/" target="remotes">Recogito</a>).</p> '; 

			jQuery("#hideIIIF").click(function(){
			        jQuery("#showIIIFinfo").hide();
				document.getElementById("map").focus();
			 });

		}
	else
	{
	return;
	}


    });

}



var viewlocationInput = document.getElementById("viewlocation");

if(viewlocationInput){

	viewlocationInput.addEventListener('click', function() {
	
			if (map_group_no == 31)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Air Photo Mosaics, 1944-1950 layer)';  }
				if (map_group_no == 32)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 1:25,000, 1937-61 layer)'; }
				if (map_group_no == 33)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 25 inch, 2nd ed., 1892-1914 layer)'; }
				if (map_group_no == 34)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 25 inch, 2nd ed., 1892-1914 layer)'; }
				if (map_group_no == 35)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Six-inch, 1st ed., 1843-1882 layer)'; }
				if (map_group_no == 36)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Six-inch, 2nd ed., 1888-1913 layer)'; }
				if (map_group_no == 37)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, Popular, 1921-30 layer)'; }
				if (map_group_no == 38)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, 1st ed., 1857-1891 layer)'; }
				if (map_group_no == 39)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, 2nd ed., 1885-1900 layer)'; }
				if (map_group_no == 40)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, Popular, 1921-1930 layer)'; }
				if (map_group_no == 43)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Ten mile, Admin, 1956 layer)'; }
				if (map_group_no == 44)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter inch, 3rd ed, 1921-1923 layer)'; }
				if (map_group_no == 45)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Half-inch, 1899-1905 layer)'; }
				if (map_group_no == 49)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Half-inch, 1926-35 layer)'; }
				if (map_group_no == 50)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Half-inch, 1897-1907 layer)'; }
				if (map_group_no == 51)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Half-inch, 1919-1924 layer)'; }
				if (map_group_no == 52)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch (Outline), 1885-1900 layer)'; }
				if (map_group_no == 53)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch (Outline), 1885-1900 layer)'; }
				if (map_group_no == 54)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, 1892-1908 layer)'; }
				if (map_group_no == 55)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, 1955-1961 layer)'; }
				if (map_group_no == 56)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, 1945-1948 layer)'; }
				if (map_group_no == 57)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS London, five-foot, 1893-96 layer)'; }
				if (map_group_no == 58)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch (hills), 1885-1903 layer)'; }
				if (map_group_no == 59)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS six-inch, 1888-1913 layer)'; }
				if (map_group_no == 60)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Trench maps, 1914-1918 layer)'; }
				if (map_group_no == 61)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 1:10,560, 1940s-1970 layer)'; }
				if (map_group_no == 64)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 25 inch, 1892-1914 layer)'; }
				if (map_group_no == 65)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Land utilisation, 1931-35 layer)'; }
				if (map_group_no == 66)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Macaulay soil maps, 1950s-60s layer)'; }
				if (map_group_no == 69)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Hong-Kong, 1840s layer)'; }
				if (map_group_no == 70)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Town Plans, 1840s-1890s layer)'; }
				if (map_group_no == 80)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Half-inch, 1919-1924 layer)'; }
				if (map_group_no == 84)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Half-Inch (MOT), 1923 layer)'; }
				if (map_group_no == 85)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Half-inch, 1940-47 layer)'; }
				if (map_group_no == 89)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch (hills), 1921-30 layer)'; }
				if (map_group_no == 90)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch (hills), 1921-30 layer)'; }
				if (map_group_no == 91)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch (Outline), 1885-1900 layer)'; }
				if (map_group_no == 92)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Geological One-inch, 1860s-1940s layer)'; }
				if (map_group_no == 93)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Geological six-inch, 1900s-1940s layer)'; }
				if (map_group_no == 95)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, GSGS 3906 1940-43 layer)'; }
				if (map_group_no == 96)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Geological One-inch, 1860s-1940s layer)'; }
				if (map_group_no == 97)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, Popular, 1921-30 layer)'; }
				if (map_group_no == 98)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, Popular (Outline), 1921-30 layer)'; }
				if (map_group_no == 99)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 1:1,250/2,500, 1940s-60s layer)'; }
				if (map_group_no == 100)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, GSGS 3908, 1940-43 layer)'; }
				if (map_group_no == 101)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, Popular (Outline), 1945-48 layer)'; }
				if (map_group_no == 102)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, GSGS 3908, 1940-43 layer)'; }
				if (map_group_no == 103)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Half-inch, Water in blue, 1942 layer)'; }
				if (map_group_no == 104)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 1:25,000, 1937-61)'; }
				if (map_group_no == 105)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 1:25,000, 1937-61)'; }
				if (map_group_no == 106)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 1:25,000 (Outline), 1945-65)'; }
				if (map_group_no == 107)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Half-inch (layers), 1908-18)'; }
				if (map_group_no == 108)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Half-inch (hills), 1908-18)'; }
				if (map_group_no == 109)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch 3rd ed, 1902-23)'; }
				if (map_group_no == 110)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 1st ed, 1901-3)'; }
				if (map_group_no == 111)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 113)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 1:25,000, 1937-61)'; }
				if (map_group_no == 116)
					{ document.getElementById('explorelayerinfo').innerHTML = '(25 inch, 2nd ed., 1892-1914 layer)'; }
				if (map_group_no == 118)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Survey of India, Half-inch, 1916-25 layer)'; }
				if (map_group_no == 119)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Survey of India, One-inch, 1912-45 layer)'; }
				if (map_group_no == 120)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Half-inch, 1897-1907 layer)'; }
				if (map_group_no == 121)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Survey Atlas, 1912 layer)'; }
				if (map_group_no == 122)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Half-inch, 1897-1907 layer)'; }
				if (map_group_no == 123)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Half-inch, 1897-1907 layer)'; }
				if (map_group_no == 124)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Half-inch, 1897-1907 layer)'; }
				if (map_group_no == 125)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 126)
					{ document.getElementById('explorelayerinfo').innerHTML = '(Bartholomew Half-inch, 1897-1907 layer)'; }
				if (map_group_no == 144)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch (Outline), 1885-1900 layer)'; }
				if (map_group_no == 145)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch (Outline), 1885-1900 layer)'; }
				if (map_group_no == 147)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Half-inch, Water in blue, 1942 layer)'; }
				if (map_group_no == 148)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch, 1st ed (Outline), 1900-6 layer)'; }
				if (map_group_no == 149)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch, 1st ed (Outline), 1900-6 layer)'; }
				if (map_group_no == 150)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch, 1st ed (Hills), 1900-6 layer)'; }
				if (map_group_no == 151)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch, 3rd ed, 1921-1923 layer)'; }
				if (map_group_no == 152)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch, Civil Air, 1929-1930 layer)'; }
				if (map_group_no == 153)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch, 3rd ed, 1921-1923 layer)'; }
				if (map_group_no == 154)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 155)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 156)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 157)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 158)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 159)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 160)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 161)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 162)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 163)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch 4th ed, 1935-7)'; }
				if (map_group_no == 164)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, 1955-1961 layer)'; }
				if (map_group_no == 165)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, 1955-1961 layer)'; }
				if (map_group_no == 166)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS One-inch, 1955-1961 layer)'; }
				if (map_group_no == 167)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch, 3rd ed, 1921-1923 layer)'; }
				if (map_group_no == 168)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 1:1,250/2,500, 1940s-60s layer)'; }
				if (map_group_no == 171)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch, Admin. 1950-52 layer)'; }
				if (map_group_no == 173)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch, Admin. 1950-52 layer)'; }
				if (map_group_no == 174)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch, Admin. ca. 1960 layer)'; }
				if (map_group_no == 176)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS Quarter-inch, Admin. ca. 1960 layer)'; }
				if (map_group_no == 176)
					{ document.getElementById('explorelayerinfo').innerHTML = '(OS 25 inch "blue-and-blacks" 1890s-1940s layer)'; }

//				else 
//					{ document.getElementById('explorelayerinfo').innerHTML = ''; }

				jQuery("#showlocationinfo").show();
				document.getElementById("map").focus();

			if(jQuery('#showIIIFinfo').is(':visible')){
				jQuery("#showIIIFinfo").hide();

			};


			jQuery("#hideshowlocationinfo").click(function(){
			        jQuery("#showlocationinfo").hide();
				document.getElementById("map").focus();
			 });


 	});
	
	
}


jQuery('#showmaplocationpopup').click(function(){ 

	jQuery("#showlocationinfo").hide();

	jQuery("#showmaplocationinfo").show();

	document.getElementById('showmaplocationinfo').innerHTML = "Switching to <em>Map Finder</em> viewer... please wait";

	history.pushState("", document.title, window.location.pathname + window.location.search);

	var pageurl1 = window.location.href;

	if (pageurl1.indexOf("https://maps.nls.uk/view/") >= 0)
		{
			var pageurl = pageurl1.replace('https://maps.nls.uk/view/', '');
		}
	else
	{
	var pageurl = '74428019';
	}


console.log("pageurl1: "  + pageurl1);
console.log("pageurl: "  + pageurl);


	var vectorSource;


	if (map_group_no == '31')
	{	var TypeName = 'catalog_air_photos'; }
	else if (map_group_no == '32')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '33')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (map_group_no == '34')
	{	var TypeName = 'OS_25inch_all_find';	}

	else if (map_group_no == '35')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (map_group_no == '36')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (map_group_no == '42')
	{	var TypeName = 'os_indexes'; }
	else if (map_group_no == '43')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '44')
	{	var TypeName = 'OS_ten_mile_planning'; }
	else if (map_group_no == '45')
	{	var TypeName = 'bart_half_combined'; }

	else if (map_group_no == '49')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '50')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '51')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '57')
	{	var TypeName = 'os_london_1056'; }
	else if (map_group_no == '59')
	{	var TypeName = 'OS_6inch_all_find'; }
	else if (map_group_no == '60')
	{	var TypeName = 'TM_Combined_sorted_27700'; }
	else if (map_group_no == '61')
	{	var TypeName = 'OS_National_Grid_all_find'; }
	else if (map_group_no == '64')
	{	var TypeName = 'OS_25inch_all_find';	}
	else if (map_group_no == '60')
	{	var TypeName = 'TM_Combined_sorted_27700'; }
	else if (map_group_no == '65')
	{	var TypeName = 'One_Inch_land_utilisation_scot'; }
	else if (map_group_no == '66')
	{	var TypeName = 'Soil_Survey'; }
	else if (map_group_no == '69')
	{	var TypeName = 'hong_kong'; }
	else if (map_group_no == '70')
	{	var TypeName = 'OS_Town_Plans_Eng'; }
	else if (map_group_no == '80')
	{	var TypeName = 'bart_half_combined'; }  
	else if (map_group_no == '83')
	{	var TypeName = 'cyprus_kitchener_3857'; }   
	else if (map_group_no == '84')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '85')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '92')
	{	var TypeName = 'geol_sixinch'; }
	else if (map_group_no == '93')
	{	var TypeName = 'geol_sixinch'; }
	else if (map_group_no == '95')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '96')
	{	var TypeName = 'geol_sixinch'; }
	else if (map_group_no == '99')
	{	var TypeName = 'OS_National_Grid_all_find'; }
	else if (map_group_no == '103')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '104')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '105')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '106')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '107')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '108')
	{	var TypeName = 'os_half_inch'; }
	else if (map_group_no == '110')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '111')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '113')
	{	var TypeName = 'OS_25000_uk'; }
	else if (map_group_no == '116')
	{	var TypeName = 'Goad_Insurance_Plans'; }
	else if (map_group_no == '118')
	{	var TypeName = 'Survey_of_India_Sheet_58'; }
	else if (map_group_no == '119')
	{	var TypeName = 'Survey_of_India_Sheet_58'; }
	else if (map_group_no == '120')
	{	var TypeName = 'Johnston_Scotland'; }
	else if (map_group_no == '121')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '122')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '123')
	{	var TypeName = 'Johnston_Scotland_half'; }

	else if (map_group_no == '124')
	{	var TypeName = 'Gall_and_Inglis'; }
	else if (map_group_no == '125')
	{	var TypeName = 'bart_half_combined'; }
	else if (map_group_no == '147')
	{	var TypeName = 'os_half_inch'; }

	else if (map_group_no == '148')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '149')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '150')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '151')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '152')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '153')
	{	var TypeName = 'os_quarter_inch'; }
	else if (map_group_no == '154')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '155')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '156')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '157')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '158')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '159')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '160')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '161')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '162')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '163')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '167')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '168')
	{	var TypeName = 'OS_National_Grid_all_find'; } 
	else if (map_group_no == '169')
	{	var TypeName = 'os_indexes'; } 
	else if (map_group_no == '170')
	{	var TypeName = 'os_indexes'; } 
	else if (map_group_no == '171')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '173')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '174')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '176')
	{	var TypeName = 'os_quarter_inch'; } 
	else if (map_group_no == '180')
	{	var TypeName = 'OS_25inch_blue_and_black'; } 
	else
	{
	var TypeName = 'OS_one_inch_combined';
	}



	var urlgeoserver =  'https://geo-server.nls.uk/geoserver/wfs?service=WFS' + 
	 			'&version=2.0.0&request=GetFeature&typename=' + TypeName +
				'&PropertyName=(the_geom,GROUP,IMAGE,IMAGETHUMB,IMAGEURL,SHEET,DATES,YEAR)&outputFormat=text/javascript&format_options=callback:loadFeatures' +
				'&srsname=EPSG:900913&CQL_FILTER=IMAGE=' + pageurl;



		var geojsonFormat = new GeoJSON();

		var url = urlgeoserver;

		var vectorSource = new VectorSource();
		var vectorLayer = new VectorLayer({
			mosaic_id: '200',
		  	title: "vectors - vectors",
		        source: vectorSource
		});

		setTimeout( function(){




		// generate a GetFeature request
		var featureRequest = new WFS().writeGetFeature({
		  srsName: 'EPSG:3857',
		  featureNS: 'http://nls.uk/',
		  featurePrefix: 'nls',
		  featureTypes: [TypeName],
		  propertyNames: ['the_geom','GROUP','IMAGE','IMAGETHUMB','IMAGEURL','SHEET','DATES','YEAR'],
		  outputFormat: 'application/json',
		  filter: equalToFilter ('IMAGE', pageurl)
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
				"&lon=" + x.toFixed(4)  + "&layers=" + group + "&b=1&z=1&point=" + y.toFixed(4)  + "," + x.toFixed(4); 

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

			}, 500); // delay 50 ms

		});



});

	/**
	 * Currently drawn feature.
	 * @type {ol.Feature}
	 */
	var sketch;
	
	
	/**
	 * The help tooltip element.
	 * @type {Element}
	 */
	var helpTooltipElement;
	
	
	/**
	 * Overlay to show the help messages.
	 * @type {ol.Overlay}
	 */
	var helpTooltip;
	
	
	/**
	 * The measure tooltip element.
	 * @type {Element}
	 */
	var measureTooltipElement;
	
	
	/**
	 * Overlay to show the measurement.
	 * @type {ol.Overlay}
	 */
	var measureTooltip;
	
	
	/**
	 * Message to show when the user is drawing a polygon.
	 * @type {string}
	 */
	var continuePolygonMsg = 'Single-click to continue drawing the polygon.<br/> Double-click to stop';
	
	
	/**
	 * Message to show when the user is drawing a line.
	 * @type {string}
	 */
	var continueLineMsg = 'Single-click to continue drawing the line.<br/> Double-click to stop';

var drawInput = document.getElementById("draw");

if(drawInput){

	drawInput.addEventListener('click', function() {




	var pointerMoveHandler = function (evt) {
	  if (evt.dragging) {
	    return;
	  }
	  /** @type {string} */

 	var value = typeSel.value;
	   if (value == 'Off')
		{
		var helpMsg = '';
	        return;
		}
	        else if (value == 'Point')
		{
		var helpMsg = 'Click to add point to the map.';
		}
		else if	(value == 'Circle')
		{
		var helpMsg = 'Click on the centre of the circle,<br/>move the mouse, and then <br/>Click to add the perimeter of the circle.';
		}
		else if (value == 'LineString')
		{
	  	var helpMsg = 'Click to start drawing.<br/>Click to change direction.<br/>Double-click to stop.';
		}
		else if (value == 'Polygon') 
		{
	  	var helpMsg = 'Click to start drawing.<br/>Click to change direction.<br/>Double-click to close polygon.';
		}
	
	  if (sketch) {
	    var geom = sketch.getGeometry();
	    if (geom instanceof Polygon) {
//	      helpMsg = continuePolygonMsg;
	    } else if (geom instanceof LineString) {
//	      helpMsg = continueLineMsg;
	    }
	  }
	
	  helpTooltipElement.innerHTML = helpMsg;
	  helpTooltip.setPosition(evt.coordinate);
	
	  helpTooltipElement.classList.remove('hidden');
	};



	/**
	 * Creates a new help tooltip
	 */


	function createHelpTooltip() {
	  if (helpTooltipElement) {
	    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
	  }
	  helpTooltipElement = document.createElement('div');
	  helpTooltipElement.className = 'ol-tooltip hidden';
	  helpTooltip = new Overlay({
	    element: helpTooltipElement,
	    offset: [25, 5],
	    positioning: 'center-left',
	  });
	  map.addOverlay(helpTooltip);
	}

      var typeSel = document.getElementById('drawtype');

      var draw, snap; // global so we can remove it later

      function addInteraction() {


	colorsource = new VectorSource();

	var vectorcolor = new VectorLayer({
	  title: "vectorcolor",
	  source: colorsource,
	  style: new Style({
	    fill: new Fill({
	      color: 'rgba(255, 255, 255, 0.6)'
	    }),
	    stroke: new Stroke({
	      width: 4,
	      color: 'rgba(' + rgb_r + ', ' + rgb_g + ', ' + rgb_b + ', 0.9)',
	    }),
	    image: new CircleStyle({
	      radius: 6,
	      fill: new Fill({
	      color: 'rgba(' + rgb_r + ', ' + rgb_g + ', ' + rgb_b + ', 0.9)',
	      })

	    })
	  })
	});



	var maplayerlength = map.getLayers().getLength();

	map.getLayers().insertAt(maplayerlength,vectorcolor);


	var modify = new Modify({source: colorsource});
	map.addInteraction(modify);

        var value = typeSel.value;
        if ((value == 'Polygon') || (value == 'LineString')) {
          draw = new Draw({
            source: colorsource,
            type: /** @type {ol.geom.GeometryType} */ (typeSel.value)
	  });
          map.addInteraction(draw);

	createHelpTooltip();
	map.on('pointermove', pointerMoveHandler);

	  draw.on('drawstart',
	      function(evt) {
	        // set sketch
	        sketch = evt.feature;
	      }, this);
 
	  draw.on('drawend',
	      function(evt) {
         	document.getElementById('stopmeasuringmessage').innerHTML = 'Click and drag on drawn features if you would like to move them.';
         	document.getElementById('measuremessage').innerHTML = 'To save, click on <em>Print PDF</em>, or right-click and choose <em>Save image as...</em> or <em>Export JSON</em>';
	        jQuery("#removelastfeaturebutton").show();
	        jQuery("#exportbutton").show();
	      }, this);

        snap = new Snap({source: colorsource});
        map.addInteraction(snap);

        }
        else if ((value == 'Point')  || (value == 'Circle')) {
          draw = new Draw({
            source: colorsource,
            type: /** @type {ol.geom.GeometryType} */ (typeSel.value)
	  });
          map.addInteraction(draw);

	createHelpTooltip();
	map.on('pointermove', pointerMoveHandler);

	  draw.on('drawstart',
	      function(evt) {
	        // set sketch
	        sketch = evt.feature;

	      }, this);
 
	  draw.on('drawend',
	      function(evt) {
         	document.getElementById('stopmeasuringmessage').innerHTML = 'Click and drag on drawn features if you would like to move them.';
         	document.getElementById('measuremessage').innerHTML = 'To save, click on <em>Print PDF</em>, or right-click and choose <em>Save image as...</em> or <em>Export JSON</em>';
	        jQuery("#removelastfeaturebutton").show();
	        jQuery("#exportbutton").show();
	      }, this);


        snap = new Snap({source: colorsource});
        map.addInteraction(snap);

        }
	else
	{
	return;
//	stopmeasuring();
	}


	}

      /**
       * Handle change event.
       */
      typeSel.onchange = function() {
	var overlayslength = map.getOverlays().getLength();
	if (overlayslength > 0) {map.getOverlays().clear();}
        map.removeInteraction(draw);
 	map.removeInteraction(snap);

        addInteraction();

 };

	
	        jQuery("#colorcontainer").removeClass("hidden");

	        jQuery("#colorcontainer").show();

	console.log("draw activated");

		var cpFancy = ColorPicker(document.getElementById('fancy'), updateInputs);
		
		var iHex = document.getElementById('hex');
		var iR = document.getElementById('rgb_r');
		var iG = document.getElementById('rgb_g');
		var iB = document.getElementById('rgb_b');
		
		
		function updateInputs(hex) {
		
		    var rgb = ColorPicker.hex2rgb(hex);
		    var hsv = ColorPicker.hex2hsv(hex);
		
		    iHex.value = hex;
		    
		    iR.value = rgb.r;
		    iG.value = rgb.g;
		    iB.value = rgb.b;

				rgb_r = rgb.r.toString();
			      rgb_g = rgb.g.toString();
			      rgb_b = rgb.b.toString();

       			map.removeInteraction(draw);
      			addInteraction();
		
		}
		
		var initialHex = '#2b3777';
		
		function updateColorPickers(hex) {
		    cpFancy.setHex(hex);
		}
		
		updateColorPickers(initialHex);
		
//		ColorPicker(document.getElementById('default')).setHex('#2b3777');



		iHex.onchange = function() { updateColorPickers(iHex.value); };
		
		iR.onchange = function() { updateColorPickers(ColorPicker.rgb2hex({ r: iR.value, g: iG.value, b: iB.value })); }
		iG.onchange = function() { updateColorPickers(ColorPicker.rgb2hex({ r: iR.value, g: iG.value, b: iB.value })); }
		iB.onchange = function() { updateColorPickers(ColorPicker.rgb2hex({ r: iR.value, g: iG.value, b: iB.value })); }

			setTimeout( function(){
				document.getElementById('measuremessage').innerHTML = 'Choose a feature type and colour, then start drawing...';
			}, 3000); // delay 1000 ms






	    jQuery("#removelastfeaturebutton").click(function(){

		var maplayerlength = map.getLayers().getLength();
		var toplayer = parseInt(maplayerlength - 1);
		var lastlayerfeatures = map.getLayers().getArray()[parseInt(toplayer)].getSource().getFeatures();
		var lastlayerfeatureslength = map.getLayers().getArray()[parseInt(toplayer)].getSource().getFeatures().length;
		if (parseInt(lastlayerfeatureslength) == 1)
			{ 
			map.getLayers().removeAt(parseInt(toplayer)); 
			document.getElementById('drawtype').selectedIndex = 0;
			map.removeInteraction(draw);
			map.removeInteraction(snap);
         		document.getElementById('stopmeasuringmessage').innerHTML = '';
			var overlayslength = map.getOverlays().getLength();
			if (overlayslength > 0) {map.getOverlays().clear();}
			}
		else if (parseInt(lastlayerfeatureslength) > 1)
			{

			var lastlayerfeatures = map.getLayers().getArray()[parseInt(toplayer)].getSource().getFeatures();
			var lastFeature = lastlayerfeatures[lastlayerfeatures.length - 1];
			map.getLayers().getArray()[parseInt(toplayer)].getSource().removeFeature(lastFeature);
			}
		else
			{
			return;
			}
	    });


	    jQuery("#exportbutton").click(function(){


	var colorsourceALL = new VectorSource();

	var vectorcolorALL = new VectorLayer({
	  title: "vectorcolorALL",
	  source: colorsourceALL,
	 
	});

	var maplayerlength = map.getLayers().getLength();
	map.getLayers().insertAt(maplayerlength,vectorcolorALL);

		var maplayerlength = map.getLayers().getLength();
		var toplayer = parseInt(maplayerlength - 1);

	        var layers = map.getLayers().getArray().slice();
		    for (var x = 0; x < layers.length; x++) {
		        if (layers[x].get('title') == 'vectorcolor') 
			map.getLayers().getArray()[parseInt(toplayer)].getSource().addFeatures(layers[x].getSource().getFeatures());
		    }



		var lastlayerfeatures = map.getLayers().getArray()[parseInt(toplayer)].getSource().getFeatures();
/*
		lastlayerfeatures.forEach( function(feature) {
			var geometry = feature.getGeometry();
			name = feature.getGeometryName();
			if (name = 'Point')
			{
			var extent = map.getLayers().getArray()[0].getSource().getTileGrid().getExtent();
			var lon = feature.getGeometry().getCoordinates()[0];
			var lat = feature.getGeometry().getCoordinates()[1];
			var lat1 = Math.round(lat);
			var lat2 = (Math.abs(extent[1])) - (Math.abs(lat1));
			var lat3 = -lat;
			feature.getGeometry().setCoordinates([lon, Math.abs(lat2)]);

			}
			else if (name = 'LineString')
			{
				geometry.forEachSegment(function (segment) {

				var extent = map.getLayers().getArray()[0].getSource().getTileGrid().getExtent();
				var lon = segment.getCoordinates()[0];
				var lat = segment.getCoordinates()[1];
				var lat1 = Math.round(lat);
				var lat2 = (Math.abs(extent[1])) - (Math.abs(lat1));
				var lat3 = -lat;
				segment.setCoordinates([lon, Math.abs(lat2)]);

				});

			}
		});
*/


//		var toplayerfeatures = map.getLayers().getArray()[parseInt(toplayer)].getSource().getFeatures();


//		var lastlayerfeatures = [];
//		lastlayerfeatures.push(map.getLayers().getArray()[parseInt(toplayer)].getSource().getFeatures());

		var geojsonFormat = new GeoJSON();
//		var IIIFFormat = new IIIFInfo();
		var file_original = geojsonFormat.writeFeatures(lastlayerfeatures, { decimals: 0 });



		var file1 = file_original.replace(/"properties":null/g,'"properties":[]');
		var file = file1.replace(/-/g,'');

  		var filename = 'data:text/json;charset=utf-8,' + file;


			function download(filename, text) {
			
			  var element = document.createElement('a');
			  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + file);
			  element.setAttribute('download', filename);
			
			  element.style.display = 'none';
			  document.body.appendChild(element);
			
			  element.click();
			
			  document.body.removeChild(element);
			
			}


		var pageurl1 = window.location.href;

		var image_id = pageurl1.replace('https://maps.nls.uk/view/','');



 		download(image_id + ".json",filename);
 //		download(image_id + ".iiif",IIIF_filename);

		var maplayerlength = map.getLayers().getLength();
		var toplayer = parseInt(maplayerlength - 1);
		map.getLayers().removeAt(parseInt(toplayer));

	    });




	        jQuery("#removelastfeaturebutton").hide();
	        jQuery("#exportbutton").hide();

	        jQuery("#hidecolor").click(function(){
	        	jQuery("#colorcontainer").hide();
			document.getElementById('stopmeasuringmessage').innerHTML = '';
			map.removeInteraction(draw);
 			map.removeInteraction(snap);
			var overlayslength = map.getOverlays().getLength();
			if (overlayslength > 0) {map.getOverlays().clear();}
	         });


});







}