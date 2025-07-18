// projects.js
const username = "abdulsaheef";
const container = document.getElementById("project-list");

// 1. Fetch GitHub Repos
fetch(`https://api.github.com/users/${username}/repos?sort=updated`)
  .then(res => res.json())
  .then(data => {
    // 1.a Exclude the personal homepage repo
    data
      .filter(repo => repo.name !== "abdulsaheef.github.io")
      .slice(0, 6)
      .forEach(repo => {
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
    read: "/posts/solar-explorer.html"
  },
  {
    title: "Digital Compass APP",
    description: "Analog-style web compass using device orientation",
    link: "projects/digital-compass/index.html",
    read: "/posts/digital-compass.html"
  },
  {
    title: "Meet on Time",
    description: "A smart time zone meeting scheduler that helps find overlapping working hours across cities worldwide",
    link: "projects/meet-on-time/index.html",
    read: "/posts/meet-on-time.html"
  },
  {
    title: "DueBook",
    description: "A smart vendor payment scheduler and cash flow calendar. Allows you to input vendor details, auto-calculate due dates, AI-based overload alerts",
    link: "projects/duebook/index.html",
    read: "/posts/duebook.html"
  }
];

customProjects.forEach(project => {
  const card = document.createElement("div");
  card.className = "project-card";
  card.setAttribute("data-aos", "fade-up");

  card.innerHTML = `
    <h3>${project.title}</h3>
    <p>${project.description}</p>
    <div class="button-group">
      <a href="${project.link}" target="_blank" class="btn">Launch</a>
      <a href="${project.read}" target="_blank" class="btn read-btn">Read</a>
    </div>
  `;
  container.appendChild(card);
});

