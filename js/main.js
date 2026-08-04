const THEME_KEY = "wv-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const toggleBtn = document.getElementById("theme-toggle");
const icon = document.getElementById("theme-icon");

let currentTheme = getInitialTheme();
applyTheme(currentTheme);
updateIcon(currentTheme);

toggleBtn.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
  updateIcon(currentTheme);
});

function updateIcon(theme) {
  icon.textContent = theme === "dark" ? "☀️" : "🌙";
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (localStorage.getItem(THEME_KEY)) return;
    currentTheme = e.matches ? "dark" : "light";
    applyTheme(currentTheme);
    updateIcon(currentTheme);
  });
