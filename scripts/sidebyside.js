
var map, mapleft, mapright, markers, marker, icon;

var mapleftLayers;
var maprightLayers;

var mousepositionleft;
var mousepositionright;


var DEFAULT_LAT = 10.6269;
var DEFAULT_LON = 79.2654;
var DEFAULT_ZOOM = 10;




// necessary for use of Bing layers - generate your own at: https://msdn.microsoft.com/en-us/library/ff428642.aspx


   var BingapiKey = "AgS4SIQqnI-GRV-wKAQLwnRJVcCXvDKiOzf9I1QpUQfFcnuV82wf1Aw6uw5GJPRz";

// a generic attribution variable for Survey of India maps

	var CoimbatoreATTRIBUTION = new ol.Attribution({
	  html: 'With thanks to the <a href="https://esrc.ukri.org/">Econimic and Social Research Council</a> for supporting this project.' 
	});

// a generic attribution variable for OpenStreetMap

	var OpenStreetMapATTRIBUTION = new ol.Attribution({
	  html: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap contributors</a>.' 
	});

// historic georeferenced map overlays - view full list of NLS layers at: https://maps.nls.uk/geo/explore/scripts/explore-layers.js
// these below have been prepared using MapTiler https://www.maptiler.com/
	
 var india_half_first_1 = new ol.layer.Tile({
        		preload: Infinity,
  	extent: ol.proj.transformExtent([75.94512064, 7.87645754, 78.05269931, 12.07322187], 'EPSG:4326', 'EPSG:3857'),
	title: "India - Survey of India, Half-inch, 1st ed.",
	source: new ol.source.XYZ({
    				attributions: [CoimbatoreATTRIBUTION],
				url: "https://mapseries-tilesets.s3.amazonaws.com/india/half1/{z}/{x}/{y}.png",
				minZoom: 1,
				maxZoom: 14
		  })

    });

  var india_half_first_2 = new ol.layer.Tile({
        		preload: Infinity,
  	extent: ol.proj.transformExtent([77.94267030, 7.87017432, 80.05744065, 12.08698551], 'EPSG:4326', 'EPSG:3857'),
	title: "India - Survey of India, Half-inch, 1st ed.",
	source: new ol.source.XYZ({
    				attributions: [CoimbatoreATTRIBUTION],
				url: "https://mapseries-tilesets.s3.amazonaws.com/india/half1_new/{z}/{x}/{y}.png",
				minZoom: 1,
				maxZoom: 14
		  })

    });


    var india_half_first_ed = new ol.layer.Group({
  	extent: ol.proj.transformExtent([75.94512064, 7.87645754, 80.05744065, 12.08698551], 'EPSG:4326', 'EPSG:3857'),
        preload: Infinity,
	title: "India - Survey of India, Half-inch, 1st ed.",
		layers: [ india_half_first_1, india_half_first_2 ],
        numZoomLevels: 14,
        mosaic_id: '208',
        group_no: '208',
        typename: 'nls:Survey_of_India_half-inch_first_WFS',
        key: 'geo.nls.uk/maps/nokey.html',
	type: 'overlay', 
        visible: false,
        minx: 75.94512064, 
        miny: 7.87645754, 
        maxx: 80.05744065, 
        maxy: 12.08698551,
	maxZoom: 14,
        attribution: ''
    });

  var india_half_second_ed1 = new ol.layer.Tile({
        		preload: Infinity,
  	extent: ol.proj.transformExtent([75.94512064, 9.35622662, 78.05643612, 12.13271790], 'EPSG:4326', 'EPSG:3857'),
	title: "India - Survey of India, Half-inch, 2nd ed.",
	source: new ol.source.XYZ({
    				attributions: [CoimbatoreATTRIBUTION],
				url: "https://mapseries-tilesets.s3.amazonaws.com/india/half2/{z}/{x}/{y}.png",
				minZoom: 1,
				maxZoom: 14
		  }),

    });

  var india_half_second_ed2 = new ol.layer.Tile({
        		preload: Infinity,
  	extent: ol.proj.transformExtent([77.95855267, 9.86643756, 80.04453078, 11.09780077], 'EPSG:4326', 'EPSG:3857'),
	title: "India - Survey of India, Half-inch, 2nd ed.",
	source: new ol.source.XYZ({
    				attributions: [CoimbatoreATTRIBUTION],
				url: "https://mapseries-tilesets.s3.amazonaws.com/india/half2_new/{z}/{x}/{y}.png",
				minZoom: 1,
				maxZoom: 14
		  }),
    });

    var india_half_second_ed = new ol.layer.Group({
  	extent: ol.proj.transformExtent([75.94512064, 9.35622662, 80.04453078, 12.13271790], 'EPSG:4326', 'EPSG:3857'),
	title: "India - Survey of India, Half-inch, 2nd ed.",
		layers: [ india_half_second_ed1, india_half_second_ed2 ],
        numZoomLevels: 14,
        mosaic_id: '209',
        group_no: '209',
        typename: 'nls:	Survey_of_India_half-inch_second_WFS',
        key: 'geo.nls.uk/maps/nokey.html',
	type: 'overlay', 
        visible: false,
        minx: 75.94512064, 
        miny: 9.35622662, 
        maxx: 80.04453078, 
        maxy: 12.13271790,
	maxZoom: 14,
        attribution: ''
    });


  var india_one_first_ed1 = new ol.layer.Tile({
        		preload: Infinity,
  	extent: ol.proj.transformExtent([75.97665541, 7.90812637, 78.02431597, 11.80874083], 'EPSG:4326', 'EPSG:3857'),
	title: "India - Survey of India, One-inch, 1st ed.",
	source: new ol.source.XYZ({
				url: "https://mapseries-tilesets.s3.amazonaws.com/india/one1/{z}/{x}/{y}.png",
				minZoom: 1,
				maxZoom: 16
		  }),

    });

  var india_one_first_ed2 = new ol.layer.Tile({
        		preload: Infinity,
  	extent: ol.proj.transformExtent([77.96707092, 8.18571645, 80.21514466, 11.54281327], 'EPSG:4326', 'EPSG:3857'),
	title: "India - Survey of India, One-inch, 1st ed.",
	source: new ol.source.XYZ({
 				url: "https://mapseries-tilesets.s3.amazonaws.com/india/one1_new/{z}/{x}/{y}.png",
				minZoom: 1,
				maxZoom: 16
		  }),

    });


    var india_one_first_ed = new ol.layer.Group({
  	extent: ol.proj.transformExtent([75.97665541, 7.90812637, 80.21514466, 11.80874083], 'EPSG:4326', 'EPSG:3857'),
        preload: Infinity,
	title: "India - Survey of India, One-inch, 1st ed.",	
		layers: [ india_one_first_ed1, india_one_first_ed2 ],
        numZoomLevels: 16,
        mosaic_id: '210',
        group_no: '210',
        typename: 'nls:Survey_of_India_one-inch-first_WFS',
        key: 'geo.nls.uk/maps/nokey.html',
	type: 'overlay', 
        visible: false,
        minx: 75.97665541, 
        miny: 7.90812637, 
        maxx: 80.21514466, 
        maxy: 11.80874083,
	maxZoom: 16,
        attribution: ''
    });

  var india_one_second_ed1 = new ol.layer.Tile({
        		preload: Infinity,
  	extent: ol.proj.transformExtent([75.97207734, 9.66145295, 77.77711352, 12.06803389], 'EPSG:4326', 'EPSG:3857'),
	title: "India - Survey of India, One-inch, 2nd-5th eds.",
	source: new ol.source.XYZ({
    				attributions: [CoimbatoreATTRIBUTION],
				url: "https://mapseries-tilesets.s3.amazonaws.com/india/one2/{z}/{x}/{y}.png",
				minZoom: 1,
				maxZoom: 16
		  }),

    });

  var india_one_second_ed2 = new ol.layer.Tile({
        		preload: Infinity,
  	extent: ol.proj.transformExtent([77.85122726, 8.71494046, 80.02509698, 11.06324375], 'EPSG:4326', 'EPSG:3857'),
	title: "India - Survey of India, One-inch, 2nd-5th eds.",
	source: new ol.source.XYZ({
    				attributions: [CoimbatoreATTRIBUTION],
				url: "https://mapseries-tilesets.s3.amazonaws.com/india/one2_new/{z}/{x}/{y}.png",
				minZoom: 1,
				maxZoom: 16
		  }),

    });


    var india_one_second_ed = new ol.layer.Group({
   	extent: ol.proj.transformExtent([75.97207734, 9.66145295, 80.02509698, 12.06803389], 'EPSG:4326', 'EPSG:3857'),
	title: "India - Survey of India, One-inch, 2nd-5th eds",
		layers: [ india_one_second_ed1, india_one_second_ed2 ],
        numZoomLevels: 16,
        mosaic_id: '211',
        group_no: '211',
        typename: 'nls:	Survey_of_India_one-inch-second_WFS',
        key: 'geo.nls.uk/maps/nokey.html',
	type: 'overlay', 
        visible: false,
        minx: 75.97207734, 
        miny: 9.66145295, 
        maxx: 80.02509698, 
        maxy: 12.06803389,
	maxZoom: 16,
        attribution: ''
    });


	var osm = new ol.layer.Tile({
	  	title: 'Background Map - OpenStreetMap',
        	visible: false,
	  	source: new ol.source.OSM()
	});


