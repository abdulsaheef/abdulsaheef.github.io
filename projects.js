// projects.js
const username = "abdulsaheef";
const container = document.getElementById("project-list");

fetch(`https://api.github.com/users/${username}/repos?sort=updated`)
  .then(res => res.json())
  .then(data => {
    data.slice(0, 6).forEach(repo => {
      const project = document.createElement("div");
      project.className = "project";
project.setAttribute("data-aos", "fade-up");

project.innerHTML = `
  <h3>${repo.name}</h3>
  <p>${repo.description || "No description provided."}</p>
  <a href="${repo.html_url}" target="_blank">View on GitHub</a>
`;
      container.appendChild(project);
    });
  })
  .catch(err => {
    container.innerHTML = "<p>Could not load projects.</p>";
    console.error(err);
  });
  
  const projectList = document.getElementById('project-list');
const card = document.createElement('div');
card.className = 'project-card';
card.innerHTML = `
  <h3>Solar System Explorer</h3>
  <p>An immersive 3D space exploration demo built with Three.js.</p>
  <a href="projects/solar-explorer/" target="_blank" class="btn">Launch Explorer</a>
`;
projectList.appendChild(card);