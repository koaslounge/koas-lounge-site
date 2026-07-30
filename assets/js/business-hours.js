(function () {
  "use strict";

  var config = window.BUSINESS_CONFIG;
  if (!config) return;

  function getHawaiiParts(date) {
    var formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: config.timezone,
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

    // Some browsers represent midnight as 24:00. For status checks, treat it as 00:00.
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

  function getRecurringRule(now) {
    return (config.recurringHours || []).find(function (rule) {
      return rule.day === now.weekday && rule.occurrence === now.occurrence;
    });
  }

  function getRegularRule(day) {
    return (config.hours || []).find(function (rule) {
      return Array.isArray(rule.days) && rule.days.indexOf(day) !== -1;
    });
  }

  function getTodayRule(now) {
    return getRecurringRule(now) || getRegularRule(now.weekday);
  }

  function currentStatus(date) {
    var now = getHawaiiParts(date);
    var rule = getTodayRule(now);

    if (!rule || !rule.open || !rule.close) {
      return {
        open: false,
        text: "Closed Today",
        detail: rule ? (rule.statusDetail || rule.display) : "Closed"
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
    return (config.hours || []).concat(config.recurringHours || []);
  }

  function renderHours() {
    var listHtml = getDisplayRows().map(function (rule) {
      return '<li><span>' + rule.label + '</span><strong>' + rule.display + '</strong></li>';
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

  // Expose the resolver so other shared components can use the same schedule logic.
  window.KOA_BUSINESS_HOURS = {
    currentStatus: currentStatus,
    getDisplayRows: getDisplayRows,
    getHawaiiParts: getHawaiiParts
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderHours();
    renderStatus();
    window.setInterval(renderStatus, 60000);
  });
})();