// the styles for the vector layers - ie. tanks, canals, railways, and boundary

            var blue_line_thick = new ol.style.Style({
    		stroke: new ol.style.Stroke({
      			color: 'rgba(41, 15, 195, 0.9)',
      			width: 2
    		})
  	    });

            var light_blue_line_thick = new ol.style.Style({
    		stroke: new ol.style.Stroke({
      			color: '#5897a6',
      			width: 2
    		})
  	    });

            var black_line_dashed = new ol.style.Style({
    		stroke: new ol.style.Stroke({
      			color: 'rgba(40,40,40, 0.9)', 
			lineDash: [2,4],
      			width: 3
    		})
  	    });

            var green_line = new ol.style.Style({
    		stroke: new ol.style.Stroke({
      			color: 'rgb(0,100,0)', 

      			width: 1.5
    		})
  	    });

		var lightStroke = new ol.style.Style({
		  stroke: new ol.style.Stroke({
		    color: [255, 255, 255, 0.6],
		    width: 3,
		    lineDash: [2,4],
		    lineDashOffset: 6
		  })
		});
		
		var darkStroke = new ol.style.Style({
		  stroke: new ol.style.Stroke({
		    color: [0, 0, 0, 0.6],
		    width: 3,
		    lineDash: [2,4]
		  })
		});

		var railways = new ol.layer.Vector({
		  title: "Railways",
		  source: new ol.source.Vector({
		    attributions: [OpenStreetMapATTRIBUTION ],
		    url: 'https://geo.nls.uk/maps/irrigation-tanks/scripts/railways.js',
    		    format: new ol.format.GeoJSON(),
		  }),
	        style: [lightStroke, darkStroke],
	      });


