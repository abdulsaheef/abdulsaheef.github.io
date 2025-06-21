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
  
  // 2. Add Custom Featured Projects
const customProjects = [
  {
    title: "Solar System Explorer",
    description: "An immersive 3D space exploration demo built with Three.js.",
    link: "/projects/solar-explorer/index.html",
  
  },
  {
    title: "Digital Compass APP",
    description: "Analog-style web compass using device orientation",
    image: "projects/digital-compass/assets/thumb-compass.JPG",
    link: "projects/digital-compass/index.html"
  }
];

customProjects.forEach(project => {
  const card = document.createElement("div");
  card.className = "project-card";
  card.setAttribute("data-aos", "fade-up");

  card.innerHTML = `
    <img src="${project.image}" alt="${project.title}" class="project-thumb">
    <h3>${project.title}</h3>
    <p>${project.description}</p>
    <a href="${project.link}" target="_blank" class="btn">Launch</a>
  `;
  container.appendChild(card);
});