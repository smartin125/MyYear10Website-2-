const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");
const topicsDropdown = document.querySelector(".nav-dropdown");
const topicsToggle = document.querySelector(".nav-dropdown-toggle");

// Toggle active class when hamburger is clicked
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
});

topicsToggle.addEventListener("click", () => {
  const isOpen = topicsDropdown.classList.toggle("open");
  topicsToggle.setAttribute("aria-expanded", isOpen);
});

// Close the menu when a link is clicked
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
    topicsDropdown.classList.remove("open");
    topicsToggle.setAttribute("aria-expanded", "false");
  });
});
