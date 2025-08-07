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
    
    // Initialize 3D model viewer
    initModelViewer(metadata.modelSettings || {});
    
    // Set up UI event listeners
    setupUIControls();
}

// Initialize the 3D model viewer
function initModelViewer(settings = {}) {
    // Make sure we have defaults for the 3D model settings
    const modelSettings = {
        backgroundColor: settings.backgroundColor || 0x222222,
        modelPath: settings.modelPath || null,
        modelType: settings.modelType || 'glb',
        showHelpers: settings.showHelpers !== false,
        ...settings
    };
    
    // Initialize the model viewer
    modelViewer = new ModelViewer('model-view', modelSettings);
    
    // If no model path was provided, show a helpful message
    if (!modelSettings.modelPath) {
        showModelPlaceholder();
    }
}

// Show a placeholder message when no 3D model is available
function showModelPlaceholder() {
    const modelView = document.getElementById('model-view');
    if (!modelView) return;
    
    // Clear any existing content
    modelView.innerHTML = '';
    
    // Create placeholder element
    const placeholder = document.createElement('div');
    placeholder.className = 'model-placeholder';
    placeholder.style.display = 'flex';
    placeholder.style.flexDirection = 'column';
    placeholder.style.justifyContent = 'center';
    placeholder.style.alignItems = 'center';
    placeholder.style.height = '100%';
    placeholder.style.color = '#fff';
    placeholder.style.textAlign = 'center';
    placeholder.style.padding = '2rem';
    
    placeholder.innerHTML = `
        <i class="fas fa-cube" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.6;"></i>
        <h2>No 3D Model Available</h2>
        <p style="max-width: 600px; margin: 1rem auto;">
            This project doesn't have a 3D model configured. 
            To add a 3D model, place a .glb or .obj file in the models directory 
            and update the metadata.json file.
        </p>
        <div style="margin-top: 1rem;">
            <a href="index.html" class="action-button" style="background-color: #3498db; color: white; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 1rem;">
                <i class="fas fa-map"></i> View 2D Map Instead
            </a>
        </div>
    `;
    
    modelView.appendChild(placeholder);
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
            if (modelViewer) modelViewer.resize();
            // Also trigger resize on any iframes
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                const parent = iframe.parentElement;
                iframe.style.height = parent.clientHeight + 'px';
                iframe.style.width = parent.clientWidth + 'px';
            });
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
        if (modelViewer) modelViewer.resize();
        
        // Also resize any iframes
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const parent = iframe.parentElement;
            iframe.style.height = parent.clientHeight + 'px';
            iframe.style.width = parent.clientWidth + 'px';
        });
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
        
        // Trigger resize for any iframes
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const parent = iframe.parentElement;
            iframe.style.height = parent.clientHeight + 'px';
            iframe.style.width = parent.clientWidth + 'px';
        });
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
        if (modelViewer) modelViewer.resize();
        
        // Also resize any iframes
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const parent = iframe.parentElement;
            iframe.style.height = parent.clientHeight + 'px';
            iframe.style.width = parent.clientWidth + 'px';
        });
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