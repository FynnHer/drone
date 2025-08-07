/**
 * Main viewer controller
 */
let mapViewer;
let modelViewer;
let currentProject;

// Initialize the project viewer with metadata
function initializeProject(metadata) {
    currentProject = metadata;
    
    // Set project title and metadata
    document.getElementById('project-title').textContent = metadata.title || 'Project Viewer';
    document.getElementById('project-date').textContent = formatDate(metadata.date) || 'Unknown';
    document.getElementById('project-location').textContent = metadata.location || 'Unknown';
    document.getElementById('project-description').textContent = metadata.description || 'No description available';
    
    // Set page title
    document.title = `${metadata.title || 'Project'} - Drone Mapping Viewer`;
    
    // Initialize map viewer
    initMapViewer(metadata.mapSettings || {});
    
    // Initialize 3D model viewer
    initModelViewer(metadata.modelSettings || {});
    
    // Set up UI event listeners
    setupUIControls();
}

// Initialize the map viewer
function initMapViewer(settings = {}) {
    mapViewer = new MapViewer('map-view', settings);
    
    // Add custom layers from settings
    if (settings.layers) {
        settings.layers.forEach(layer => {
            mapViewer.addCustomLayer(layer);
        });
    }
    
    // Add annotations from settings
    if (settings.annotations) {
        settings.annotations.forEach(annotation => {
            mapViewer.addAnnotation(
                annotation.id,
                annotation.latlng,
                {
                    name: annotation.name,
                    popup: annotation.popup,
                    visible: annotation.visible !== false,
                    markerOptions: annotation.options
                }
            );
        });
    }
}

// Initialize the 3D model viewer
function initModelViewer(settings = {}) {
    modelViewer = new ModelViewer('model-view', settings);
}

// Set up UI controls and event listeners
function setupUIControls() {
    // View toggle buttons
    const mapViewBtn = document.getElementById('map-view-btn');
    const modelViewBtn = document.getElementById('model-view-btn');
    
    mapViewBtn.addEventListener('click', () => {
        setActiveView('map');
    });
    
    modelViewBtn.addEventListener('click', () => {
        setActiveView('model');
    });
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        
        // Update the toggle icon
        const icon = sidebarToggle.querySelector('i');
        if (sidebar.classList.contains('collapsed')) {
            icon.className = 'fas fa-chevron-right';
        } else {
            icon.className = 'fas fa-chevron-left';
        }
        
        // Resize viewers after sidebar toggle
        setTimeout(() => {
            if (mapViewer) mapViewer.resize();
            if (modelViewer) modelViewer.resize();
        }, 300); // Match transition duration
    });
    
    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const viewerContainer = document.querySelector('.viewer-container');
    
    fullscreenBtn.addEventListener('click', () => {
        toggleFullscreen(viewerContainer);
    });
    
    // Theme toggle
    const themeSwitch = document.getElementById('theme-switch');
    
    // Check for saved theme preference or use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
    }
    
    themeSwitch.addEventListener('change', function() {
        if (this.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (mapViewer) mapViewer.resize();
        if (modelViewer) modelViewer.resize();
    });
    
    // Set default view
    setActiveView('map');
}

// Set the active view (map or model)
function setActiveView(viewType) {
    const mapView = document.getElementById('map-view');
    const modelView = document.getElementById('model-view');
    const mapViewBtn = document.getElementById('map-view-btn');
    const modelViewBtn = document.getElementById('model-view-btn');
    
    if (viewType === 'map') {
        mapView.classList.add('active');
        modelView.classList.remove('active');
        mapViewBtn.classList.add('active');
        modelViewBtn.classList.remove('active');
        
        // Ensure map is properly sized
        if (mapViewer) mapViewer.resize();
    } else {
        mapView.classList.remove('active');
        modelView.classList.add('active');
        mapViewBtn.classList.remove('active');
        modelViewBtn.classList.add('active');
        
        // Ensure model viewer is properly sized
        if (modelViewer) modelViewer.resize();
    }
}

// Toggle fullscreen mode
function toggleFullscreen(element) {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const icon = fullscreenBtn.querySelector('i');
    
    if (!document.fullscreenElement) {
        // Enter fullscreen
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
        icon.className = 'fas fa-compress';
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        icon.className = 'fas fa-expand';
    }
    
    // Resize viewers after fullscreen toggle
    setTimeout(() => {
        if (mapViewer) mapViewer.resize();
        if (modelViewer) modelViewer.resize();
    }, 100);
}

// Format dates
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}