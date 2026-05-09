---
layout: library
title: Finance
permalink: /library/finance/
---

## Finance Articles



{% for post in site.posts %}

  {% if post.category == "finance" %}

    <li>

      <a href="{{ post.url }}">{{ post.title }}</a>

    </li>

  {% endif %}

{% endfor %}

