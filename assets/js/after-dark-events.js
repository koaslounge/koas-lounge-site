(function () {
  "use strict";

  var endpoint = "/.netlify/functions/office365-events";
  var target = document.querySelector("[data-after-dark-events]");
  if (!target) return;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function firstValue(object, paths) {
    for (var i = 0; i < paths.length; i += 1) {
      var path = paths[i].split(".");
      var value = object;
      for (var j = 0; j < path.length && value != null; j += 1) value = value[path[j]];
      if (value != null && value !== "") return value;
    }
    return "";
  }

  function normalize(event) {
    var title = firstValue(event, ["title", "subject", "name"]);
    var description = firstValue(event, ["description", "bodyPreview", "details", "body.content"]);
    var startRaw = firstValue(event, ["startDate", "startDateTime", "start.dateTime", "start", "date"]);
    var start = startRaw ? new Date(startRaw) : null;
    return { title: title || "Koa's After Dark", description: description || "A late-night Koa's experience.", start: start };
  }

  function isAfterDark(event) {
    var haystack = (event.title + " " + event.description).toLowerCase();
    return /(after dark|dj|dance|late night|house music|secret beats|soul magic|nightlife)/.test(haystack);
  }

  function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return "Date to be announced";
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Pacific/Honolulu",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date) + " HST";
  }

  function fallbackMarkup() {
    return '<article class="campaign-event-card campaign-event-card--fallback"><span>Next lineup loading</span><h3>The next After Dark night is taking shape.</h3><p>Check the live events calendar for DJs, bands, and late-night programming.</p><a href="/events.html">View all events <b aria-hidden="true">→</b></a></article>';
  }

  function render(events) {
    if (!events.length) {
      target.innerHTML = fallbackMarkup();
      return;
    }

    target.innerHTML = events.slice(0, 3).map(function (event) {
      return '<article class="campaign-event-card"><span>' + esc(formatDate(event.start)) + '</span><h3>' + esc(event.title) + '</h3><p>' + esc(event.description) + '</p><a href="/events.html">Event details <b aria-hidden="true">→</b></a></article>';
    }).join("");
  }

  fetch(endpoint, { headers: { Accept: "application/json" } })
    .then(function (response) {
      if (!response.ok) throw new Error("Unable to load events");
      return response.json();
    })
    .then(function (payload) {
      var raw = Array.isArray(payload) ? payload : (payload.events || payload.value || []);
      var now = Date.now() - 21600000;
      var events = raw.map(normalize).filter(function (event) {
        return isAfterDark(event) && (!event.start || event.start.getTime() >= now);
      }).sort(function (a, b) {
        return (a.start ? a.start.getTime() : Infinity) - (b.start ? b.start.getTime() : Infinity);
      });
      render(events);
    })
    .catch(function () { target.innerHTML = fallbackMarkup(); });
})();
