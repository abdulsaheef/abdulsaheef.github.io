---
layout: default
title: Library
permalink: /library/
---

# Library

<input type="text" id="searchBox" placeholder="Search articles..." />

<div id="results"></div>

<script>
  const posts = [
    {% for post in site.posts %}
    {
      title: "{{ post.title }}",
      url: "{{ post.url }}",
      category: "{{ post.category }}"
    },
    {% endfor %}
  ];

  const searchBox = document.getElementById("searchBox");
  const results = document.getElementById("results");

  function render(list) {
    results.innerHTML = list.map(p =>
      `<p>
        <a href="${p.url}">${p.title}</a>
        <small>(${p.category})</small>
      </p>`
    ).join("");
  }

  render(posts);

  searchBox.addEventListener("input", function () {
    const q = this.value.toLowerCase();

    const filtered = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );

    render(filtered);
  });
</script>
