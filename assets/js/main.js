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
    
    // Use a reliable default thumbnail image instead of trying to generate one
    // This avoids issues with API keys and cross-origin restrictions
    const defaultThumbnail = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMzAwIDE4MCIgZmlsbD0ibm9uZSI+CiAgPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiM3MmI2ZGYiLz4KICA8cGF0aCBkPSJNMCwxMjAgTDUwLDEwMCBMMTAwLDEzMCBMMTUwLDkwIEwyMDAsMTEwIEwyNTAsODAgTDMwMCwxMTAgTDMwMCwxODAgTDAsMTgwIFoiIGZpbGw9IiM1MDk0YzkiLz4KICA8Y2lyY2xlIGN4PSIyNDAiIGN5PSI0MCIgcj0iMjAiIGZpbGw9IiNmZmQ3MDAiLz4KICA8cGF0aCBkPSJNMTUwLDE4MCBMMTM1LDE0MCBMMTM4LDEzNSBMMTQwLDEzNSBMMTQ1LDE0MCBMMTU1LDE0MCBMMTY1LDEzNSBMMTY4LDEzNSBMMTcwLDE0MCBMMTYwLDE4MCBaIiBmaWxsPSIjNDQ0Ii8+CiAgPHBhdGggZD0iTTgwLDE4MCBMNjUsMTUwIEw3MCwxNDUgTDc1LDE0NSBMODAsMTUwIEw4NSwxNTAgTDkwLDE0NSBMOTUsMTQ1IEwxMDAsMTUwIEw5MCwxODAgWiIgZmlsbD0iIzQ0NCIvPgo8L3N2Zz4K';
    
    const thumbnailUrl = project.thumbnail || defaultThumbnail;
    
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