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
            try {
                // Attempt to load metadata from the project folder
                const metadata = await fetchProjectMetadata(projectFolder);
                const projectCard = createProjectCard({
                    id: projectFolder,
                    title: metadata.title || projectFolder,
                    description: metadata.description || 'No description available.',
                    date: metadata.date,
                    location: metadata.location,
                    thumbnail: metadata.thumbnail
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
        showSampleProjects(projectsList);
    }
}

// Function to fetch project folders
async function fetchProjectFolders() {
    // This is a simplified approach - GitHub Pages doesn't allow directory listing
    // So we'll check for the presence of known project folders
    const knownProjects = ['sample', 'stettiner-str'];
    
    // Add any subfolders from the projects directory that have been explicitly added
    // This part would normally be generated server-side, but for GitHub Pages we need to hardcode it
    const additionalProjects = [];
    
    // Check for additional projects by testing for index.html files
    try {
        // We'll check for 'project-1', 'project-2', etc. to see if they exist
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
                
                // Generate a basic metadata object
                return {
                    title: title,
                    description: `${title} mapping project`,
                    date: new Date().toISOString().split('T')[0]
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
    
    const thumbnailStyle = project.thumbnail 
        ? `background-image: url(${project.thumbnail});` 
        : 'background-color: #ddd; display: flex; justify-content: center; align-items: center;';
    
    card.innerHTML = `
        <div class="project-image" style="${thumbnailStyle}">
            ${!project.thumbnail ? '<i class="fas fa-drone" style="font-size: 3rem; color: #aaa;"></i>' : ''}
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

// Function to show sample projects when no projects are found
function showSampleProjects(container) {
    container.innerHTML = '';
    
    // Sample projects to demonstrate the UI
    const sampleProjects = [
        {
            id: 'sample',
            title: 'Forest Survey',
            description: 'Aerial mapping of northern forest region showing canopy coverage and terrain.',
            date: '2025-07-15',
            thumbnail: 'https://via.placeholder.com/300x180?text=Forest+Survey',
            location: 'Northern Region'
        },
        {
            id: 'sample',
            title: 'Urban Development Site',
            description: 'Detailed mapping of construction site with progress tracking.',
            date: '2025-08-01',
            thumbnail: 'https://via.placeholder.com/300x180?text=Urban+Development',
            location: 'Downtown Area'
        },
        {
            id: 'sample',
            title: 'Coastal Erosion Study',
            description: 'Monitoring of coastline changes over time with detailed elevation model.',
            date: '2025-07-23',
            thumbnail: 'https://via.placeholder.com/300x180?text=Coastal+Mapping',
            location: 'Eastern Shoreline'
        }
    ];
    
    sampleProjects.forEach(project => {
        const projectCard = createProjectCard(project);
        container.appendChild(projectCard);
    });
    
    // Add note about sample projects
    const note = document.createElement('div');
    note.className = 'sample-note';
    note.style.gridColumn = '1 / -1';
    note.style.marginTop = '1rem';
    note.style.padding = '1rem';
    note.style.backgroundColor = 'var(--card-bg)';
    note.style.borderRadius = '8px';
    note.style.textAlign = 'center';
    note.innerHTML = '<p><i class="fas fa-info-circle"></i> These are sample projects. Add your own projects by creating folders in the "projects" directory.</p>';
    container.appendChild(note);
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