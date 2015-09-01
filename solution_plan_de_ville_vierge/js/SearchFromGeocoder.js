define([
    "dojo/Evented",
    "dojo/_base/array",
    "dojo/_base/Color",
    "dojo/_base/declare",
    "dojo/_base/event",
    "dojo/_base/fx",
    "dojo/_base/html",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/dom-style", 
    "dojo/fx",
    "dojo/on",
    "dojo/query",
    "dojo/Deferred",
    "dijit/registry",
    "dijit/form/Button",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/dom-attr",
    "config/searchConfig",
    "esri/dijit/Search"
    
], function (
    Evented,
    array,
    Color,
    declare,
    dojoEvent,
    fx,
    html,
    lang,
    dom,
    domClass,
    domConstruct,
    domGeometry,
    domStyle,
    coreFx,
    on,
    query,
    Deferred,
    registry,
    Button,
    domConstruct,
    dom,
    domAttr,
    searchConfig,
    Search
) { return declare([Evented], {
       
      map : null,
      config : {},
      search: [],
      place: null,

      constructor : function(config, place) {
         if(!config) config = {};
         this.config = config;
         this.map = config.map;
         this.place = place;
      },
    
      // startup
      startup : function() {
         var deferred = this._init();
         deferred.then(lang.hitch(this, function(config) {
            // optional ready event to listen to
            this.emit("ready", config);
         }), lang.hitch(this, function(error) {
            // optional error event to listen to
            this.emit("error", error);
         }));
         return deferred;
      },
    
      clear: function(){
        this.search.clear();
      },
    
      // init
      _init : function() {
          //Don't need deferred now setting it up just in case
          var deferred;
          domConstruct.create("link", {rel: "stylesheet", href:"css/searchStyle.css"}, query("head")[0], "last");
          deferred = new Deferred();
          var config = this._createConfig();
          this.search = new Search(config, this.place);
          this.search.startup();
          
          on(this.search,
             "select-result",
             lang.hitch(this, function(results) {
              this.emit("select", results);
          }));
          on(this.search,
             "clear-search",
             lang.hitch(this, function() {
              this.emit("clear", {});
          }));
          
            var style = domStyle.getComputedStyle(this.search.submitNode);
            var width = parseInt(style.width.substr(0,style.width.length-2));
            var marginLeft = parseInt(style.marginLeft.substr(0,style.marginLeft.length-2));
            var marginRight = parseInt(style.marginRight.substr(0,style.marginRight.length-2));
            var paddingLeft = parseInt(style.paddingLeft.substr(0,style.paddingLeft.length-2));
            var paddingRight = parseInt(style.paddingRight.substr(0,style.paddingRight.length-2));

            style = domStyle.getComputedStyle(dom.byId("panelSearch"));
            var width2 = parseInt(style.width.substr(0,style.width.length-2));
            var widthDelta = width + marginLeft + marginRight + paddingLeft + paddingRight;
            style = domStyle.getComputedStyle(this.search.containerNode);
            var marginLeft2 = parseInt(style.marginLeft.substr(0,style.marginLeft.length-2));
            var marginRight2 = parseInt(style.marginRight.substr(0,style.marginRight.length-2));
            var paddingLeft2 = parseInt(style.paddingLeft.substr(0,style.paddingLeft.length-2));
            var paddingRight2 = parseInt(style.paddingRight.substr(0,style.paddingRight.length-2));

            widthDelta = width + marginLeft + marginRight + paddingLeft + paddingRight;
            domStyle.set(dom.byId("panelSearch"), "width", (width2) + "px");
            domStyle.set(this.search.expandNode, "width", (width2-widthDelta) + "px");

            style = domStyle.getComputedStyle(this.search.inputNode);
            marginLeft2 = parseInt(style.marginLeft.substr(0,style.marginLeft.length-2));
            marginRight2 = parseInt(style.marginRight.substr(0,style.marginRight.length-2));
            paddingLeft2 = parseInt(style.paddingLeft.substr(0,style.paddingLeft.length-2));
            paddingRight2 = parseInt(style.paddingRight.substr(0,style.paddingRight.length-2));

            domStyle.set(this.search.inputNode, "width", (width2-(widthDelta+marginLeft2+marginRight2+paddingLeft2+paddingRight2)) + "px");
            
            
          deferred.resolve();
          return deferred.promise;
      },
    
      defineSources: function(sources){
        this.search.sources = sources;
        this.search.activeSourceIndex = "all";
      },
    
      // Create Geocoder Options
      _createConfig: function () {
          
            var options = this.config;
          
            options.enableLabel = false;
            options.enableInfoWindow = false;
            options.showInfoWindowOnSelect = false;
            options.autoNavigate = false;
            
            return options;
        }    
   });
});