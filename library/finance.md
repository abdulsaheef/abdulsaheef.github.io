---
layout: library
title: Finance
permalink: /library/finance/
---

## Finance Articles



<div class="library-buttons">

{% for post in site.posts %}

  {% if post.category == "finance" %}

  <a class="library-button" href="{{ post.url }}">

    <span class="library-button-title">

      {{ post.title }}

    </span>

    {% if post.subtitle %}

      <span class="library-button-subtitle">

        {{ post.subtitle }}

      </span>

    {% endif %}

  </a>

  {% endif %}

{% endfor %}

</div>