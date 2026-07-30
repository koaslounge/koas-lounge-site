(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value || "";
  }

  function renderNav(categories) {
    var nav = document.getElementById("menu-category-nav");
    if (!nav) return;

    nav.innerHTML = categories.map(function (category) {
      return '<a href="#' + escapeHtml(category.id) + '">' + escapeHtml(category.navLabel || category.title) + '</a>';
    }).join("");
  }

  function renderTraits(traits) {
    if (!Array.isArray(traits) || !traits.length) return "";
    return '<div class="menu-item__traits">' + traits.map(function (trait) {
      return "<span>" + escapeHtml(trait) + "</span>";
    }).join("") + "</div>";
  }

  function renderItem(item) {
    var featured = item.featured ? '<span class="menu-item__featured">Featured</span>' : "";
    return [
      '<article class="menu-item">',
        '<div>',
          '<h4 class="menu-item__name">', escapeHtml(item.name), featured, '</h4>',
          item.description ? '<p class="menu-item__description">' + escapeHtml(item.description) + '</p>' : "",
          renderTraits(item.traits),
        '</div>',
        '<div class="menu-item__price">', escapeHtml(item.price), '</div>',
      '</article>'
    ].join("");
  }

  function renderCategories(categories) {
    var target = document.getElementById("menu-sections");
    if (!target) return;

    target.innerHTML = categories.map(function (category, index) {
      return [
        '<section class="menu-category" id="', escapeHtml(category.id), '">',
          '<header class="menu-category__header">',
            '<div class="menu-category__number">', String(index + 1).padStart(2, "0"), '</div>',
            '<div>',
              '<h3>', escapeHtml(category.title), '</h3>',
              category.subtitle ? '<p>' + escapeHtml(category.subtitle) + '</p>' : "",
            '</div>',
            category.badge ? '<span class="menu-category__badge">' + escapeHtml(category.badge) + '</span>' : "",
          '</header>',
          '<div class="menu-items">', (category.items || []).map(renderItem).join(""), '</div>',
        '</section>'
      ].join("");
    }).join("");
  }

  function render() {
    var data = window.MENU_DATA;
    if (!data) return;

    if (data.hero) {
      setText("menu-hero-eyebrow", data.hero.eyebrow);
      setText("menu-hero-title", data.hero.title);
      setText("menu-hero-lead", data.hero.lead);
    }

    if (data.featured) {
      setText("feature-eyebrow", data.featured.eyebrow);
      setText("feature-name", data.featured.name);
      setText("feature-description", data.featured.description);
      setText("feature-price", data.featured.price);
      setText("feature-note", data.featured.note);
    }

    var categories = Array.isArray(data.categories) ? data.categories : [];
    renderNav(categories);
    renderCategories(categories);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
