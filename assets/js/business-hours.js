(function () {
  "use strict";

  var refreshTimer = null;

  function getConfig() {
    return window.BUSINESS_CONFIG || null;
  }

  function getHawaiiParts(date, config) {
    var formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: config.timezone || "Pacific/Honolulu",
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

    // Some browsers represent midnight as 24:00.
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
    var pieces = String(value).split(":");
    return Number(pieces[0]) * 60 + Number(pieces[1]);
  }

  function getRecurringRule(now, config) {
    return (config.recurringHours || []).find(function (rule) {
      return rule.day === now.weekday && rule.occurrence === now.occurrence;
    });
  }

  function getRegularRule(day, config) {
    return (config.hours || []).find(function (rule) {
      return Array.isArray(rule.days) && rule.days.indexOf(day) !== -1;
    });
  }

  function getTodayRule(now, config) {
    return getRecurringRule(now, config) || getRegularRule(now.weekday, config);
  }

  function currentStatus(date) {
    var config = getConfig();
    if (!config) {
      return {
        open: false,
        text: "Hours unavailable",
        detail: "Please check the Events page"
      };
    }

    var now = getHawaiiParts(date, config);
    var rule = getTodayRule(now, config);

    if (!rule || !rule.open || !rule.close) {
      return {
        open: false,
        text: "Closed Today",
        detail: rule ? (rule.statusDetail || rule.display || "Closed") : "Closed"
      };
    }

    var open = toMinutes(rule.open);
    var close = toMinutes(rule.close);
    var isOpen = now.minutes >= open && now.minutes < close;
    var eventPrefix = rule.eventName ? rule.eventName + " · " : "Today's hours: ";

    return {
      open: isOpen,
      text: isOpen ? "Open Now" : "Closed Now",
      detail: eventPrefix + rule.display
    };
  }

  function getDisplayRows() {
    var config = getConfig();
    if (!config) return [];
    return (config.hours || []).concat(config.recurringHours || []);
  }

  function renderHours() {
    var rows = getDisplayRows();
    if (!rows.length) return;

    var listHtml = rows.map(function (rule) {
      return "<li><span>" + rule.label + "</span><strong>" + rule.display + "</strong></li>";
    }).join("");

    document.querySelectorAll("[data-business-hours]").forEach(function (node) {
      node.innerHTML = listHtml;
    });
  }

  function renderStatus() {
    var status = currentStatus();

    document.querySelectorAll("[data-open-status]").forEach(function (node) {
      node.classList.toggle("is-open", status.open);
      node.classList.toggle("is-closed", !status.open);

      var label = node.querySelector("[data-open-status-label]");
      var detail = node.querySelector("[data-open-status-detail]");

      if (label) label.textContent = status.text;
      if (detail) detail.textContent = status.detail;
    });
  }

  function init() {
    renderHours();
    renderStatus();

    if (refreshTimer) window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(renderStatus, 60000);

    window.dispatchEvent(new CustomEvent("koa:business-hours-ready", {
      detail: currentStatus()
    }));
  }

  window.KOA_BUSINESS_HOURS = {
    currentStatus: currentStatus,
    getDisplayRows: getDisplayRows,
    renderStatus: renderStatus,
    renderHours: renderHours,
    init: init
  };

  // Run whether this file loads before or after DOMContentLoaded.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
