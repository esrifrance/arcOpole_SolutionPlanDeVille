define([
    "dojo/Evented",
    "dojo/_base/array",
    "dojo/_base/declare",
    "config/configSymbo",
    "esri/symbols/PictureMarkerSymbol",
    "dojo/_base/lang",
    "dojo/dom-construct"
], function (
    Evented,
    array,
    declare,
    configSymbo,
    PictureMarkerSymbol,
    lang,
    domConstruct
) { return declare([Evented], {
    
    config: null,
    symbolSize: 0,
    folderUrl: "./",
    symbols: [],
    
    constructor: function(config){
        this.config = config;
    },
    
    
    startup: function(){
        this._init();
        if(this.folderUrl){
            if(this.folderUrl.lastIndexOf("/")!=this.folderUrl.length-1 && this.folderUrl.lastIndexOf("\\")!=this.folderUrl.length-1){
                if(this.folderUrl.lastIndexOf("\\")!=-1){
                    this.folderUrl += "\\";
                }else{
                    this.folderUrl += "/";
                }
            }
        }
    },
    
    _init: function(){
        this.folderUrl = (this.config.folderUrl)?this.config.folderUrl:configSymbo.folderUrl;
        this.symbolSize = (this.config.symbolSize)?this.config.symbolSize:configSymbo.symbolSize;
        this.symbols = (this.config.symbols)?this.config.symbols:configSymbo.symbols;
    },
       
    getSymbol: function(feature){
        var symM = null;
        array.forEach(this.symbols, lang.hitch(this, function(elt,index){
            if(feature.attributes[elt.field]){
                array.forEach(elt.values, lang.hitch(this, function(v, i){
                    if(v.value===feature.attributes[elt.field]){
                        symM = new PictureMarkerSymbol(this.folderUrl + v.symbol, this.symbolSize, this.symbolSize);
                    }
                }));
            }
        }));
        return symM;
    },
    
    getImage: function(feature){
        var symM = null;
        array.forEach(this.symbols, lang.hitch(this, function(elt,index){
            if(feature.attributes[elt.field]){
                array.forEach(elt.values, lang.hitch(this, function(v, i){
                    if(v.value===feature.attributes[elt.field]){
                        symM = domConstruct.create("img", {
                            src: this.folderUrl + v.symbol,
                            style: {
                                width: this.symbolSize + "px",
                                height: this.symbolSize + "px",
                                verticalAlign: "middle",
                                textAlign: "center"
                            }
                        });
                    }
                }));
            }
        }));
        return symM;
    }
   });
   
}); 