(function () {
  "use strict";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getImagePath(imageKey) {
    var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.images) || {};
    return imageKey && cfg[imageKey] ? cfg[imageKey] : "";
  }

  function metaMarkup(items) {
    return (items || []).map(function (item) {
      return '<span>' + esc(item) + '</span>';
    }).join("");
  }

  function artMarkup(item) {
    var imagePath = getImagePath(item.imageKey);
    return '' +
      '<div class="koa-promo-card__art" aria-hidden="true">' +
        (imagePath ? '<img class="koa-promo-card__image" src="' + esc(imagePath) + '" alt="">' : '') +
        '<span class="koa-promo-card__orb koa-promo-card__orb--one"></span>' +
        '<span class="koa-promo-card__orb koa-promo-card__orb--two"></span>' +
        '<span class="koa-promo-card__symbol"></span>' +
      '</div>';
  }

  function cardMarkup(item, compact) {
    return '' +
      '<article class="koa-promo-card koa-promo-card--' + esc(item.theme) + (compact ? ' is-compact' : '') + '">' +
        artMarkup(item) +
        '<div class="koa-promo-card__body">' +
          '<div class="koa-promo-card__topline">' +
            '<span class="koa-promo-card__eyebrow">' + esc(item.eyebrow) + '</span>' +
            '<span class="koa-promo-card__status is-' + esc(item.statusTone) + '">' + esc(item.status) + '</span>' +
          '</div>' +
          '<h3>' + esc(item.title) + '</h3>' +
          '<p>' + esc(item.description) + '</p>' +
          '<div class="koa-promo-card__meta">' + metaMarkup(item.meta) + '</div>' +
          '<a class="koa-promo-card__link" href="' + esc(item.href) + '">' + esc(item.ctaLabel) + '<span aria-hidden="true">→</span></a>' +
        '</div>' +
      '</article>';
  }

  function fullMarkup(data) {
    var active = (data.items || []).filter(function (item) { return item.active !== false; });
    var heading = data.heading || {};
    var hashtag = data.hashtag || {};

    return '' +
      '<section class="koa-promotions" aria-labelledby="koa-promotions-title">' +
        '<div class="koa-promotions__glow koa-promotions__glow--aqua" aria-hidden="true"></div>' +
        '<div class="koa-promotions__glow koa-promotions__glow--purple" aria-hidden="true"></div>' +
        '<div class="container koa-promotions__container">' +
          '<header class="koa-promotions__header">' +
            '<div><span class="koa-promotions__eyebrow">' + esc(heading.eyebrow) + '</span><h2 id="koa-promotions-title">' + esc(heading.title) + '</h2></div>' +
            '<p>' + esc(heading.copy) + '</p>' +
          '</header>' +
          '<div class="koa-promotions__grid">' + active.map(function (item) { return cardMarkup(item, false); }).join("") + '</div>' +
          '<aside class="koa-promotions__hashtag">' +
            '<div><span class="koa-promotions__eyebrow">' + esc(hashtag.eyebrow) + '</span><h3>' + esc(hashtag.title) + '</h3><p>' + esc(hashtag.copy) + '</p></div>' +
            '<strong>' + esc(hashtag.tag) + '</strong>' +
          '</aside>' +
        '</div>' +
      '</section>';
  }

  function compactMarkup(data) {
    var active = (data.items || []).filter(function (item) { return item.active !== false; });
    return '' +
      '<section class="koa-promotions koa-promotions--compact" aria-labelledby="koa-coming-title">' +
        '<div class="container koa-promotions__container">' +
          '<header class="koa-promotions__compact-header">' +
            '<div><span class="koa-promotions__eyebrow">Coming soon + now booking</span><h2 id="koa-coming-title">Keep an eye on what is next.</h2></div>' +
            '<a href="/after-dark.html">#MeetMeAtKoas <span aria-hidden="true">→</span></a>' +
          '</header>' +
          '<div class="koa-promotions__grid">' + active.map(function (item) { return cardMarkup(item, true); }).join("") + '</div>' +
        '</div>' +
      '</section>';
  }

  function mount() {
    var data = window.KOA_PROMOTIONS;
    if (!data) return;

    document.querySelectorAll("[data-koa-promotions]").forEach(function (node) {
      var mode = node.getAttribute("data-koa-promotions") || "home";
      node.innerHTML = mode === "compact" ? compactMarkup(data) : fullMarkup(data);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
