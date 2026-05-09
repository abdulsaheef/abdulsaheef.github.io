---
layout: library
title: Finance
permalink: /library/finance/
---

## Finance Articles

<ul>

{% for post in site.posts %}

  {% if post.category == "finance" %}

    <li>

      <a href="{{ post.url }}">{{ post.title }}</a>

    </li>

  {% endif %}

{% endfor %}

</ul