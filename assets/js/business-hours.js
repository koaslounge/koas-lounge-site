(function () {
  "use strict";

  var config = window.BUSINESS_CONFIG;
  if (!config) return;

  function getHawaiiParts() {
    var formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: config.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    var parts = formatter.formatToParts(new Date());
    var values = {};
    parts.forEach(function (part) { values[part.type] = part.value; });
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

  function todayRule(day) {
    return config.hours.find(function (rule) {
      return rule.days.indexOf(day) !== -1;
    });
  }

  function currentStatus() {
    var now = getHawaiiParts();
    var rule = todayRule(now.day);
    if (!rule || !rule.open || !rule.close) {
      return { open: false, text: "Closed Today", detail: rule ? rule.display : "Closed" };
    }
    var open = toMinutes(rule.open);
    var close = toMinutes(rule.close);
    var isOpen = now.minutes >= open && now.minutes < close;
    return {
      open: isOpen,
      text: isOpen ? "Open Now" : "Closed Now",
      detail: rule.display
    };
  }

  function renderHours() {
    var listHtml = config.hours.map(function (rule) {
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
      if (detail) detail.textContent = "Today's hours: " + status.detail;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHours();
    renderStatus();
    window.setInterval(renderStatus, 60000);
  });
})();
