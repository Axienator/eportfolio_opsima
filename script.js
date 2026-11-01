/* 
  1. THEME (dark by default, saved in localStorage)
*/
var root = document.documentElement;

function getSavedTheme() {
  try { return localStorage.getItem("theme"); } catch (e) { return null; }
}

function saveTheme(theme) {
  try { localStorage.setItem("theme", theme); } catch (e) { /* storage not available */ }
}

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);

  var button = document.getElementById("theme-button");
  if (button) {
    // Show the icon for the mode you can switch TO
    button.textContent = theme === "dark" ? "☀️" : "🌙";
    button.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to night mode");
  }
}

// Use the saved theme, or dark if nothing is saved yet
applyTheme(getSavedTheme() || "dark");


/* 
  2. EVERYTHING ELSE waits until the page has loaded
*/
document.addEventListener("DOMContentLoaded", function () {

  /* ----- Theme button ----- */
  applyTheme(root.getAttribute("data-theme")); // update the icon now that the button exists

  document.getElementById("theme-button").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
    if (reduceMotion) drawStars();  
  });


  /* ----- Mobile menu ----- */
  var menuButton = document.getElementById("menu-button");
  var menu = document.getElementById("nav-menu");

  function setMenu(open) {
    menu.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menuButton.textContent = open ? "✕" : "☰";
  }

  menuButton.addEventListener("click", function () {
    setMenu(!menu.classList.contains("open"));
  });

  // Close the menu after choosing a link
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });


  /* ----- Missing images -----
     If an image can't load (for example profile.jpg isn't added yet),
     hide it so the placeholder text underneath shows instead. */
  document.querySelectorAll("img").forEach(function (img) {
    function hide() { img.hidden = true; }
    img.addEventListener("error", hide);
    if (img.complete && img.naturalWidth === 0) hide(); // already failed
  });


  /* ----- Contact form -----
 */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");

  function showError(fieldName, message) {
    var field = form.elements[fieldName].closest(".field");
    field.classList.toggle("invalid", message !== "");
    field.querySelector(".error").textContent = message;
  }

  function validate() {
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var subject = form.elements.subject.value.trim();
    var message = form.elements.message.value.trim();
    var ok = true;

    showError("name", name === "" ? "Please enter your name." : "");
    showError("email", "");
    showError("subject", subject === "" ? "Please enter a subject." : "");
    showError("message", message.length < 10 ? "Please write at least 10 characters." : "");

    if (name === "" || subject === "" || message.length < 10) ok = false;

    if (email === "") {
      showError("email", "Please enter your email.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("email", "Please enter a valid email address.");
      ok = false;
    }
    return ok;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    status.textContent = "";
    if (!validate()) return;

    // Your email address is read from the Contact section link in index.html
    var myEmail = document.getElementById("email-link").textContent.trim();
    var body = form.elements.message.value.trim() +
               "\n\nFrom: " + form.elements.name.value.trim() +
               " (" + form.elements.email.value.trim() + ")";

    window.location.href = "mailto:" + myEmail +
      "?subject=" + encodeURIComponent(form.elements.subject.value.trim()) +
      "&body=" + encodeURIComponent(body);

    status.textContent = "Your email app should open with the message ready. Press send there to deliver it.";
  });


  /* ----- Star background (constellation) -----
     Dots drift slowly and nearby dots are joined by thin lines. */
  var canvas = document.getElementById("constellation");
  var ctx = canvas.getContext("2d");
  var stars = [];
  var width = 0;
  var height = 0;
  var LINK_DISTANCE = 120;   // how close two dots must be to join
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setupStars() {
    var ratio = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // More dots on bigger screens, but never too many
    var count = Math.min(90, Math.max(30, Math.round((width * height) / 14000)));
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      });
    }
  }

  function drawStars() {
    ctx.clearRect(0, 0, width, height);
    var color = getComputedStyle(root).getPropertyValue("--star").trim();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];

      // Move, and wrap around the edges
      if (!reduceMotion) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;
      }

      // Draw the dot
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Draw lines to nearby dots (fainter when further apart)
      for (var k = i + 1; k < stars.length; k++) {
        var dx = s.x - stars[k].x;
        var dy = s.y - stars[k].y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < LINK_DISTANCE) {
          ctx.globalAlpha = (1 - distance / LINK_DISTANCE) * 0.35;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(stars[k].x, stars[k].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function animateStars() {
    drawStars();
    if (!reduceMotion) requestAnimationFrame(animateStars);
  }

  setupStars();
  animateStars();
  window.addEventListener("resize", function () {
    setupStars();
    if (reduceMotion) drawStars();
  });


  /* ----- Footer year ----- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
