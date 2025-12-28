var wms_layers = [];


        var lyr_GoogleHybrid_0 = new ol.layer.Tile({
            'title': 'Google Hybrid',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: '&nbsp;&middot; <a href="https://www.google.at/permissions/geoguidelines/attr-guide.html">Map data ©2015 Google</a>',
                url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            })
        });
var lyr_K328122025orthophoto_1 = new ol.layer.Image({
        opacity: 1,
        
    title: 'K-3-28122025-orthophoto<br />' ,
        
        
        source: new ol.source.ImageStatic({
            url: "./layers/K328122025orthophoto_1.png",
            attributions: ' ',
            projection: 'EPSG:3857',
            alwaysInRange: true,
            imageExtent: [896958.333908, 6306282.091217, 897537.842888, 6306782.776315]
        })
    });

lyr_GoogleHybrid_0.setVisible(true);lyr_K328122025orthophoto_1.setVisible(true);
var layersList = [lyr_GoogleHybrid_0,lyr_K328122025orthophoto_1];
