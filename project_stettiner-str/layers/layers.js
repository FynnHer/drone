var wms_layers = [];


        var lyr_GoogleHybrid_0 = new ol.layer.Tile({
            'title': 'Google Hybrid',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: ' &nbsp &middot; <a href="https://www.google.at/permissions/geoguidelines/attr-guide.html">Map data ©2015 Google</a>',
                url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            })
        });
var lyr_odm_orthophoto_1 = new ol.layer.Image({
        opacity: 1,
        
    title: 'odm_orthophoto<br />' ,
        
        
        source: new ol.source.ImageStatic({
            url: "./layers/odm_orthophoto_1.png",
            attributions: ' ',
            projection: 'EPSG:3857',
            alwaysInRange: true,
            imageExtent: [906439.859877, 6309138.172549, 906816.624379, 6309364.036291]
        })
    });

lyr_GoogleHybrid_0.setVisible(true);lyr_odm_orthophoto_1.setVisible(true);
var layersList = [lyr_GoogleHybrid_0,lyr_odm_orthophoto_1];
