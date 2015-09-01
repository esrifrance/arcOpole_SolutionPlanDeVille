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
    "config/menuConfig",
    "dojo/mouse"
    
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
    menuConfig,
    mouse
) { return declare([Evented], {
   
      map : null,
      config : {},
      elts: [],
      pages: [],
      action: null,

      constructor : function(config) {
         this.map = config.map;
         this.pages = config.pages;
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
    
      // init
      _init : function() {
          //Don't need deferred now setting it up just in case
          var deferred;
          deferred = new Deferred();
          
          var style = {
              position: "absolute",
              display: "inline-block",
              top: menuConfig.top + "px",
              left: menuConfig.left + "px",
              margin: "0px",
              padding: "5px",
              borderTopLeftRadius: "5px",
              borderBottomLeftRadius: "5px"
          };
          
          if(menuConfig.isVertical){
              style.width = menuConfig.logoSize + "px";
          }
          
          var divMenu = domConstruct.create("div",{
              style: style,
              class: "menuContainer", 
              id:"menuContainer"
          }, dom.byId("mapDiv_root"), "last");
          
          if(menuConfig.isVertical){
              on(divMenu, "mouseover", this.extendedMove);
              on(divMenu, "mouseout", this.retractMove);
          }
          
          var current_width = domStyle.get(divMenu, "width") + "px";
          
          var extender = domConstruct.create("div", {
              style: {
                position: "absolute",
                backgroundColor: "rgba(0,0,0,0.5)",
                height: "100%",
                marginLeft: "10px",
                top: "0px",
                left: current_width,
                overflow: "hidden",
                borderTopRightRadius: "5px",
                borderBottomRightRadius: "5px"
              },
              class: "menuExtender",
              id: "menuExtender"
          }, divMenu, "last");
          
          var textZone = domConstruct.create("div", {
              style: {
                color: "white",
                fontWeight: "bold",
                position: "absolute",
                height: "100%",
                padding: "5px"
              },
              class: "menuTextZone",
              id: "menuTextZone"
          }, extender, "last");
          
          domConstruct.create("link", {rel: "stylesheet", href:"css/menuStyle.css"}, query("head")[0], "last");
          array.forEach(this.pages, lang.hitch(this, function(page){
              if(page.id>0){
                  var backgroundImage = 'url("./images/goto.png")';
                  var backgroundColor = page.color;
                  var backgroundSize = Math.round(menuConfig.logoSize/2) + "px " + Math.round(menuConfig.logoSize/2) + "px";
                  var backgroundPosition = "center";
                  var border = "1px solid black";
                  var borderRadius = "5px";
                  if(menuConfig.pagesLogos[page.id-1]){
                      backgroundImage = 'url("./images/symbols/' + menuConfig.pagesLogos[page.id-1] + '")';
                      backgroundColor = "transparent";
                      backgroundSize = menuConfig.logoSize + "px " + menuConfig.logoSize + "px";
                      backgroundPosition = "top left";
                      border = "none";
                      borderRadius = "0px";
                  }
                  var button = new Button({
                      id: "menu_quicklink_" + page.id,
                      style: {
                          backgroundImage: backgroundImage,
                          backgroundSize: backgroundSize,
                          backgroundColor: backgroundColor,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: backgroundPosition,
                          border : border,
                          borderTopLeftRadius: borderRadius,
                          borderTopRightRadius: borderRadius,
                          borderBottomLeftRadius: borderRadius,
                          borderBottomRightRadius: borderRadius,
                          width: menuConfig.logoSize + "px",
                          height: menuConfig.logoSize + "px",
                          margin: "auto",
                          padding: "0px"
                      },
                      class: "pageRacc",
                      page: page,
                      label: page.label,
                      showLabel: false,
                      onClick: lang.hitch(this, this._itemClick)
                  });
                  this.elts.push(button);
              }
          }));
          
          array.forEach(this.elts, lang.hitch(this, function(elt){
              domConstruct.create(elt.domNode, {id: elt.id}, divMenu, "last");
              domConstruct.create("div", {
                  style:{
                    verticalAlign: "middle",
                    lineHeight: menuConfig.logoSize + "px",
                    height: menuConfig.logoSize + "px"
                  },
                  innerHTML: elt.label
              }, textZone, "last");
              elt.startup();
          }));
          this.retractMove();
          deferred.resolve();
          return deferred.promise;
      },
       
    
      _itemClick: function(evt){
          this.emit("itemClick", evt);
      },
    
      extendedMove: function(){
          try{
              var styletmp = domStyle.get(dom.byId("menuExtender"));
              var widthtmp = parseInt(styletmp.width.replace("px", ""));
              var anim = fx.animateProperty({
                  node: dom.byId("menuExtender"),
                  properties: {
                      width: {start: widthtmp, end: 150}
                  },
                  duration: 400,
                  delay: 50
              });
              on(anim, "End", lang.hitch(this, function(){
                  domStyle.set(dom.byId("menuContainer"), "borderTopRightRadius", "0");
                  domStyle.set(dom.byId("menuContainer"), "borderBottomRightRadius", "0");
              }));
              domStyle.set(dom.byId("menuContainer"), "borderTopRightRadius", "0");
              domStyle.set(dom.byId("menuContainer"), "borderBottomRightRadius", "0");
              anim.play();
          }catch(e){
              console.error("Can't actually extend the menu!");
          }
      },
    
    retractMove: function(){
          try{
              var styletmp = domStyle.get(dom.byId("menuExtender"));
              var widthtmp = parseInt(styletmp.width.replace("px", ""));
              var anim = fx.animateProperty({
                  node: dom.byId("menuExtender"),
                  properties: {
                      width: {start: widthtmp, end: 0}
                  },
                  duration: 400,
                  delay: 50
              });
              on(anim, "End", lang.hitch(this, function(){
                  domStyle.set(dom.byId("menuContainer"), "borderTopRightRadius", "5px");
                  domStyle.set(dom.byId("menuContainer"), "borderBottomRightRadius", "5px");
              }));
              anim.play();
          }catch(e){
              console.error("Can't actually collapse the menu!");
          }
      }
    
   });
}); 