(function () {
  var cfg = window.SITE_CONFIG || {};
  var business = cfg.business || {};
  var timezone = business.timezone || "Pacific/Honolulu";

  function getNowInTimezoneParts() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: false
    }).formatToParts(new Date());

    var out = {};
    parts.forEach(function (part) {
      if (part.type !== "literal") out[part.type] = part.value;
    });
    return {
      day: (out.weekday || "").toLowerCase(),
      hour: parseInt(out.hour || "0", 10),
      minute: parseInt(out.minute || "0", 10)
    };
  }

  function hhmmToMinutes(value) {
    if (!value) return null;
    var parts = value.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function getCurrentStatus() {
    var now = getNowInTimezoneParts();
    var currentMinutes = now.hour * 60 + now.minute;
    var hours = business.hours || [];

    for (var i = 0; i < hours.length; i++) {
      var entry = hours[i];
      if ((entry.days || []).indexOf(now.day) === -1) continue;
      if (entry.closed) {
        return { open: false, label: "Closed Today", sublabel: entry.label + ": " + entry.display };
      }
      var openMin = hhmmToMinutes(entry.open);
      var closeMin = hhmmToMinutes(entry.close);
      var isOpen = currentMinutes >= openMin && currentMinutes < closeMin;
      return {
        open: isOpen,
        label: isOpen ? "Open Now" : "Closed Now",
        sublabel: entry.label + ": " + entry.display
      };
    }

    return { open: false, label: "Hours Unavailable", sublabel: "" };
  }

  function renderHoursList(container) {
    if (!container) return;
    container.innerHTML = (business.hours || []).map(function (entry) {
      var value = entry.closed ? entry.display : entry.display;
      return '<div class="hours-row"><span>' + entry.label + '</span><strong>' + value + '</strong></div>';
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var addressBlocks = document.querySelectorAll("[data-business-address]");
    addressBlocks.forEach(function (el) {
      el.innerHTML = (business.addressLines || []).join("<br>");
    });

    var phoneBlocks = document.querySelectorAll("[data-business-phone]");
    phoneBlocks.forEach(function (el) {
      var href = business.phoneHref || "#";
      var label = business.phoneDisplay || "";
      el.innerHTML = '<a href="' + href + '">' + label + '</a>';
    });

    var emailBlocks = document.querySelectorAll("[data-business-email]");
    emailBlocks.forEach(function (el) {
      var email = business.email || "";
      el.innerHTML = '<a href="mailto:' + email + '">' + email + '</a>';
    });

    document.querySelectorAll("[data-business-hours]").forEach(renderHoursList);

    var status = getCurrentStatus();
    document.querySelectorAll("[data-open-indicator]").forEach(function (el) {
      el.classList.toggle("is-open", !!status.open);
      el.classList.toggle("is-closed", !status.open);
      el.innerHTML = '<strong>' + status.label + '</strong><span>' + status.sublabel + '</span>';
    });

    var socialInstagram = document.querySelector("[data-business-instagram]");
    if (socialInstagram && business.social && business.social.instagram) socialInstagram.setAttribute("href", business.social.instagram);

    var socialFacebook = document.querySelector("[data-business-facebook]");
    if (socialFacebook && business.social && business.social.facebook) socialFacebook.setAttribute("href", business.social.facebook);

    var socialYelp = document.querySelector("[data-business-yelp]");
    if (socialYelp && business.social && business.social.yelp) socialYelp.setAttribute("href", business.social.yelp);
  });
})();
