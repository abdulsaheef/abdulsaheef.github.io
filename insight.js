// insight.js

document.addEventListener('DOMContentLoaded', () => {
  fetch('posts.json')
    .then(response => response.json())
    .then(posts => {
      const track = document.getElementById('blogTrack');
      posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'blog-card';
        card.innerHTML = `
          <h3>${post.title}</h3>
          <a href="${post.link}" target="_blank" rel="noopener noreferrer">Open</a>
        `;
        track.appendChild(card);
      });
    })
    .catch(error => console.error('Failed to load blog posts:', error));
});
