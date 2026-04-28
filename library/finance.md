---
layout: default
title: Finance
permalink: /library/finance/
---

## Finance Articles

{% for post in site.posts %}
  {% if post.category == "finance" %}
    <p><a href="{{ post.url }}">{{ post.title }}</a></p>
  {% endif %}
{% endfor %}