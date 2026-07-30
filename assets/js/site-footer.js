(function () {
  "use strict";

  var fallbackBusiness = {
    timezone: "Pacific/Honolulu",
    hours: [
      { days: [0, 1], label: "Sunday–Monday", open: null, close: null, display: "Closed" },
      { days: [2, 3, 4], label: "Tuesday–Thursday", open: "17:00", close: "22:00", display: "5 PM – 10 PM" },
      { days: [5, 6], label: "Friday–Saturday", open: "17:00", close: "24:00", display: "5 PM – 12 AM" }
    ]
  };

  var icons = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4.5c-.8-.1-2-.3-3.4-.3-3.3 0-5.6 2-5.6 5.8V13H4.5v4H8v7h4.3v-7h3.5l.6-4h-4.1v-2.6C12.3 9.2 12.8 8 14 8Z"></path></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 3c.4 2.5 1.8 4 4.5 4.3v3.3c-1.7 0-3.2-.5-4.5-1.4v6.2a5.9 5.9 0 1 1-5.1-5.8v3.4a2.5 2.5 0 1 0 1.7 2.4V3h3.4Z"></path></svg>',
    yelp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10.8 3.2 2.5-.8.7 7.7-2.1.7-4.2-6.4 3.1-1.2Zm-6 7.1 1.3-2.4 5.4 3.1-1 2-5.7-.7Zm1.1 7.5-1.3-2.4 6-1.3.8 2.1-5.5 1.6Zm7.2 3.8-2.5-.8 2.1-5.6 2.2.4-1.8 6Zm6-5.1-1.4 2.3-4.2-4.3 1.5-1.7 4.1 3.7Z"></path></svg>'
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getConfig() {
    var footer = window.KOA_FOOTER_CONFIG || {};
    var business = window.BUSINESS_CONFIG || fallbackBusiness;
    return { footer: footer, business: business };
  }

  function navigationMarkup(items) {
    return (items || []).map(function (item) {
      return '<li><a href="' + escapeHtml(item.href) + '"><span>' + escapeHtml(item.label) + '</span><span aria-hidden="true">↗</span></a></li>';
    }).join("");
  }

  function hoursMarkup(hours) {
    return (hours || []).map(function (rule) {
      return '<li><span>' + escapeHtml(rule.label) + '</span><strong>' + escapeHtml(rule.display) + '</strong></li>';
    }).join("");
  }

  function socialMarkup(items) {
    return (items || []).map(function (item) {
      var icon = icons[item.icon] || "";
      return '<a class="koa-footer__social" href="' + escapeHtml(item.href) + '" target="_blank" rel="noopener noreferrer" aria-label="' + escapeHtml(item.label) + '">' + icon + '<span>' + escapeHtml(item.label) + '</span></a>';
    }).join("");
  }

  function footerMarkup(config, business) {
    var brand = config.brand || {};
    var callout = config.callout || {};
    var contact = config.contact || {};
    var primary = callout.primary || {};
    var secondary = callout.secondary || {};
    var address = (contact.addressLines || []).map(escapeHtml).join("<br>");

    return '' +
      '<footer class="koa-footer" data-koa-footer>' +
        '<div class="koa-footer__glow koa-footer__glow--aqua" aria-hidden="true"></div>' +
        '<div class="koa-footer__glow koa-footer__glow--purple" aria-hidden="true"></div>' +
        '<div class="koa-footer__topline" aria-hidden="true"></div>' +
        '<div class="koa-footer__container">' +
          '<section class="koa-footer__cta" aria-labelledby="koa-footer-title">' +
            '<div class="koa-footer__cta-copy">' +
              '<span class="koa-footer__eyebrow">' + escapeHtml(callout.eyebrow) + '</span>' +
              '<h2 id="koa-footer-title">' + escapeHtml(callout.title) + '</h2>' +
              '<p>' + escapeHtml(callout.copy) + '</p>' +
            '</div>' +
            '<div class="koa-footer__cta-actions">' +
              '<a class="koa-footer__button koa-footer__button--primary" href="' + escapeHtml(primary.href) + '">' + escapeHtml(primary.label) + '<span aria-hidden="true">→</span></a>' +
              '<a class="koa-footer__button koa-footer__button--secondary" href="' + escapeHtml(secondary.href) + '">' + escapeHtml(secondary.label) + '</a>' +
            '</div>' +
          '</section>' +

          '<div class="koa-footer__grid">' +
            '<section class="koa-footer__brand" aria-label="About Koa\'s Lounge">' +
              '<a class="koa-footer__brand-lockup" href="/index.html">' +
                '<img src="' + escapeHtml(brand.logo || "/assets/images/logo.png") + '" alt="Koa\'s Lounge logo" width="150" height="150">' +
                '<span><strong>' + escapeHtml(brand.name) + '</strong><small>' + escapeHtml(brand.tagline) + '</small></span>' +
              '</a>' +
              '<p>' + escapeHtml(brand.description) + '</p>' +
              '<div class="koa-footer__status" data-koa-open-status aria-live="polite">' +
                '<span class="koa-footer__status-dot" aria-hidden="true"></span>' +
                '<span><strong data-koa-status-label>Checking hours…</strong><small data-koa-status-detail>Pacific/Honolulu</small></span>' +
              '</div>' +
              '<div class="koa-footer__socials">' + socialMarkup(config.social) + '</div>' +
            '</section>' +

            '<section class="koa-footer__panel koa-footer__hours" aria-labelledby="koa-hours-title">' +
              '<span class="koa-footer__eyebrow">Hours</span>' +
              '<h3 id="koa-hours-title">Plan your visit</h3>' +
              '<ul>' + hoursMarkup(business.hours) + '</ul>' +
              '<p>All times shown in Hawaiʻi Standard Time.</p>' +
            '</section>' +

            '<nav class="koa-footer__panel koa-footer__nav" aria-labelledby="koa-explore-title">' +
              '<span class="koa-footer__eyebrow">Explore</span>' +
              '<h3 id="koa-explore-title">Discover Koa\'s</h3>' +
              '<ul>' + navigationMarkup(config.navigation) + '</ul>' +
            '</nav>' +

            '<section class="koa-footer__panel koa-footer__visit" aria-labelledby="koa-visit-title">' +
              '<span class="koa-footer__eyebrow">Visit</span>' +
              '<h3 id="koa-visit-title">Find us in Pāhoa</h3>' +
              '<address>' + address + '</address>' +
              '<a class="koa-footer__contact-link" href="' + escapeHtml(contact.phoneHref) + '"><span>Call</span><strong>' + escapeHtml(contact.phoneDisplay) + '</strong></a>' +
              '<a class="koa-footer__contact-link" href="mailto:' + escapeHtml(contact.email) + '"><span>Email</span><strong>' + escapeHtml(contact.email) + '</strong></a>' +
              '<a class="koa-footer__map-link" href="' + escapeHtml(contact.mapHref) + '" target="_blank" rel="noopener noreferrer">Open in Maps <span aria-hidden="true">↗</span></a>' +
            '</section>' +
          '</div>' +

          '<div class="koa-footer__bottom">' +
            '<span>© <span data-koa-year></span> ' + escapeHtml(brand.name) + '. All rights reserved.</span>' +
            '<span>Craft cocktails · Live music · Pāhoa, Hawaiʻi</span>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  function getHawaiiNow(timezone) {
    var formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    var values = {};
    formatter.formatToParts(new Date()).forEach(function (part) {
      values[part.type] = part.value;
    });
    var dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      day: dayMap[values.weekday],
      minutes: Number(values.hour) * 60 + Number(values.minute)
    };
  }

  function toMinutes(value) {
    if (!value) return null;
    var pieces = value.split(":");
    return Number(pieces[0]) * 60 + Number(pieces[1]);
  }

  function getTodayRule(hours, day) {
    return (hours || []).find(function (rule) {
      return Array.isArray(rule.days) && rule.days.indexOf(day) !== -1;
    });
  }

  function getOpenStatus(business) {
    var timezone = business.timezone || fallbackBusiness.timezone;
    var now = getHawaiiNow(timezone);
    var rule = getTodayRule(business.hours, now.day);

    if (!rule || !rule.open || !rule.close) {
      return { open: false, label: "Closed Today", detail: rule ? rule.display : "Closed" };
    }

    var open = toMinutes(rule.open);
    var close = toMinutes(rule.close);
    var isOpen = now.minutes >= open && now.minutes < close;

    return {
      open: isOpen,
      label: isOpen ? "Open Now" : "Closed Now",
      detail: "Today's hours: " + rule.display
    };
  }

  function renderStatus(business) {
    var status = getOpenStatus(business);
    document.querySelectorAll("[data-koa-open-status]").forEach(function (node) {
      node.classList.toggle("is-open", status.open);
      node.classList.toggle("is-closed", !status.open);
      var label = node.querySelector("[data-koa-status-label]");
      var detail = node.querySelector("[data-koa-status-detail]");
      if (label) label.textContent = status.label;
      if (detail) detail.textContent = status.detail;
    });
  }

  function mountFooter() {
    var config = getConfig();
    var targets = document.querySelectorAll("[data-site-footer]");

    if (!targets.length) {
      var target = document.createElement("div");
      target.setAttribute("data-site-footer", "");
      document.body.appendChild(target);
      targets = [target];
    }

    targets.forEach(function (target) {
      target.innerHTML = footerMarkup(config.footer, config.business);
    });

    document.querySelectorAll("[data-koa-year]").forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });

    renderStatus(config.business);
    window.setInterval(function () { renderStatus(config.business); }, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountFooter, { once: true });
  } else {
    mountFooter();
  }
})();
