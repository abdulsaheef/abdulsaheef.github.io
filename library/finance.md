---
layout: library
title: Finance
permalink: /library/finance/
---

## Finance Articles



<div class="library-list">

{% for post in site.posts %}

  {% if post.category == "finance" %}

  <a class="library-list-item" href="{{ post.url }}">

    {{ post.title }}

  </a>

  {% endif %}

{% endfor %}

</div>