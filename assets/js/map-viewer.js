/**
 * Map Viewer functionality using Leaflet
 */
class MapViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            center: options.center || [0, 0],
            zoom: options.zoom || 2,
            minZoom: options.minZoom || 1,
            maxZoom: options.maxZoom || 19,
            ...options
        };
        this.map = null;
        this.layers = {};
        this.annotations = {};
        this.init();
    }

    init() {
        if (!this.container) {
            console.error(`Container element with ID "${containerId}" not found.`);
            return;
        }

        // Initialize the map
        this.map = L.map(this.container, {
            center: this.options.center,
            zoom: this.options.zoom,
            minZoom: this.options.minZoom,
            maxZoom: this.options.maxZoom
        });

        // Add base tile layer (OpenStreetMap as a fallback)
        this.addLayer('base', L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }));

        // Set up any custom layers based on options
        if (this.options.customLayers) {
            this.options.customLayers.forEach(layer => {
                this.addCustomLayer(layer);
            });
        }

        // Initialize the layer controls in the sidebar
        this.initLayerControls();
    }

    addLayer(id, layer, options = {}) {
        if (this.layers[id]) {
            this.map.removeLayer(this.layers[id].layer);
        }

        this.layers[id] = {
            layer: layer,
            visible: options.visible !== false,
            name: options.name || id,
            type: options.type || 'overlay'
        };

        if (this.layers[id].visible) {
            this.map.addLayer(layer);
        }

        // Update layer controls if they exist
        this.updateLayerControls();
        
        return layer;
    }

    addCustomLayer(layerInfo) {
        if (!layerInfo || !layerInfo.id) return;

        let layer;
        
        // Create different types of layers based on the type
        switch(layerInfo.type) {
            case 'tile':
                layer = L.tileLayer(layerInfo.url, layerInfo.options || {});
                break;
            case 'wms':
                layer = L.tileLayer.wms(layerInfo.url, layerInfo.options || {});
                break;
            case 'geojson':
                if (layerInfo.data) {
                    layer = L.geoJSON(layerInfo.data, layerInfo.options || {});
                } else if (layerInfo.url) {
                    // Fetch GeoJSON data and create layer
                    fetch(layerInfo.url)
                        .then(response => response.json())
                        .then(data => {
                            const geoLayer = L.geoJSON(data, layerInfo.options || {});
                            this.addLayer(layerInfo.id, geoLayer, {
                                name: layerInfo.name,
                                visible: layerInfo.visible
                            });
                        })
                        .catch(error => {
                            console.error(`Error loading GeoJSON from ${layerInfo.url}:`, error);
                        });
                    return;
                }
                break;
            case 'marker':
                layer = L.marker(layerInfo.latlng, layerInfo.options || {});
                if (layerInfo.popup) {
                    layer.bindPopup(layerInfo.popup);
                }
                break;
            default:
                console.warn(`Unknown layer type: ${layerInfo.type}`);
                return;
        }

        if (layer) {
            this.addLayer(layerInfo.id, layer, {
                name: layerInfo.name,
                visible: layerInfo.visible !== false,
                type: layerInfo.layerType || 'overlay'
            });
        }
    }

    toggleLayer(id, visible) {
        if (!this.layers[id]) return;

        const layerInfo = this.layers[id];
        layerInfo.visible = visible === undefined ? !layerInfo.visible : visible;

        if (layerInfo.visible) {
            this.map.addLayer(layerInfo.layer);
        } else {
            this.map.removeLayer(layerInfo.layer);
        }

        // Update the checkbox in the layer controls
        const checkbox = document.querySelector(`#layer-${id}`);
        if (checkbox) {
            checkbox.checked = layerInfo.visible;
        }
    }

    initLayerControls() {
        const layersList = document.getElementById('layers-list');
        if (!layersList) return;

        // Clear existing controls
        layersList.innerHTML = '';
        
        // Create layer controls based on this.layers
        this.updateLayerControls();
    }

    updateLayerControls() {
        const layersList = document.getElementById('layers-list');
        if (!layersList) return;

        // Clear existing controls
        layersList.innerHTML = '';

        // Sort layers: base layers first, then overlays
        const sortedLayers = Object.entries(this.layers).sort((a, b) => {
            if (a[1].type === 'base' && b[1].type !== 'base') return -1;
            if (a[1].type !== 'base' && b[1].type === 'base') return 1;
            return 0;
        });

        // Create layer controls
        sortedLayers.forEach(([id, layerInfo]) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `layer-${id}`;
            checkbox.checked = layerInfo.visible;
            checkbox.addEventListener('change', () => {
                this.toggleLayer(id, checkbox.checked);
            });
            
            const label = document.createElement('label');
            label.htmlFor = `layer-${id}`;
            label.textContent = layerInfo.name;
            
            layerItem.appendChild(checkbox);
            layerItem.appendChild(label);
            layersList.appendChild(layerItem);
        });
    }

    addAnnotation(id, latlng, options = {}) {
        if (this.annotations[id]) {
            this.map.removeLayer(this.annotations[id].marker);
        }

        const marker = L.marker(latlng, options.markerOptions || {});
        
        if (options.popup) {
            marker.bindPopup(options.popup);
        }

        this.annotations[id] = {
            marker: marker,
            visible: options.visible !== false,
            name: options.name || id
        };

        if (this.annotations[id].visible) {
            this.map.addLayer(marker);
        }

        // Update annotation controls
        this.updateAnnotationControls();
        
        return marker;
    }

    updateAnnotationControls() {
        const annotationsList = document.getElementById('annotations-list');
        if (!annotationsList) return;

        // Clear existing controls
        annotationsList.innerHTML = '';

        // Create annotation controls
        Object.entries(this.annotations).forEach(([id, annotationInfo]) => {
            const annotationItem = document.createElement('div');
            annotationItem.className = 'annotation-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `annotation-${id}`;
            checkbox.checked = annotationInfo.visible;
            checkbox.addEventListener('change', () => {
                this.toggleAnnotation(id, checkbox.checked);
            });
            
            const label = document.createElement('label');
            label.htmlFor = `annotation-${id}`;
            label.textContent = annotationInfo.name;
            
            annotationItem.appendChild(checkbox);
            annotationItem.appendChild(label);
            annotationsList.appendChild(annotationItem);
        });
    }

    toggleAnnotation(id, visible) {
        if (!this.annotations[id]) return;

        const annotationInfo = this.annotations[id];
        annotationInfo.visible = visible === undefined ? !annotationInfo.visible : visible;

        if (annotationInfo.visible) {
            this.map.addLayer(annotationInfo.marker);
        } else {
            this.map.removeLayer(annotationInfo.marker);
        }

        // Update the checkbox in the annotation controls
        const checkbox = document.querySelector(`#annotation-${id}`);
        if (checkbox) {
            checkbox.checked = annotationInfo.visible;
        }
    }

    fitBounds(bounds, options) {
        this.map.fitBounds(bounds, options);
    }

    resize() {
        this.map.invalidateSize();
    }
}