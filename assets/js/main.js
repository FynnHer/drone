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

    // Load projects
    loadProjects();
});

// Function to load projects dynamically
async function loadProjects() {
    const projectsList = document.getElementById('projects-list');
    
    try {
        // Fetch the list of projects (this could be from a JSON file or by scanning directories)
        const response = await fetch('assets/data/projects.json');
        
        // If the file doesn't exist yet, show sample projects
        if (!response.ok) {
            showSampleProjects(projectsList);
            return;
        }
        
        const projects = await response.json();
        
        // Clear loading indicator
        projectsList.innerHTML = '';
        
        // Display each project
        projects.forEach(project => {
            const projectCard = createProjectCard(project);
            projectsList.appendChild(projectCard);
        });
        
        // If no projects found
        if (projects.length === 0) {
            projectsList.innerHTML = '<div class="no-projects">No projects found. Add your first drone mapping project to get started.</div>';
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showSampleProjects(projectsList);
    }
}

// Function to show sample projects when no projects.json exists yet
function showSampleProjects(container) {
    container.innerHTML = '';
    
    // Sample projects to demonstrate the UI
    const sampleProjects = [
        {
            id: 'sample1',
            title: 'Forest Survey',
            description: 'Aerial mapping of northern forest region showing canopy coverage and terrain.',
            date: '2025-07-15',
            thumbnail: 'https://via.placeholder.com/300x180?text=Forest+Survey',
            location: 'Northern Region'
        },
        {
            id: 'sample2',
            title: 'Urban Development Site',
            description: 'Detailed mapping of construction site with progress tracking.',
            date: '2025-08-01',
            thumbnail: 'https://via.placeholder.com/300x180?text=Urban+Development',
            location: 'Downtown Area'
        },
        {
            id: 'sample3',
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
        window.location.href = `projects/${project.id}/`;
    });
    
    return card;
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