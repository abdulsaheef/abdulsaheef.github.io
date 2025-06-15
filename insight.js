document.addEventListener('DOMContentLoaded', () => {
  fetch('posts.json')
    .then(res => res.json())
    .then(posts => {
      const wrapper = document.getElementById('insightCards');
      posts.forEach(post => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
          <div class="insight-card">
            <h3>${post.title}</h3>
            <a href="${post.link}" target="_blank">Open</a>
          </div>
        `;
        wrapper.appendChild(slide);
      });

      new Swiper('.mySwiper', {
        slidesPerView: 1.2,
        spaceBetween: 20,
        loop: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },
        breakpoints: {
          768: {
            slidesPerView: 2.5
          },
          1024: {
            slidesPerView: 3.5
          }
        }
      });
    });
});