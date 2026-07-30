(function () {
  var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.images) || {};

  function applyBg(el) {
    var key = el.getAttribute("data-bg-key");
    if (key && cfg[key]) {
      el.style.backgroundImage = "url('" + cfg[key] + "')";
    }
  }

  function applySrc(el) {
    var key = el.getAttribute("data-img-key");
    if (key && cfg[key]) {
      el.setAttribute("src", cfg[key]);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-bg-key]").forEach(applyBg);
    document.querySelectorAll("[data-img-key]").forEach(applySrc);
  });
})();