// the layer definition for Thanjavur administrative boundary

		var thanjavur = new ol.layer.Vector({
		  title: "Thanjavur administrative boundary",
		  source: new ol.source.Vector({
		    attributions: [OpenStreetMapATTRIBUTION ],
		    url: 'https://geo.nls.uk/maps/irrigation-tanks/scripts/thanjavur.js',
    		    format: new ol.format.GeoJSON(),
		  }),
	        style: green_line,
	      });





// the layer definition for the Canals - downloaded from OpenStreetMap

		var canals = new ol.layer.Vector({
		  title: "Canals",
		  source: new ol.source.Vector({
			attributions: [OpenStreetMapATTRIBUTION ],
		    url: 'https://geo.nls.uk/maps/irrigation-tanks/scripts/canals.js',
    		    format: new ol.format.GeoJSON(),
		  }),
	        style: light_blue_line_thick,
	      });


// the layer definition for the water tanks - traced by C.Evans

		var tanjoretanks = new ol.layer.Vector({
		  title: "Tanjore Water Tanks traced from Survey of India maps",
		  source: new ol.source.Vector({
		    url: 'https://geo.nls.uk/maps/irrigation-tanks/scripts/tanjoretanks-updated.js',
    		    format: new ol.format.GeoJSON(),
		  }),
	        style: blue_line_thick,
	      });




