---
layout: technology
title: Technology
---

## Technology Articles

{% for post in site.posts %}
  {% if post.category == "technology" %}
    <p><a href="{{ post.url }}">{{ post.title }}</a></p>
  {% endif %}
{% endfor %}
