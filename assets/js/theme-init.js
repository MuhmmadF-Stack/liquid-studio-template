/* Runs before first paint: applies the saved theme, or the visitor's system theme. */
(function () {
  var t = null;
  try { t = localStorage.getItem('theme'); } catch (e) { /* storage blocked */ }
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', t);
  // Suppress colour transitions until the page has painted once (removed in main.js)
  document.documentElement.classList.add('no-anim');
})();
