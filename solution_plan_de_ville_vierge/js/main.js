/*global define,document */
/*jslint sloppy:true,nomen:true */
/*
 | Copyright 2014 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
    "dojo/ready",
    "dojo/_base/array",
    "dojo/_base/Color",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/on",
    "dojo/query",
    "application/ui",
    "esri/arcgis/utils",
    "application/SearchFromGeocoder",
    "esri/dijit/LocateButton",
    "esri/dijit/Popup",
    "esri/lang",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/urlUtils",
	"esri/dijit/Search",
	"esri/tasks/locator",
    "esri/layers/FeatureLayer",
    "esri/InfoTemplate",
    "application/Menu",
    "dijit/registry",
    "dojo/dom-style",
    "dojo/_base/event",
    "config/menuConfig",
    "config/searchConfig"
], function (
    ready,
    array,
    Color,
    declare,
    lang,
    dom,
    domClass,
    on,
    query,
    UI,
    arcgisUtils,
    Geocoder,
    LocateButton,
    Popup,
    esriLang,
    SimpleMarkerSymbol,
    urlUtils,
    Search,
    Locator,
    FeatureLayer,
    InfoTemplate,
    Menu,
    registry,
    domStyle,
    dojoEvent,
    menuConfig,
    searchConfig
) {
   
   return declare(null, {

      config : {},

      map : null,

      initExt : null,
      
      opLayers : [],

      mapExt : null,
      
      ui : null,
       
      geocoder : null,
	  
	  menuPerso : null,

      // Startup
      startup : function(config) {
         // config will contain application and user defined info for the template such as i18n strings, the web map id
         // and application id
         // any url parameters and any application specific configuration information.
         if (config) {
            this.config = config;
            this._setColor();
            this._setProtocolHandler();
            // proxy rules
            urlUtils.addProxyRule({
               urlPrefix: "route.arcgis.com",
               proxyUrl: this.config.proxyurl
            });
            urlUtils.addProxyRule({
               urlPrefix: "traffic.arcgis.com",
               proxyUrl: this.config.proxyurl
            });
            // document ready
            ready(lang.hitch(this, function() {
               //supply either the webmap id or, if available, the item info
               var itemInfo = this.config.itemInfo || this.config.webmap;
               //If a custom extent is set as a url parameter handle that before creating the map
               if (this.config.extent) {
                  var extArray = decodeURIComponent(this.config.extent).split(",");
                  if (extArray.length === 4) {
                     itemInfo.item.extent = [[parseFloat(extArray[0]), parseFloat(extArray[1])], [parseFloat(extArray[2]), parseFloat(extArray[3])]];
                  }
               }
               this._createWebMap(itemInfo);
            }));
         } else {
            var error = new Error("Main:: Config is not defined");
            this.reportError(error);
         }
      },

      // Report error
      reportError : function(error) {
         // remove loading class from body
         domClass.remove(document.body, "app-loading");
         domClass.add(document.body, "app-error");
         // an error occurred - notify the user. In this example we pull the string from the
         // resource.js file located in the nls folder because we've set the application up
         // for localization. If you don't need to support multiple languages you can hardcode the
         // strings here and comment out the call in index.html to get the localization strings.
         // set message
         var node = dom.byId("loading_message");
         if (node) {
            if (this.config && this.config.i18n) {
               node.innerHTML = this.config.i18n.map.error + ": " + error.message;
            } else {
               node.innerHTML = "Unable to create map: " + error.message;
            }
         }
      },

      // Set Color
      _setColor : function() {
         if (this.config.cycleColors === true) {
            this.config.color = this.config.colors[0];
         }
      },
      
      // set protocol handler
      _setProtocolHandler : function() {
         esri.id.setProtocolErrorHandler(function() {
            console.log("protocol");
            if (window.confirm("Your browser is not CORS enabled. You need to redirect to HTTPS. Continue?")) {
               window.location = window.location.href.replace("http:", "https:");
            }
         });
      },

      // Create web map based on the input web map id
      _createWebMap : function(itemInfo) {
         // popup
         var popupSym = new SimpleMarkerSymbol("circle", 2, null, new Color.fromArray([0, 0, 0, 0.1]));
         var popup = new Popup({
            markerSymbol : popupSym,
            anchor : "top"
         }, dom.byId("panelPopup"));
         
         arcgisUtils.createMap(itemInfo, "mapDiv", {
            mapOptions : {
               editable: false,
               infoWindow: popup
            },
            bingMapsKey : this.config.bingKey
         }).then(lang.hitch(this, function(response) {

            this.map = response.map;
            this.initExt = this.map.extent;
            this.config.opLayers = response.itemInfo.itemData.operationalLayers;
            
            this._createMapUI();
            // make sure map is loaded
            if (this.map.loaded) {
               // do something with the map
               this._mapLoaded();
            } else {
               on.once(this.map, "load", lang.hitch(this, function() {
                  // do something with the map
                  this._mapLoaded();
               }));
            }
                console.log(this.map);
         }), this.reportError);
      },

      // Map Loaded - Map is ready
      _mapLoaded : function() {
         query(".esriSimpleSlider").style("backgroundColor", this.config.color.toString());
         // remove loading class from body
         domClass.remove(document.body, "app-loading");
      },
      
      // Create Geocoder Options
      _createGeocoderOptions: function () {
            var sources = [];
          
            var options = {
                map: this.map
            };
            
            options.sources = sources;
            return options;
       },

      // Create Map UI
      _createMapUI : function() {
          
         // home
         // var home = new HomeButton({
         // map : this.map
         // }, "btnHome");
         // home.startup();

         // geolocate
         var geoLocate = new LocateButton({
            map : this.map,
            autoNavigate : false,
            highlightLocation : false
         }, "btnLocate");
         on(geoLocate, "locate", lang.hitch(this, this._geoLocated));
         geoLocate.startup();
          
         // geocoder
         var geocoderOptions = this._createGeocoderOptions();
         geocoder = new Geocoder(geocoderOptions, "panelGeocoder");
         on(geocoder, "select", lang.hitch(this, this._searchSelect));
         geocoder.startup();
          
         //create ui
         this._createUI();
         
          if(menuConfig.pagesLogos.length>0){
             var menuOptions = this.ui.config;
             menuOptions.map = this.map;
             menuOptions.pages = this.ui.pages;
             this.menuPerso = new Menu(menuOptions);
             this.menuPerso.startup();
			 var node = dojo.byId("menuContainer");
			 var style_ = domStyle.getComputedStyle(node);
			 var value = parseInt(style_.height.replace("px", "")) + parseInt(style_.top.replace("px", ""));
			 this.menuPerso.height = value;
			 this._onResize();
			 on(window, "resize", lang.hitch(this, this._onResize));
             var mainSource = geocoderOptions.geocoders;
             on(this.menuPerso, "itemClick", lang.hitch(this, this._menuItemClicked));
          }
         // update theme
         this._updateTheme();
         
         // set default location
         if (this.config.defaultToCenter)
            this._setDefaultLocation();
         on(this.map, "extent-change", lang.hitch(this, this._mapClickHandler));
         
         
         this._menuItemClicked(this.ui.pages[1]);
      },
      
	  _onResize: function(evt){
		if(this.menuPerso){
			var node = dojo.byId("menuContainer");
			if(evt){
				if(this.menuPerso.height==="Nan" || evt.target.innerHeight <= this.menuPerso.height){
					domStyle.set(node, "display", "none");
				} else {
					domStyle.set(node, "display", "block");
				}
			} else {
				if(this.menuPerso.height==="Nan" || this.map.height <= this.menuPerso.height){
					domStyle.set(node, "display", "none");
				} else {
					domStyle.set(node, "display", "block");
				}
			}
		}
	 },
	  
      _searchSelect: function(result){
          var pageObj  = this.ui.pages[this.ui.curPage];
          var loc = result.result.feature.geometry;
          if(!result.source.locator){
            pageObj.proximityInfo.lastSelected = result.result.feature;
            this.map.centerAndZoom(loc, this.config.defaultZoomLevel || 16);
          }else{
            pageObj.proximityInfo.lastSelected = null;
            pageObj.proximityInfo.clearSelection();
            this.map.centerAndZoom(loc, this.config.defaultZoomLevel || 16);
            this.geocoder.clear();
          }
      },

      _menuItemClicked: function(evt){
          var page;
          var geocoder = registry.byId("panelGeocoder");
          if(evt.target){
             page = registry.byId(evt.target.parentElement.id).page;
             this.ui._showPage(page.id);
          }else{
             page = evt;
          }
         var sources = [];
         var worldGeocoderUrl;
         if (window.location.protocol != "https:")
         	worldGeocoderUrl = "http";
         else
         	worldGeocoderUrl = "https"
	 worldGeocoderUrl += "://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
         var locator = new Locator(worldGeocoderUrl);
         locator.outSpatialReference = this.map.spatialReference;
         sources.push({
            locator: locator,
            singleLineFieldName: "SingleLine",
            name: "Adresse",
            outFields: ["Addr_type"],
            singleLineFieldName: "SingleLine",
            searchExtent: this.map.extent,
            minCharacters: 3,
            enableHighlight: true
         });
         if(searchConfig.layers && page.id && searchConfig.layers.length>(page.id-1)){
             sources.push({
                featureLayer: new FeatureLayer(page.layer.url),
                outFields: ["*"],
                searchFields: [searchConfig.layers[page.id-1].searchField],
                displayField: searchConfig.layers[page.id-1].searchField,
                exactMatch: false,
                enableSuggestions: true,
                name: page.label,
                placeholder: "Thème " + page.label.toLowerCase(),
                maxResults: 4,
                maxSuggestions: 4,
                minCharacters: 3,
                enableHighlight: false
             });
         }
         geocoder.sources = sources;
         geocoder.activeSourceIndex = "all";
      },
       
      // geoLocated
      _geoLocated : function(evt) {
         if (evt.graphic) {
            var geom = evt.graphic.geometry;
            this.map.graphics.add(geom);
         } else {
            if (evt.error)
               console.log(evt.error.message);
         }
      },
      
      // geocoder select
      _geocoderSelect : function(obj) {
         var result = obj.result;
         var geom = result.feature.geometry;
         this.map.graphics.add(geom);
      },
      
      // geocoder clear
      _geocoderClear : function() {
         if(this.ui.location)
            this.ui.setLocation(null);
      },
      
      // map click handler
      _mapClickHandler : function(event) {
         var pt = this.map.extent.getCenter();
        this.ui.setLocation(pt);
         this.map.resize();
      },
      
       // Create UI
      _createUI : function() {
         if (this.config.title !== "")
            document.title = this.config.title;
            dom.byId("panelText").innerHTML = this.config.title;
         if (this.config.logo !== "")
            dom.byId("logo").src = this.config.logo;
         this.ui = new UI(this.config);
         this.ui.map = this.map;
         this.ui.startup();
      },

      // Update Theme
      _updateTheme : function() {
         query(".bg").style("backgroundColor", this.config.color.toString());
         query(".esriPopup .titlePane").style("backgroundColor", this.config.color.toString());
      },

      // set default location
      _setDefaultLocation : function() {
         var pt = this.map.extent.getCenter();
         this.ui.setLocation(pt);
         this.map.resize();
      }
      
   });
});
