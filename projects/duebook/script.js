
const form = document.getElementById("paymentForm");
const success = document.getElementById("successMsg");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  success.classList.add("show");
  setTimeout(() => {
    success.classList.remove("show");
    form.reset();
  }, 2500);
});
