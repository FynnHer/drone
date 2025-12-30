'''
 // --- DEIN NEUER TILES LAYER (Orthophoto) ---
        // Hier habe ich den alten ImageOverlay Code entfernt und durch TileLayer ersetzt
        map.createPane('pane_K4729122025orthophoto_1');
        map.getPane('pane_K4729122025orthophoto_1').style.zIndex = 401;

        // WICHTIG: Ersetze 'tiles/{z}/{x}/{y}.png' mit dem echten Pfad zu deinem Qtiles Ordner
        var layer_K4729122025orthophoto_1 = L.tileLayer('./tiles/{z}/{x}/{y}.png', {
            pane: 'pane_K4729122025orthophoto_1',
            opacity: 1.0,
            minZoom: 14,   // Passe dies an die Zoomstufen an, die Qtiles generiert hat (z.B. 15)
            maxZoom: 20,  // Passe dies an die Zoomstufen an, die Qtiles generiert hat (z.B. 20)
            tms: false,   // Setze dies auf "true", falls die Kacheln vertauscht/falsch sind
            transparent: true,
            attribution: 'Orthophoto'
        });
        
        map.addLayer(layer_K4729122025orthophoto_1);
'''