// ESRI World Layers

	var esri_world_topo = new ol.layer.Tile({
		title: 'Background Map - ESRI World Topo',
        	visible: false,
		    source: new ol.source.XYZ({
			          attributions: [
			            new ol.Attribution({ html: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer">ArcGIS</a>'})
			          ],
			              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
			                  'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
	      	})
	    });

	var esri_world_imagery = new ol.layer.Tile({
		title: 'Background Map - ESRI World Imagery',
		    source: new ol.source.XYZ({
			          attributions: [
			            new ol.Attribution({ html: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer">ArcGIS</a>'})
			          ],
			              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
			                  'World_Imagery/MapServer/tile/{z}/{y}/{x}'
	      	})
	    });

// Bing layers
	
	var BingSatellite =   new ol.layer.Tile({
		title: 'Background Map - Bing Satellite',
        	visible: false,
	        source: new ol.source.BingMaps({
			key: BingapiKey,
			imagerySet: 'Aerial'
		    })
	});

	var BingRoad = new ol.layer.Tile({
	        title: 'Background Map - Bing Road',
        	visible: false,
	        source: new ol.source.BingMaps({
		      key: BingapiKey,
		      imagerySet: 'Road'
		    })
	});

	var BingAerialWithLabels = new ol.layer.Tile({
	        title: 'Background Map - Bing Hybrid',
        	visible: false,
	        source: new ol.source.BingMaps({
			key: BingapiKey,
			imagerySet: 'AerialWithLabels'
		})
	});

	mapleftLayers = [india_half_first_2, india_one_second_ed2, india_one_first_ed2, india_one_second_ed2];

	india_half_first_2.setVisible(true);

// sets up the left-hand map layers as a drop-down list

	var layerSelectLeft = document.getElementById('SelectLeft');
	   for (var x = 0; x < mapleftLayers.length; x++) {
	       var option = document.createElement('option');
	       option.appendChild(document.createTextNode(mapleftLayers[x].get('title')));
	       option.setAttribute('value', x);
	       option.setAttribute('id', 'baseOption' + mapleftLayers[x].get('title'));
	       layerSelectLeft.appendChild(option);
	   }

// Change left-hand map layer

	var changemapleft = function(index) {
	  mapleft.getLayers().getArray()[0].setVisible(false);
	  mapleft.getLayers().removeAt(0);
	  mapleft.getLayers().insertAt(0,mapleftLayers[index]);
	  mapleft.getLayers().getArray()[0].setVisible(true);
	}


// an array of the world layers listed above

	var maprightLayers = [ BingAerialWithLabels, BingRoad,  esri_world_imagery, esri_world_topo, osm ];

	BingAerialWithLabels.setVisible(true);

// sets up the right-hand map layers as a drop-down list

	var layerSelectRight = document.getElementById('SelectRight');
	   for (var x = 0; x < maprightLayers.length; x++) {
	       var option = document.createElement('option');
	       option.appendChild(document.createTextNode(maprightLayers[x].get('title')));
	       option.setAttribute('value', x);
	       option.setAttribute('id', 'baseOption' + maprightLayers[x].get('title'));
	       layerSelectRight.appendChild(option);
	   }

// Change right-hand map layer

	var changemapright = function(index) {
	  mapright.getLayers().getArray()[0].setVisible(false);
	  mapright.getLayers().removeAt(0);
	  mapright.getLayers().insertAt(0,maprightLayers[index]);
	  mapright.getLayers().getArray()[0].setVisible(true);
	}



// splits up the string after the # in the URL

	function splitWindowLocationHash()
	{
		args = [];
		var hash = window.location.hash;
		if (hash.length > 0)
		{
			var elements = hash.split('&');
			elements[0] = elements[0].substring(1); /* Remove the # */
	
			for(var i = 0; i < elements.length; i++)
			{
				var pair = elements[i].split('=');
				args[pair[0]] = pair[1];
			}
		}
	}

// updates the URL with the map zoom, lat and lon

	function updateUrl()
		{
			var centre = ol.proj.transform(mapleft.getView().getCenter(), "EPSG:3857", "EPSG:4326");
	
			
			window.location.hash = "zoom=" + mapleft.getView().getZoom()  + "&lat=" + centre[1].toFixed(4)  + "&lon=" + centre[0].toFixed(4); 
			
	
	}

// links to Survey of India maps in the NLS Explore Georeferenced Maps viewer

	function viewsurveyofindia()  {
	
			var centre = ol.proj.transform(mapleft.getView().getCenter(), "EPSG:3857", "EPSG:4326");
	
			window.location =   "https://maps.nls.uk/geo/explore/#zoom=" +  mapleft.getView().getZoom() + "&lat=" + centre[1].toFixed(4)  + "&lon=" + centre[0].toFixed(4) + "&layers=208&b=1";
	
	
	}


// splits the zoom, lat and lon elements in the URL after the hash #

	splitWindowLocationHash();

		var currentZoom = DEFAULT_ZOOM;
		var currentLat = DEFAULT_LAT;
		var currentLon = DEFAULT_LON;
		if (args['zoom'])
		{
			currentZoom = args['zoom'];
		}
		if (args['lat'] && args['lon'])
		{
			currentLat = parseFloat(args['lat']); 
			currentLon = parseFloat(args['lon']);		
		}


		



// maximum extent for the maps

	var maxExtent = [8700000.0, 1130000.0, 8870000.0, 1240000.0];


// the main ol left-hand map class, with the layers defaulting to a specific view

	var mapleft = new ol.Map({
		  target: 'mapleft',
		  renderer: 'canvas',
		  controls: ol.control.defaults().extend([ new ol.control.ScaleLine({ units:'metric' }) ]),
		  layers: [india_half_first_2, thanjavur, railways, canals, tanjoretanks],
		  logo: false,
		  view: new ol.View({
		    center: ol.proj.transform([79.2654, 10.6269], 'EPSG:4326', 'EPSG:3857'),
		    center: ol.proj.transform([currentLon, currentLat], 'EPSG:4326', 'EPSG:3857'),
		    zoom: currentZoom,
		    minZoom: 10,
 		    extent: maxExtent
		  })
	});


         mapleft.on('moveend', updateUrl);


// set up mouse position as decimal and degrees, minutes, seconds lat lon - the position of this on the page is in ol.css

    var mouseposition =  new ol.control.MousePosition({
            projection: 'EPSG:4326',
            coordinateFormat: function(coordinate) {
		    var hdms = ol.coordinate.toStringHDMS(coordinate);
			return '<strong>&nbsp' + ol.coordinate.format(coordinate, '{x}, {y}', 5) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; 

		}
      });

    mapleft.addControl(mouseposition);


// Sets up an opacity slider on the tanks layer

   jQuery( document ).ready(function() {
	jQuery('#mapslider').slider({
	  formater: function(value) {
	    opacity = value / 100;
	    mapleft.getLayers().getArray()[4].setOpacity(opacity);
	    // overlay.layer.setOpacity(opacity);
	    return 'Opacity: ' + value + '%';
	  }
	});
    });


// the main ol right-hand map class, with Bing Hybrid layer and defaulting to the mapleft view

	var maxExtent = [8700000.0, 1130000.0, 8870000.0, 1240000.0];

	var mapright = new ol.Map({
		  target: 'mapright',
		  renderer: 'canvas',
		  controls: ol.control.defaults().extend([ new ol.control.ScaleLine({ units:'metric' }) ]),
		  layers: [BingAerialWithLabels],
		  logo: false,
		  view: mapleft.getView(),
		    minZoom: 10,
 		    extent: maxExtent
	});


// this is the statement for the small overview map - can be removed by removing it from the map controls line below

		var overviewMapControl = new ol.control.OverviewMap({
		  // see in overviewmap-custom.html to see the custom CSS used
		  className: 'ol-overviewmap ol-custom-overviewmap',
		  layers: [BingAerialWithLabels ],
		  collapseLabel: '\u00AB',
		  label: '\u00AB',
		  collapsed: false
		});

	mapright.addControl(overviewMapControl);

	  
// set up mouse position in the right-hand map as decimal and degrees, minutes, seconds lat lon - the position of this on the page is in ol.css


    var mousepositionright =  new ol.control.MousePosition({
            projection: 'EPSG:4326',
            coordinateFormat: function(coordinate) {
		    var hdms = ol.coordinate.toStringHDMS(coordinate);
			return '<strong>&nbsp' + ol.coordinate.format(coordinate, '{x}, {y}', 5) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; 

		}
      });


    mapright.addControl(mousepositionright);




// sets up a cross as a feature, places it in a vector layer, and adds the vector layer to the left-hand map

	var iconFeature = new ol.Feature();
		
		var iconStyle = new ol.style.Style({
		  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		    anchor: [10, 10],
		    anchorXUnits: 'pixels',
		    anchorYUnits: 'pixels',
		    src: 'https://maps.nls.uk/geo/img/cross.png'
		  }))
		});
		
	
		iconFeature.setStyle(iconStyle);
	
		var vectorSource = new ol.source.Vector({
		  features: [iconFeature]
		});
		
		var vectorLayerMouseCross = new ol.layer.Vector({
		  source: vectorSource,
		  title: 'vectorMouseCross'
		});
	
	
		var mapleftlayerlength = mapleft.getLayers().getLength();
	    	mapleft.getLayers().insertAt(mapleftlayerlength,vectorLayerMouseCross);


// sets up a cross as a feature, places it in a vector layer, and adds the vector layer to the right-hand map

		var RiconFeature = new ol.Feature();
		
		var iconStyle = new ol.style.Style({
		  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		    anchor: [10, 10],
		    anchorXUnits: 'pixels',
		    anchorYUnits: 'pixels',
		    src: 'https://maps.nls.uk/geo/img/cross.png'
		  }))
		});
		
	
		RiconFeature.setStyle(iconStyle);
	
		var RvectorSource = new ol.source.Vector({
		  features: [RiconFeature]
		});
		
		var RvectorLayerMouseCross = new ol.layer.Vector({
		  source: RvectorSource,
		  title: 'RvectorMouseCross'
		});
	
		mapleft.addOverlay(vectorLayerMouseCross);
	
		var maprightlayerlength = mapright.getLayers().getLength();
	    	mapright.getLayers().insertAt(maprightlayerlength,RvectorLayerMouseCross);

