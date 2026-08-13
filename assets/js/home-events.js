document.addEventListener("DOMContentLoaded", () => {
  const endpoint = "/.netlify/functions/office365-events";
  const mountNode = document.querySelector("[data-home-calendar]");

  if (!mountNode) return;

  let allEvents = [];
  let calendarMonth = startOfMonth(new Date());
  let selectedDateKey = dateKey(new Date());
  let calendarMinMonth = startOfMonth(new Date());
  let calendarMaxMonth = addMonths(calendarMinMonth, 3);

  renderShell();
  loadEvents();

  async function loadEvents() {
    const statusNode = mountNode.querySelector("[data-home-calendar-status]");

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load events.");
      }

      allEvents = (Array.isArray(payload.events) ? payload.events : [])
        .map(normalizeEvent)
        .filter(Boolean)
        .sort((a, b) => a.startDate - b.startDate);

      calendarMinMonth = startOfMonth(new Date());
      const defaultRangeEnd = addMonths(calendarMinMonth, 3);
      const lastEventMonth = allEvents.length
        ? startOfMonth(allEvents[allEvents.length - 1].startDate)
        : defaultRangeEnd;

      calendarMaxMonth = lastEventMonth > defaultRangeEnd ? lastEventMonth : defaultRangeEnd;
      calendarMonth = startOfMonth(new Date());

      const todayKey = dateKey(new Date());
      const todayHasEvents = allEvents.some(event => dateKey(event.startDate) === todayKey);
      const firstCurrentMonthEvent = allEvents.find(event => isSameMonth(event.startDate, calendarMonth));

      selectedDateKey = todayHasEvents
        ? todayKey
        : firstCurrentMonthEvent
          ? dateKey(firstCurrentMonthEvent.startDate)
          : todayKey;

      if (statusNode) {
        statusNode.textContent = allEvents.length
          ? "Live Office 365 calendar synced."
          : "No upcoming events are currently listed.";
      }

      bindControls();
      renderMonthCalendar();
    } catch (error) {
      if (statusNode) {
        statusNode.textContent = "The live event calendar could not be loaded. Please view the full Events page or check back shortly.";
      }

      const gridNode = mountNode.querySelector("[data-home-calendar-grid]");
      const resultsNode = mountNode.querySelector("[data-home-calendar-events]");

      if (gridNode) gridNode.innerHTML = "";
      if (resultsNode) {
        resultsNode.innerHTML = '<div class="home-calendar__empty">The event feed is temporarily unavailable.</div>';
      }
    }
  }

  function renderShell() {
    mountNode.innerHTML = `
      <div class="home-calendar__status" data-home-calendar-status aria-live="polite">Loading the live event calendar...</div>

      <div class="home-calendar__panel">
        <div class="home-calendar__toolbar">
          <div>
            <span class="home-calendar__eyebrow">Browse by date</span>
            <h3 data-home-calendar-title>Monthly Calendar</h3>
            <p>Choose a day to see every event scheduled at Koa's Lounge.</p>
          </div>
          <div class="home-calendar__controls" aria-label="Calendar month navigation">
            <button class="home-calendar__arrow" type="button" data-home-calendar-previous aria-label="Previous month">←</button>
            <button class="home-calendar__arrow" type="button" data-home-calendar-next aria-label="Next month">→</button>
          </div>
        </div>

        <div class="home-calendar__calendar" role="region" aria-label="Monthly Koa's Lounge event calendar">
          <div class="home-calendar__weekdays" aria-hidden="true">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>
          <div class="home-calendar__grid" data-home-calendar-grid></div>
        </div>

        <div class="home-calendar__selection" data-home-calendar-selection aria-live="polite">
          <div class="home-calendar__selection-header">
            <div>
              <span class="home-calendar__eyebrow">Selected date</span>
              <h3 data-home-calendar-selected-title>Events</h3>
            </div>
            <span class="home-calendar__count" data-home-calendar-selected-count>0 events</span>
          </div>
          <div class="home-calendar__events" data-home-calendar-events></div>
        </div>
      </div>
    `;
  }

  function bindControls() {
    const previousButton = mountNode.querySelector("[data-home-calendar-previous]");
    const nextButton = mountNode.querySelector("[data-home-calendar-next]");
    const grid = mountNode.querySelector("[data-home-calendar-grid]");

    if (previousButton && !previousButton.dataset.bound) {
      previousButton.dataset.bound = "true";
      previousButton.addEventListener("click", () => {
        const previous = addMonths(calendarMonth, -1);
        if (previous < calendarMinMonth) return;
        calendarMonth = previous;
        selectBestDateForVisibleMonth();
        renderMonthCalendar();
      });
    }

    if (nextButton && !nextButton.dataset.bound) {
      nextButton.dataset.bound = "true";
      nextButton.addEventListener("click", () => {
        const next = addMonths(calendarMonth, 1);
        if (next > calendarMaxMonth) return;
        calendarMonth = next;
        selectBestDateForVisibleMonth();
        renderMonthCalendar();
      });
    }

    if (grid && !grid.dataset.bound) {
      grid.dataset.bound = "true";
      grid.addEventListener("click", event => {
        const button = event.target.closest("button[data-calendar-date]");
        if (!button) return;

        selectedDateKey = button.dataset.calendarDate;
        renderMonthCalendar();
        scrollToSelectedDateResults();
      });
    }
  }

  function renderMonthCalendar() {
    const titleNode = mountNode.querySelector("[data-home-calendar-title]");
    const gridNode = mountNode.querySelector("[data-home-calendar-grid]");
    const previousButton = mountNode.querySelector("[data-home-calendar-previous]");
    const nextButton = mountNode.querySelector("[data-home-calendar-next]");

    if (!titleNode || !gridNode || !previousButton || !nextButton) return;

    titleNode.textContent = calendarMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });

    previousButton.disabled = calendarMonth <= calendarMinMonth;
    nextButton.disabled = calendarMonth >= calendarMaxMonth;

    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push('<div class="home-calendar__blank" aria-hidden="true"></div>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = dateKey(date);
      const dayEvents = eventsForDate(key);
      const eventCount = dayEvents.length;
      const isSelected = key === selectedDateKey;
      const isToday = key === dateKey(new Date());
      const firstTitle = eventCount ? dayEvents[0].title : "";
      const countLabel = eventCount === 1 ? "1 event" : `${eventCount} events`;
      const ariaLabel = `${formatDate(date)}${eventCount ? `, ${countLabel}` : ", no events"}`;

      cells.push(`
        <button
          class="home-calendar__day${eventCount ? " has-events" : ""}${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}"
          type="button"
          data-calendar-date="${escapeAttr(key)}"
          aria-label="${escapeAttr(ariaLabel)}"
          aria-pressed="${isSelected ? "true" : "false"}"
        >
          <span class="home-calendar__day-number">${day}</span>
          ${eventCount
            ? `<span class="home-calendar__event-title">${escapeHtml(firstTitle)}</span>`
            : '<span class="home-calendar__event-title is-empty">No events</span>'}
          ${eventCount ? `<span class="home-calendar__event-count">${escapeHtml(countLabel)}</span>` : ""}
        </button>
      `);
    }

    const totalCells = firstWeekday + daysInMonth;
    const trailingCells = (7 - (totalCells % 7)) % 7;

    for (let index = 0; index < trailingCells; index += 1) {
      cells.push('<div class="home-calendar__blank" aria-hidden="true"></div>');
    }

    gridNode.innerHTML = cells.join("");
    renderSelectedDate();
  }

  function renderSelectedDate() {
    const titleNode = mountNode.querySelector("[data-home-calendar-selected-title]");
    const countNode = mountNode.querySelector("[data-home-calendar-selected-count]");
    const eventsNode = mountNode.querySelector("[data-home-calendar-events]");
    const selectedDate = dateFromKey(selectedDateKey);
    const selectedEvents = eventsForDate(selectedDateKey);

    if (!titleNode || !countNode || !eventsNode) return;

    titleNode.textContent = selectedDate
      ? selectedDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        })
      : "Selected date";

    countNode.textContent = `${selectedEvents.length} ${selectedEvents.length === 1 ? "event" : "events"}`;
    eventsNode.innerHTML = "";

    if (!selectedEvents.length) {
      eventsNode.innerHTML = '<div class="home-calendar__empty">No events are currently scheduled for this date.</div>';
      return;
    }

    selectedEvents.forEach(event => {
      eventsNode.appendChild(createEventCard(event));
    });
  }

  function createEventCard(event) {
    const card = document.createElement("article");
    card.className = "home-event-card" + (event.isHighValueNight ? " home-event-card--featured" : "");

    const typeLabel = getTypeLabel(event.type);
    const timeLabel = formatTimeRange(event.startDate, event.endDate);

    card.innerHTML = `
      <div class="home-event-card__top">
        <div class="home-event-card__date${event.isHighValueNight ? " home-event-card__date--featured" : ""}">
          <span class="home-event-card__month">${escapeHtml(monthShort(event.startDate))}</span>
          <span class="home-event-card__day">${escapeHtml(String(event.startDate.getDate()))}</span>
          <span class="home-event-card__dow">${escapeHtml(dayShort(event.startDate))}</span>
        </div>

        <div class="home-event-card__meta">
          <div class="home-event-card__badges">
            <span class="home-event-card__badge">${escapeHtml(typeLabel)}</span>
            ${event.hasCoverCharge ? '<span class="home-event-card__badge home-event-card__badge--cover">Cover Charge</span>' : ""}
            ${event.isHighValueNight ? '<span class="home-event-card__chip home-event-card__chip--featured">Prime Night</span>' : ""}
          </div>
          <h4>${escapeHtml(event.title)}</h4>
        </div>
      </div>

      ${event.description ? `<div class="home-event-card__description">${formatDescription(event.description)}</div>` : ""}

      <div class="home-event-card__details">
        <div class="home-event-card__detail">
          <span class="home-event-card__icon home-event-card__icon--time" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="12" r="8.5"></circle>
              <path d="M12 7.5v5l3.4 2"></path>
            </svg>
          </span>
          <span>${escapeHtml(timeLabel)}</span>
        </div>
        ${event.location ? `
          <div class="home-event-card__detail">
            <span class="home-event-card__icon home-event-card__icon--location" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M12 21s6-5.45 6-11a6 6 0 1 0-12 0c0 5.55 6 11 6 11Z"></path>
                <circle cx="12" cy="10" r="2.25"></circle>
              </svg>
            </span>
            <span>${escapeHtml(event.location)}</span>
          </div>
        ` : ""}
      </div>

      ${event.url ? `
        <div class="home-event-card__footer">
          <a href="${escapeAttr(event.url)}" target="_blank" rel="noopener">View in Outlook</a>
        </div>
      ` : ""}
    `;

    return card;
  }

  function normalizeEvent(event) {
    if (!event || !event.start) return null;

    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : null;

    if (Number.isNaN(startDate.getTime())) return null;

    const categories = Array.isArray(event.categories) ? event.categories : [];
    const description = event.description || "";
    const weekday = startDate.getDay();

    return {
      title: event.title || "Untitled Event",
      description,
      location: event.location || "",
      url: event.url || "",
      categories,
      startDate,
      endDate,
      type: deriveType(event.title || "", description, categories),
      hasCoverCharge: containsCoverCharge(description),
      isHighValueNight: weekday === 5 || weekday === 6
    };
  }

  function scrollToSelectedDateResults() {
    const selectionNode = mountNode.querySelector("[data-home-calendar-selection]");
    if (!selectionNode) return;

    const prefersReducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        selectionNode.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });
      });
    });
  }

  function selectBestDateForVisibleMonth() {
    const currentSelection = dateFromKey(selectedDateKey);
    if (currentSelection && isSameMonth(currentSelection, calendarMonth)) return;

    const firstEvent = allEvents.find(event => isSameMonth(event.startDate, calendarMonth));
    selectedDateKey = firstEvent
      ? dateKey(firstEvent.startDate)
      : dateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1));
  }

  function eventsForDate(key) {
    return allEvents.filter(event => dateKey(event.startDate) === key);
  }

  function containsCoverCharge(description) {
    const text = String(description || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (!text) return false;

    const freePatterns = [
      /\bno\s+cover\b/i,
      /\bno\s+cover\s+charge\b/i,
      /\bno\s+admission\s+(?:fee|charge)\b/i,
      /\bfree\s+admission\b/i,
      /\bfree\s+entry\b/i,
      /\bno\s+entry\s+fee\b/i,
      /\bno\s+ticket\s+required\b/i,
      /\bno\s+suggested\s+donation\b/i
    ];

    if (freePatterns.some((pattern) => pattern.test(text))) {
      return false;
    }

    const textWithoutCoverBand = text.replace(/\bcover\s+band\b/gi, "");

    const paidPatterns = [
      /\bcover\s+charge\b/i,
      /\bcover\s+fee\b/i,
      /\bsuggested\s+donation\b/i,
      /\bsuggested\s+cover\b/i,
      /\bdonations?\s+(?:appreciated|requested|encouraged)\b/i,

      /\$\s*\d+(?:\.\d{1,2})?\s*(?:cover|cover\s+charge|cover\s+fee)\b/i,
      /\b(?:cover|cover\s+charge|cover\s+fee)\s*(?::|is|of|-)?\s*\$\s*\d+(?:\.\d{1,2})?\b/i,

      /\bpaid\s+admission\b/i,
      /\badmission\s+(?:fee|charge)\b/i,
      /\badmission\s*(?::|is|of|-)?\s*\$\s*\d+(?:\.\d{1,2})?\b/i,
      /\$\s*\d+(?:\.\d{1,2})?\s*(?:admission|admission\s+fee|admission\s+charge)\b/i,

      /\bentry\s+(?:fee|charge)\b/i,
      /\bentry\s*(?::|is|of|-)?\s*\$\s*\d+(?:\.\d{1,2})?\b/i,
      /\$\s*\d+(?:\.\d{1,2})?\s*(?:entry|entry\s+fee|entry\s+charge)\b/i,

      /\btickets?\s+(?:are\s+)?(?:required|available|on\s+sale)\b/i,
      /\bticket\s+(?:price|cost|fee)\b/i,
      /\btickets?\s*(?::|are|cost|of|-)?\s*\$\s*\d+(?:\.\d{1,2})?\b/i,
      /\$\s*\d+(?:\.\d{1,2})?\s*(?:tickets?|per\s+ticket)\b/i,

      /\badmission\s+(?:is\s+)?paid\b/i,
      /\bpaid\s+entry\b/i
    ];

    return paidPatterns.some((pattern) => pattern.test(textWithoutCoverBand));
  }

  function deriveType(title, description, categories) {
    const text = [title, description, ...(categories || [])].join(" ").toLowerCase();
    const includesAny = (...terms) => terms.some(term => text.includes(term));

    if (includesAny("karaoke")) return "karaoke";
    if (includesAny("brunch", "mimosa")) return "brunch";
    if (includesAny("mario kart")) return "mario kart";
    if (includesAny("pool tournament", "billiards tournament", "8-ball tournament")) return "pool tournament";
    if (includesAny("shuffleboard")) return "shuffleboard";
    if (includesAny("trivia")) return "trivia";
    if (includesAny("speed dating", "dating event", "singles mixer")) return "dating";
    if (includesAny("comedy", "stand-up", "standup")) return "comedy";
    if (includesAny("open mic", "poetry", "spoken word", "storytelling", "story telling")) return "open mic";
    if (includesAny("jam session", "open jam", "open band", "cypher")) return "jam";
    if (includesAny("vinyl", "record night", "soul magic")) return "vinyl";
    if (includesAny("dj", "edm", "bass music", "house music")) return "dj";

    if (
      includesAny(
        "live music", "live band", "reggae", "rock", "funk", "acoustic", "always free",
        "spectacles", "freaky tiki", "tonic oasis", "punacat", "kanaka fyah",
        "positive motion", "average joes", "hayden james", "troubled in paradise",
        "chris murphy", "pepper", "dc lewis", "uncle charlie", "jazz"
      )
    ) return "live music";

    if (includesAny("game night", "gaming night", "video game")) return "game";
    if (includesAny("social event", "social night", "mixer")) return "social";

    return "special event";
  }

  function getTypeLabel(type) {
    switch (type) {
      case "karaoke": return "Karaoke Night";
      case "dj": return "DJ Night";
      case "brunch": return "Brunch";
      case "social": return "Social";
      case "vinyl": return "Vinyl Night";
      case "jam": return "Jam Session";
      case "open mic": return "Open Mic";
      case "comedy": return "Comedy Night";
      case "dating": return "Speed Dating";
      case "pool tournament": return "Pool Tournament";
      case "shuffleboard": return "Shuffleboard Night";
      case "mario kart": return "Mario Kart Tournament";
      case "game": return "Game Night";
      case "trivia": return "Trivia Night";
      case "live music": return "Live Music";
      default: return "Special Event";
    }
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function addMonths(date, amount) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
  }

  function isSameMonth(date, monthDate) {
    return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth();
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateFromKey(key) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
    if (!match) return null;

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  }

  function monthShort(date) {
    return date.toLocaleDateString("en-US", { month: "short" });
  }

  function dayShort(date) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  function formatTimeRange(start, end) {
    const startText = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });

    if (!end || Number.isNaN(end.getTime())) return startText;

    const endText = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });

    return `${startText} - ${endText}`;
  }

  function formatDescription(value) {
    return escapeHtml(value).replace(/\r\n|\r|\n/g, "<br>");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
});
