---
layout: library
title: Finance
permalink: /library/finance/
---

## Finance Articles



<div class="library-grid">

{% for post in site.posts %}

  {% if post.category == "finance" %}

  <a class="library-card" href="{{ post.url }}">

    <h2>{{ post.title }}</h2>

    {% if post.subtitle %}

      <p>{{ post.subtitle }}</p>

    {% endif %}

    <span class="library-meta">

      {{ post.date | date: "%B %d, %Y" }}

    </span>

  </a>

  {% endif %}

{% endfor %}

</div>