// event handler to display cross position based on pointer location

 	mapright.on('pointermove', function(event) {

		RiconFeature.setGeometry(null);
                var coord3857 = event.coordinate;
		iconFeature.setGeometry( new ol.geom.Point(coord3857) );

	});

 	mapleft.on('pointermove', function(event) {
		iconFeature.setGeometry(null);
                var Rcoord3857 = event.coordinate;
		RiconFeature.setGeometry( new ol.geom.Point(Rcoord3857) );

	});

// removes the cross when mouse enters the header div

	jQuery("#header").on("mouseenter", function(event) {
		iconFeature.setGeometry(null);
		RiconFeature.setGeometry(null);
	});   


// jQuery functions for the On/Off sliders in the Map Key panel

     $(document).ready(function() {

		$(".onoffswitch-checkbox" ).prop( "checked", true );
		
			$('input[name="onoffswitch"]').on('change',  function (event) {
		
			   if ($('input[name="onoffswitch"]').prop('checked')==false)
				{ 
				mapleft.getLayers().getArray()[4].setVisible(false);
				 }
			   else if ($('input[name="onoffswitch"]').prop('checked')==true)
				{ 
				mapleft.getLayers().getArray()[4].setVisible(true);
				}
		      });
		
		
		
		$(".onoffswitch-checkbox-canals" ).prop( "checked", true );
		
		
			$('input[name="onoffswitch-canals"]').on('change',  function (event) { 
		
			   if ($('input[name="onoffswitch-canals"]').prop('checked')==false)
				{ 
				mapleft.getLayers().getArray()[3].setVisible(false);
				 }
			   else if ($('input[name="onoffswitch-canals"]').prop('checked')==true)
				{ 
				mapleft.getLayers().getArray()[3].setVisible(true);
				}
		      });


		$(".onoffswitch-checkbox-railways" ).prop( "checked", true );
		
		
			$('input[name="onoffswitch-railways"]').on('change',  function (event) { 
		
		
			   if ($('input[name="onoffswitch-railways"]').prop('checked')==false)
				{ 
				mapleft.getLayers().getArray()[2].setVisible(false);
				 }
			   else if ($('input[name="onoffswitch-railways"]').prop('checked')==true)
				{ 
				mapleft.getLayers().getArray()[2].setVisible(true);
				}
		      });


		$(".onoffswitch-checkbox-boundaries" ).prop( "checked", true );
		
		
			$('input[name="onoffswitch-boundaries"]').on('change',  function (event) { 
		
		
			   if ($('input[name="onoffswitch-boundaries"]').prop('checked')==false)
				{ 
				mapleft.getLayers().getArray()[1].setVisible(false);
				 }
			   else if ($('input[name="onoffswitch-boundaries"]').prop('checked')==true)
				{ 
				mapleft.getLayers().getArray()[1].setVisible(true);
				}
		      });



	});
