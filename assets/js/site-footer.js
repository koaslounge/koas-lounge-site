(function () {
  "use strict";

  var fallbackBusiness = {
    timezone: "Pacific/Honolulu",
    hours: [
      {
        days: [0],
        label: "Sunday",
        open: null,
        close: null,
        display: "Closed except 4th & 5th Sundays",
        statusDetail: "Closed today · Open 4th Sunday 3 PM–8 PM and 5th Sunday 2 PM–6 PM"
      },
      { days: [1], label: "Monday", open: null, close: null, display: "Closed" },
      { days: [2, 3, 4], label: "Tuesday–Thursday", open: "17:00", close: "22:00", display: "5 PM – 10 PM" },
      { days: [5, 6], label: "Friday–Saturday", open: "17:00", close: "24:00", display: "5 PM – 12 AM" }
    ],
    recurringHours: [
      {
        day: 0,
        occurrence: 4,
        label: "4th Sunday · Pool Tournament",
        eventName: "Monthly Pool Tournament",
        open: "15:00",
        close: "20:00",
        display: "3 PM – 8 PM"
      },
      {
        day: 0,
        occurrence: 5,
        label: "5th Sunday · Social Brunch",
        eventName: "Social Brunch",
        open: "14:00",
        close: "18:00",
        display: "2 PM – 6 PM"
      }
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
    return {
      footer: window.KOA_FOOTER_CONFIG || {},
      business: window.BUSINESS_CONFIG || fallbackBusiness
    };
  }

  function navigationMarkup(items) {
    return (items || []).map(function (item) {
      return '<li><a href="' + escapeHtml(item.href) + '"><span>' + escapeHtml(item.label) + '</span><span aria-hidden="true">↗</span></a></li>';
    }).join("");
  }

  function getDisplayRows(business) {
    if (window.KOA_BUSINESS_HOURS && typeof window.KOA_BUSINESS_HOURS.getDisplayRows === "function") {
      return window.KOA_BUSINESS_HOURS.getDisplayRows();
    }
    return (business.hours || []).concat(business.recurringHours || []);
  }

  function hoursMarkup(business) {
    return getDisplayRows(business).map(function (rule) {
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
    var hashtag = config.hashtag || {};

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
              '<ul>' + hoursMarkup(business) + '</ul>' +
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

          '<a class="koa-footer__signature" href="' + escapeHtml(hashtag.href || "/after-dark.html") + '">' +
            '<span><small>' + escapeHtml(hashtag.eyebrow || "A night worth sharing") + '</small><strong>' + escapeHtml(hashtag.label || "#MeetMeAtKoas") + '</strong></span>' +
            '<p>' + escapeHtml(hashtag.copy || "Meet the crew, make the memory, and name the place.") + '</p>' +
            '<b aria-hidden="true">→</b>' +
          '</a>' +

          '<div class="koa-footer__bottom">' +
            '<span>© <span data-koa-year></span> ' + escapeHtml(brand.name) + '. All rights reserved.</span>' +
            '<span>' + escapeHtml(brand.footerLine || "Craft cocktails · Live music · Pāhoa, Hawaiʻi") + '</span>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  function getHawaiiNow(timezone, date) {
    var formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    var values = {};
    formatter.formatToParts(date || new Date()).forEach(function (part) {
      values[part.type] = part.value;
    });

    var dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var hour = Number(values.hour);
    if (hour === 24) hour = 0;

    return {
      weekday: dayMap[values.weekday],
      year: Number(values.year),
      month: Number(values.month),
      date: Number(values.day),
      occurrence: Math.ceil(Number(values.day) / 7),
      minutes: hour * 60 + Number(values.minute)
    };
  }

  function toMinutes(value) {
    if (!value) return null;
    var pieces = value.split(":");
    return Number(pieces[0]) * 60 + Number(pieces[1]);
  }

  function getRecurringRule(business, now) {
    return (business.recurringHours || []).find(function (rule) {
      return rule.day === now.weekday && rule.occurrence === now.occurrence;
    });
  }

  function getRegularRule(business, day) {
    return (business.hours || []).find(function (rule) {
      return Array.isArray(rule.days) && rule.days.indexOf(day) !== -1;
    });
  }

  function getOpenStatus(business) {
    if (window.KOA_BUSINESS_HOURS && typeof window.KOA_BUSINESS_HOURS.currentStatus === "function") {
      var sharedStatus = window.KOA_BUSINESS_HOURS.currentStatus();
      return {
        open: sharedStatus.open,
        label: sharedStatus.text,
        detail: sharedStatus.detail
      };
    }

    var timezone = business.timezone || fallbackBusiness.timezone;
    var now = getHawaiiNow(timezone);
    var rule = getRecurringRule(business, now) || getRegularRule(business, now.weekday);

    if (!rule || !rule.open || !rule.close) {
      return {
        open: false,
        label: "Closed Today",
        detail: rule ? (rule.statusDetail || rule.display) : "Closed"
      };
    }

    var open = toMinutes(rule.open);
    var close = toMinutes(rule.close);
    var isOpen = now.minutes >= open && now.minutes < close;
    var eventPrefix = rule.eventName ? rule.eventName + " · " : "Today's hours: ";

    return {
      open: isOpen,
      label: isOpen ? "Open Now" : "Closed Now",
      detail: eventPrefix + rule.display
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
    window.setInterval(function () {
      renderStatus(config.business);
    }, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountFooter, { once: true });
  } else {
    mountFooter();
  }
})();
