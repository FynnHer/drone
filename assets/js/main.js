document.addEventListener('DOMContentLoaded', function() {
    // Theme toggling functionality
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

    // Load projects directly from filesystem
    loadProjectsDirectly();
});

// Function to load projects by scanning the projects directory
async function loadProjectsDirectly() {
    const projectsList = document.getElementById('projects-list');
    
    try {
        // Fetch all project directories
        const projectFolders = await fetchProjectFolders();
        
        // Clear loading indicator
        projectsList.innerHTML = '';
        
        // Display each project
        for (const projectFolder of projectFolders) {
            // Skip sample project unless it's the only one
            if (projectFolder === 'sample' && projectFolders.length > 1) {
                continue;
            }
            
            try {
                // Attempt to load metadata from the project folder
                const metadata = await fetchProjectMetadata(projectFolder);
                const projectCard = createProjectCard({
                    id: projectFolder,
                    title: metadata.title || projectFolder,
                    description: metadata.description || 'No description available.',
                    date: metadata.date,
                    location: metadata.location,
                    thumbnail: metadata.thumbnail,
                    // Use map center to generate a thumbnail if none exists
                    mapCenter: metadata.mapSettings?.center || null
                });
                projectsList.appendChild(projectCard);
            } catch (error) {
                // If no metadata.json, try to create a basic card from the folder name
                console.warn(`No metadata for project ${projectFolder}:`, error);
                const projectCard = createProjectCard({
                    id: projectFolder,
                    title: projectFolder.charAt(0).toUpperCase() + projectFolder.slice(1).replace(/-/g, ' '),
                    description: 'No description available.',
                });
                projectsList.appendChild(projectCard);
            }
        }
        
        // If no projects found
        if (projectFolders.length === 0) {
            projectsList.innerHTML = '<div class="no-projects">No projects found. Add your first drone mapping project to get started.</div>';
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsList.innerHTML = '<div class="no-projects">Error loading projects. Please check the console for details.</div>';
    }
}

// Function to fetch project folders
async function fetchProjectFolders() {
    // This is a simplified approach - GitHub Pages doesn't allow directory listing
    // So we'll check for the presence of known project folders
    const knownProjects = ['stettiner-str'];
    
    // Add any subfolders from the projects directory that have been explicitly added
    // This part would normally be generated server-side, but for GitHub Pages we need to hardcode it
    const additionalProjects = [];
    
    // Check for additional projects by testing for index.html files
    try {
        // We'll check for common project names
        const possibleProjects = ['project-1', 'project-2', 'coastline-survey', 'urban-mapping', 'forest-survey'];
        for (const projectName of possibleProjects) {
            try {
                const response = await fetch(`projects/${projectName}/index.html`, { method: 'HEAD' });
                if (response.ok) {
                    additionalProjects.push(projectName);
                }
            } catch (e) {
                // Folder doesn't exist, skip
            }
        }
    } catch (e) {
        console.warn('Error checking for additional projects:', e);
    }
    
    // Combine known and discovered projects
    const allProjects = [...knownProjects, ...additionalProjects];
    
    // Add sample project only if no other projects are found
    if (allProjects.length === 0) {
        allProjects.push('sample');
    }
    
    // Deduplicate
    return [...new Set(allProjects)];
}

// Function to fetch project metadata
async function fetchProjectMetadata(projectFolder) {
    try {
        const response = await fetch(`projects/${projectFolder}/metadata.json`);
        if (!response.ok) {
            throw new Error(`Failed to load metadata for ${projectFolder}`);
        }
        return await response.json();
    } catch (error) {
        // If no metadata.json, check if there's an index.html file and extract basic metadata
        try {
            const htmlResponse = await fetch(`projects/${projectFolder}/index.html`);
            if (htmlResponse.ok) {
                const html = await htmlResponse.text();
                // Extract title from HTML
                const titleMatch = html.match(/<title>(.*?)<\/title>/i);
                const title = titleMatch ? titleMatch[1] : projectFolder;
                
                // Try to extract map center from Leaflet initialization
                let center = [0, 0];
                const leafletInitMatch = html.match(/L\.map\(['"]\w+['"]\).*?setView\(\[(.*?)\],\s*(\d+)/s);
                if (leafletInitMatch) {
                    try {
                        center = JSON.parse(`[${leafletInitMatch[1]}]`);
                    } catch (e) {
                        console.warn('Failed to parse Leaflet init parameters:', e);
                    }
                }
                
                // Generate a basic metadata object
                return {
                    title: title,
                    description: `${title} mapping project`,
                    date: new Date().toISOString().split('T')[0],
                    mapSettings: {
                        center: center
                    }
                };
            }
        } catch (e) {
            console.warn(`Could not extract metadata from index.html for ${projectFolder}:`, e);
        }
        
        throw error;
    }
}

// Function to create a project card element
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.setAttribute('data-project-id', project.id);
    
    // Generate thumbnail based on map center if available
    let thumbnailUrl = project.thumbnail;
    
    if (!thumbnailUrl && project.mapCenter && Array.isArray(project.mapCenter) && project.mapCenter.length === 2) {
        // Use OpenStreetMap static map API (no API key required)
        const [lat, lng] = project.mapCenter;
        const zoom = 14;
        thumbnailUrl = `https://maps.geoapify.com/v1/staticmap?style=dark-matter-yellow-roads&center=lonlat:${lng},${lat}&width=300&height=180&apiKey=e6229210dee94e6fbde74a3807abd1ee`;
    }
    
    // Fallback to a map-like image if no thumbnail or coordinates available
    if (!thumbnailUrl) {
        thumbnailUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMzAwIDE4MCIgZmlsbD0ibm9uZSI+CiAgPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNlZWVlZWUiLz4KICA8cGF0aCBkPSJNMCwwIEwzMDAsMCBMMzAwLDE4MCBMMCwxODAgWiIgZmlsbD0iI2YyZjJmMiIvPgogIDxwYXRoIGQ9Ik01MCwyMCBMNTAsMTYwIiBzdHJva2U9IiNjY2NjY2MiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxwYXRoIGQ9Ik0xMDAsMjAgTDEwMCwxNjAiIHN0cm9rZT0iI2NjY2NjYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTE1MCwyMCBMMTUwLDE2MCIgc3Ryb2tlPSIjY2NjY2NjIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cGF0aCBkPSJNMjAwLDIwIEwyMDAsMTYwIiBzdHJva2U9IiNjY2NjY2MiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxwYXRoIGQ9Ik0yNTAsMjAgTDI1MCwxNjAiIHN0cm9rZT0iI2NjY2NjYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTIwLDUwIEwyODAsNTAiIHN0cm9rZT0iI2NjY2NjYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTIwLDgwIEwyODAsODAiIHN0cm9rZT0iI2NjY2NjYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTIwLDExMCBMMjgwLDExMCIgc3Ryb2tlPSIjY2NjY2NjIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cGF0aCBkPSJNMjAsMTQwIEwyODAsMTQwIiBzdHJva2U9IiNjY2NjY2MiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxjaXJjbGUgY3g9IjE1MCIgY3k9IjkwIiByPSIxNSIgZmlsbD0iIzU1YWFmZiIgc3Ryb2tlPSIjMjI4MGNjIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNTU1Ij5NYXAgUHJldmlldyBOb3QgQXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4K';
    }
    
    card.innerHTML = `
        <div class="project-image" style="background-image: url(${thumbnailUrl}); background-size: cover; background-position: center;">
        </div>
        <div class="project-info">
            <h3>${project.title}</h3>
            <p>${project.description || 'No description available.'}</p>
            <div class="project-metadata">
                <span><i class="fas fa-map-marker-alt"></i> ${project.location || 'Unknown location'}</span>
                <span><i class="fas fa-calendar-alt"></i> ${formatDate(project.date) || 'No date'}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', function() {
        // Check if the project has a viewer.html file, otherwise use index.html
        checkFileExists(`projects/${project.id}/viewer.html`)
            .then(exists => {
                if (exists) {
                    window.location.href = `projects/${project.id}/viewer.html`;
                } else {
                    window.location.href = `projects/${project.id}/index.html`;
                }
            })
            .catch(() => {
                // Default to index.html if check fails
                window.location.href = `projects/${project.id}/index.html`;
            });
    });
    
    return card;
}

// Function to check if a file exists
async function checkFileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

// Function to format dates
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