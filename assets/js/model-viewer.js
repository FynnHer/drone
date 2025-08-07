/**
 * 3D Model Viewer functionality using Three.js
 */
class ModelViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            backgroundColor: options.backgroundColor || 0x222222,
            modelPath: options.modelPath || null,
            modelType: options.modelType || 'glb', // 'glb', 'gltf', 'obj'
            cameraPosition: options.cameraPosition || { x: 5, y: 5, z: 5 },
            ...options
        };
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.isInitialized = false;
        
        // Initialize if container exists
        if (this.container) {
            this.init();
        }
    }
    
    init() {
        // Check if Three.js is available
        if (typeof THREE === 'undefined') {
            console.error('Three.js library not loaded. Cannot initialize 3D viewer.');
            this.showError('Three.js library not loaded. Cannot initialize 3D viewer.');
            return;
        }
        
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(this.options.backgroundColor);
            
            // Set up renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.updateSize();
            this.container.appendChild(this.renderer.domElement);
            
            // Set up camera
            const aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
            this.camera.position.set(
                this.options.cameraPosition.x,
                this.options.cameraPosition.y,
                this.options.cameraPosition.z
            );
            
            // Set up controls
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.25;
            } else {
                console.warn('THREE.OrbitControls not available. Using basic camera controls.');
            }
            
            // Add lights
            this.addLights();
            
            // Add helpers
            if (this.options.showHelpers) {
                this.addHelpers();
            }
            
            // Load model if path is provided
            if (this.options.modelPath) {
                // Try to load as a simple model first
                this.loadSimpleModel(this.options.modelPath, this.options.modelType);
            } else {
                // Create a default cube
                this.createDefaultCube();
            }
            
            // Start animation loop
            this.animate();
            
            // Add event listener for window resize
            window.addEventListener('resize', () => this.updateSize());
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing 3D viewer:', error);
            this.showError('Failed to initialize 3D viewer: ' + error.message);
        }
    }
    
    addLights() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1);
        dirLight1.position.set(1, 1, 1);
        this.scene.add(dirLight1);
        
        // Add another directional light from the opposite direction
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight2.position.set(-1, -1, -1);
        this.scene.add(dirLight2);
    }
    
    addHelpers() {
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);
    }
    
    createDefaultCube() {
        // Create a simple cube as a placeholder
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x3498db,
            metalness: 0.2,
            roughness: 0.7
        });
        this.model = new THREE.Mesh(geometry, material);
        this.scene.add(this.model);
        
        // Add animation for the cube
        this.cubeAnimation = true;
    }
    
    loadSimpleModel(path, type = 'glb') {
        // Clear existing model
        if (this.model) {
            this.scene.remove(this.model);
            this.model = null;
        }
        
        // Show loading indicator
        this.showLoading(true);
        
        let loader;
        
        try {
            // Set up a basic OBJ loader without Draco compression
            if (type.toLowerCase() === 'obj' && typeof THREE.OBJLoader !== 'undefined') {
                loader = new THREE.OBJLoader();
            } 
            // Set up a basic GLTF loader without Draco compression
            else if ((type.toLowerCase() === 'gltf' || type.toLowerCase() === 'glb') && 
                     typeof THREE.GLTFLoader !== 'undefined') {
                loader = new THREE.GLTFLoader();
            } else {
                throw new Error(`Loader for ${type} not available`);
            }
            
            // Make sure the path is absolute if it's not a URL
            let modelPath = path;
            if (!modelPath.startsWith('http') && !modelPath.startsWith('/')) {
                // If it's a relative path, make sure it's relative to the current page
                const pageUrl = window.location.href;
                const baseUrl = pageUrl.substring(0, pageUrl.lastIndexOf('/') + 1);
                modelPath = new URL(modelPath, baseUrl).href;
            }
            
            // Load the model
            loader.load(
                modelPath,
                (object) => {
                    // Handle different model formats
                    if (type.toLowerCase() === 'gltf' || type.toLowerCase() === 'glb') {
                        this.model = object.scene;
                    } else {
                        this.model = object;
                    }
                    
                    // Center model
                    this.centerModel();
                    
                    // Add to scene
                    this.scene.add(this.model);
                    
                    // Hide loading indicator
                    this.showLoading(false);
                },
                (xhr) => {
                    // Progress callback
                    if (xhr.lengthComputable) {
                        const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
                        this.updateLoadingProgress(percent);
                    }
                },
                (error) => {
                    // Error callback
                    console.error('Error loading model:', error);
                    this.showLoading(false);
                    this.showError('Error loading 3D model: ' + error.message);
                    
                    // Fall back to a simple cube
                    this.createDefaultCube();
                }
            );
        } catch (error) {
            console.error('Error setting up model loader:', error);
            this.showLoading(false);
            this.showError('Error setting up model loader: ' + error.message);
            
            // Fall back to a simple cube
            this.createDefaultCube();
        }
    }
    
    centerModel() {
        if (!this.model) return;
        
        try {
            // Create a bounding box
            const boundingBox = new THREE.Box3().setFromObject(this.model);
            
            // Get the center of the bounding box
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            
            // Move model so its center is at the origin
            this.model.position.sub(center);
            
            // Get size of the model to adjust camera
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            
            // Position camera based on model size
            const distance = maxDim * 2;
            this.camera.position.set(distance, distance, distance);
            this.camera.lookAt(0, 0, 0);
            
            // Update controls target
            if (this.controls) {
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
        } catch (error) {
            console.warn('Error centering model:', error);
        }
    }
    
    updateSize() {
        if (!this.renderer || !this.camera) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
    
    animate() {
        if (!this.isInitialized) return;
        
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        // Animate cube if it's the default model
        if (this.cubeAnimation && this.model) {
            this.model.rotation.x += 0.01;
            this.model.rotation.y += 0.01;
        }
        
        this.render();
    }
    
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    showLoading(visible) {
        // Create or update loading indicator
        let loadingEl = this.container.querySelector('.model-loading');
        
        if (visible) {
            if (!loadingEl) {
                loadingEl = document.createElement('div');
                loadingEl.className = 'model-loading';
                loadingEl.innerHTML = `
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading 3D Model... <span class="loading-progress">0%</span></div>
                `;
                loadingEl.style.position = 'absolute';
                loadingEl.style.top = '0';
                loadingEl.style.left = '0';
                loadingEl.style.width = '100%';
                loadingEl.style.height = '100%';
                loadingEl.style.display = 'flex';
                loadingEl.style.flexDirection = 'column';
                loadingEl.style.justifyContent = 'center';
                loadingEl.style.alignItems = 'center';
                loadingEl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                loadingEl.style.color = 'white';
                loadingEl.style.zIndex = '1000';
                
                const spinner = loadingEl.querySelector('.loading-spinner');
                spinner.style.width = '50px';
                spinner.style.height = '50px';
                spinner.style.border = '5px solid rgba(255, 255, 255, 0.3)';
                spinner.style.borderTop = '5px solid #fff';
                spinner.style.borderRadius = '50%';
                spinner.style.marginBottom = '10px';
                spinner.style.animation = 'spin 1s linear infinite';
                
                // Add keyframe animation
                if (!document.getElementById('model-viewer-styles')) {
                    const style = document.createElement('style');
                    style.id = 'model-viewer-styles';
                    style.innerHTML = `
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                this.container.appendChild(loadingEl);
            } else {
                loadingEl.style.display = 'flex';
            }
        } else if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
    
    updateLoadingProgress(percent) {
        const progressEl = this.container.querySelector('.model-loading .loading-progress');
        if (progressEl) {
            progressEl.textContent = `${percent}%`;
        }
    }
    
    showError(message) {
        let errorEl = this.container.querySelector('.model-error');
        
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'model-error';
            errorEl.style.position = 'absolute';
            errorEl.style.top = '0';
            errorEl.style.left = '0';
            errorEl.style.width = '100%';
            errorEl.style.height = '100%';
            errorEl.style.display = 'flex';
            errorEl.style.justifyContent = 'center';
            errorEl.style.alignItems = 'center';
            errorEl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            errorEl.style.color = 'white';
            errorEl.style.zIndex = '1000';
            errorEl.style.padding = '20px';
            errorEl.style.textAlign = 'center';
            
            this.container.appendChild(errorEl);
        }
        
        errorEl.innerHTML = `
            <div>
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #f39c12;"></i>
                <p>${message}</p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.8;">
                    The model may use compressed geometry (Draco) or other features not supported by this viewer.
                </p>
                <div style="margin-top: 1rem;">
                    <button id="retry-load-model" style="margin-right: 0.5rem; padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                    <button id="load-simple-model" style="padding: 0.5rem 1rem; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Show Demo Model
                    </button>
                </div>
            </div>
        `;
        
        // Add retry button functionality
        const retryButton = errorEl.querySelector('#retry-load-model');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                errorEl.style.display = 'none';
                if (this.options.modelPath) {
                    this.loadSimpleModel(this.options.modelPath, this.options.modelType);
                }
            });
        }
        
        // Add simple model button functionality
        const simpleModelButton = errorEl.querySelector('#load-simple-model');
        if (simpleModelButton) {
            simpleModelButton.addEventListener('click', () => {
                errorEl.style.display = 'none';
                // Create a simple cube as a placeholder
                this.createDefaultCube();
            });
        }
        
        errorEl.style.display = 'flex';
    }
    
    resize() {
        this.updateSize();
    }
}