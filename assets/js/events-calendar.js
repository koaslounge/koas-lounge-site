document.addEventListener("DOMContentLoaded", () => {
  const endpoint = "/.netlify/functions/office365-events";
  const EVENT_CARD_LIMIT = 20;

  const statusNode = document.querySelector("[data-events-status]");
  const sourceNode = document.querySelector("[data-events-source]");

  const tonightNode = document.querySelector("[data-group-tonight]");
  const weekendNode = document.querySelector("[data-group-weekend]");
  const upcomingNode = document.querySelector("[data-group-upcoming]");

  const tonightCountNode = document.querySelector("[data-count-tonight]");
  const weekendCountNode = document.querySelector("[data-count-weekend]");
  const upcomingCountNode = document.querySelector("[data-count-upcoming]");

  const spotlightTitleNode = document.querySelector("[data-hero-spotlight-title]");
  const spotlightCopyNode = document.querySelector("[data-hero-spotlight-copy]");
  const tonightTitleNode = document.querySelector("[data-title-tonight]");

  if (!statusNode || !tonightNode || !weekendNode || !upcomingNode) return;

  let allEvents = [];
  let calendarMonth = startOfMonth(new Date());
  let selectedDateKey = dateKey(new Date());
  let calendarMinMonth = startOfMonth(new Date());
  let calendarMaxMonth = addMonths(calendarMinMonth, 3);
  let calendarNodes = null;

  installRuntimeStyles();
  statusNode.textContent = "Loading live event calendar...";
  loadEvents();

  async function loadEvents() {
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

      const grouped = groupEvents(allEvents);

      if (tonightTitleNode) {
        tonightTitleNode.textContent = grouped.tonightIsFallback ? "Next Event" : "Tonight";
      }

      renderGroup(
        tonightNode,
        grouped.tonight,
        grouped.tonightIsFallback
          ? "No upcoming events are scheduled right now."
          : "Nothing is scheduled for tonight."
      );
      renderGroup(weekendNode, grouped.weekend, "No weekend events are currently scheduled.");
      renderGroup(upcomingNode, grouped.upcoming, "No additional upcoming events are listed right now.");

      setCount(tonightCountNode, grouped.tonight.length);
      setCount(weekendCountNode, grouped.weekend.length);
      setCount(upcomingCountNode, grouped.upcoming.length);

      if (sourceNode) {
        sourceNode.textContent = payload?.source?.calendarName
          ? `Source: ${payload.source.calendarName}`
          : "Source: Office 365";
      }

      updateSpotlight(allEvents, grouped);
      initializeMonthCalendar();

      statusNode.textContent = allEvents.length
        ? "Live calendar synced."
        : "No upcoming events found.";
    } catch (error) {
      statusNode.textContent = "The event feed could not be loaded.";
      if (sourceNode) sourceNode.textContent = error.message || "Unknown error";

      renderEmptyState(tonightNode, "Tonight’s events could not be loaded.");
      renderEmptyState(weekendNode, "Weekend events could not be loaded.");
      renderEmptyState(upcomingNode, "Upcoming events could not be loaded.");

      setCount(tonightCountNode, 0);
      setCount(weekendCountNode, 0);
      setCount(upcomingCountNode, 0);

      if (spotlightTitleNode) spotlightTitleNode.textContent = "Live calendar unavailable";
      if (spotlightCopyNode) spotlightCopyNode.textContent = "Please check back shortly.";
    }
  }

  function normalizeEvent(event) {
    if (!event || !event.start) return null;

    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : null;

    if (Number.isNaN(startDate.getTime())) return null;

    const weekday = startDate.getDay();
    const categories = Array.isArray(event.categories) ? event.categories : [];
    const description = event.description || "";

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

  function groupEvents(events) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const day = now.getDay();
    const daysUntilFriday = day <= 5 ? 5 - day : 6;

    const fridayStart = new Date(todayStart);
    fridayStart.setDate(todayStart.getDate() + daysUntilFriday);

    const mondayAfterWeekend = new Date(fridayStart);
    mondayAfterWeekend.setDate(fridayStart.getDate() + 3);

    let tonight = [];
    const weekend = [];
    const upcoming = [];

    for (const event of events) {
      if (event.startDate >= todayStart && event.startDate < tomorrowStart) {
        tonight.push(event);
      } else if (event.startDate >= fridayStart && event.startDate < mondayAfterWeekend) {
        weekend.push(event);
      } else if (event.startDate >= tomorrowStart) {
        upcoming.push(event);
      }
    }

    let tonightIsFallback = false;

    if (tonight.length === 0 && events.length > 0) {
      tonight = [events[0]];
      tonightIsFallback = true;
    }

    return { tonight, weekend, upcoming, tonightIsFallback };
  }

  function renderGroup(container, events, emptyMessage) {
    container.innerHTML = "";

    if (!events.length) {
      renderEmptyState(container, emptyMessage);
      return;
    }

    events.slice(0, EVENT_CARD_LIMIT).forEach(event => {
      container.appendChild(createEventCard(event));
    });
  }

  function renderEmptyState(container, message) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  function createEventCard(event) {
    const card = document.createElement("article");
    card.className = "event-card" + (event.isHighValueNight ? " event-card--featured" : "");

    const typeLabel = getTypeLabel(event.type);
    const dateLabel = formatDate(event.startDate);
    const timeLabel = formatTimeRange(event.startDate, event.endDate);

    card.innerHTML = `
      <div class="event-card__top">
        <div class="event-card__date${event.isHighValueNight ? " event-card__date--featured" : ""}">
          <span class="event-card__month">${escapeHtml(monthShort(event.startDate))}</span>
          <span class="event-card__day">${escapeHtml(String(event.startDate.getDate()))}</span>
          <span class="event-card__dow">${escapeHtml(dayShort(event.startDate))}</span>
        </div>

        <div class="event-card__meta">
          <div class="event-card__badges">
            <span class="badge${event.isHighValueNight ? " badge--featured" : ""}">${escapeHtml(typeLabel)}</span>
            ${event.hasCoverCharge ? '<span class="badge badge--cover">Cover Charge</span>' : ""}
            ${event.isHighValueNight ? '<span class="chip chip--featured">Prime Night</span>' : ""}
          </div>

          <div class="event-card__title">${escapeHtml(event.title)}</div>

          <div class="event-card__chips">
            <span class="chip">${escapeHtml(dateLabel)}</span>
          </div>
        </div>
      </div>

      ${event.description ? `<div class="event-card__desc">${formatDescription(event.description)}</div>` : ""}

      <div class="event-card__details">
        <div class="event-detail">
          <div class="event-detail__icon" aria-hidden="true">◷</div>
          <div>${escapeHtml(timeLabel)}</div>
        </div>
        ${event.location ? `
          <div class="event-detail">
            <div class="event-detail__icon" aria-hidden="true">⌖</div>
            <div>${escapeHtml(event.location)}</div>
          </div>
        ` : ""}
      </div>

      <div class="event-card__footer">
        <div class="chip">${escapeHtml(typeLabel)}</div>
        ${event.url ? `<a class="event-link" href="${escapeAttr(event.url)}" target="_blank" rel="noopener">View in Outlook</a>` : ""}
      </div>
    `;

    return card;
  }

  function updateSpotlight(events, grouped) {
    const spotlight = grouped.tonight[0] || grouped.weekend[0] || grouped.upcoming[0] || events[0];

    if (!spotlight) {
      if (spotlightTitleNode) spotlightTitleNode.textContent = "No upcoming events loaded";
      if (spotlightCopyNode) spotlightCopyNode.textContent = "Add events to your Office 365 calendar and they will appear here.";
      return;
    }

    if (spotlightTitleNode) spotlightTitleNode.textContent = spotlight.title;

    const parts = [formatDate(spotlight.startDate), formatTimeRange(spotlight.startDate, spotlight.endDate)];
    if (spotlight.location) parts.push(spotlight.location);

    if (spotlightCopyNode) spotlightCopyNode.textContent = parts.join(" • ");
  }

  function setCount(node, total) {
    if (!node) return;

    if (total > EVENT_CARD_LIMIT) {
      node.textContent = `${EVENT_CARD_LIMIT} of ${total} events`;
      return;
    }

    node.textContent = `${total} ${total === 1 ? "event" : "events"}`;
  }

  function initializeMonthCalendar() {
    calendarNodes = ensureMonthCalendar();
    if (!calendarNodes) return;

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

    calendarNodes.previousButton.addEventListener("click", () => {
      const previous = addMonths(calendarMonth, -1);
      if (previous < calendarMinMonth) return;
      calendarMonth = previous;
      selectBestDateForVisibleMonth();
      renderMonthCalendar();
    });

    calendarNodes.nextButton.addEventListener("click", () => {
      const next = addMonths(calendarMonth, 1);
      if (next > calendarMaxMonth) return;
      calendarMonth = next;
      selectBestDateForVisibleMonth();
      renderMonthCalendar();
    });

    calendarNodes.grid.addEventListener("click", event => {
      const button = event.target.closest("button[data-calendar-date]");
      if (!button) return;

      selectedDateKey = button.dataset.calendarDate;
      renderMonthCalendar();
    });

    renderMonthCalendar();
  }

  function ensureMonthCalendar() {
    const existing = document.querySelector("[data-month-calendar]");
    if (existing) return getCalendarNodes(existing);

    const upcomingBlock = upcomingNode.closest(".events-block");
    if (!upcomingBlock) return null;

    const section = document.createElement("section");
    section.className = "events-block events-month-view";
    section.setAttribute("data-month-calendar", "");
    section.innerHTML = `
      <div class="events-month__header">
        <div>
          <span class="events-month__eyebrow">Browse by date</span>
          <h2 class="events-block__title" data-calendar-month-title>Monthly Calendar</h2>
          <p class="events-month__intro">Choose a date to see every event scheduled for that day.</p>
        </div>
        <div class="events-month__controls" aria-label="Calendar month navigation">
          <button class="events-month__arrow" type="button" data-calendar-previous aria-label="Previous month">←</button>
          <button class="events-month__arrow" type="button" data-calendar-next aria-label="Next month">→</button>
        </div>
      </div>

      <div class="events-month__calendar" role="region" aria-label="Monthly event calendar">
        <div class="events-month__weekdays" aria-hidden="true">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        <div class="events-month__grid" data-calendar-grid></div>
      </div>

      <div class="events-month__selection" aria-live="polite">
        <div class="events-month__selection-header">
          <div>
            <span class="events-month__eyebrow">Selected date</span>
            <h3 data-calendar-selected-title>Events</h3>
          </div>
          <span class="events-block__count" data-calendar-selected-count>0 events</span>
        </div>
        <div class="events-grid events-month__events" data-calendar-selected-events></div>
      </div>
    `;

    upcomingBlock.insertAdjacentElement("afterend", section);
    return getCalendarNodes(section);
  }

  function getCalendarNodes(section) {
    return {
      section,
      title: section.querySelector("[data-calendar-month-title]"),
      grid: section.querySelector("[data-calendar-grid]"),
      previousButton: section.querySelector("[data-calendar-previous]"),
      nextButton: section.querySelector("[data-calendar-next]"),
      selectedTitle: section.querySelector("[data-calendar-selected-title]"),
      selectedCount: section.querySelector("[data-calendar-selected-count]"),
      selectedEvents: section.querySelector("[data-calendar-selected-events]")
    };
  }

  function renderMonthCalendar() {
    if (!calendarNodes) return;

    calendarNodes.title.textContent = calendarMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });

    calendarNodes.previousButton.disabled = calendarMonth <= calendarMinMonth;
    calendarNodes.nextButton.disabled = calendarMonth >= calendarMaxMonth;

    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push('<div class="events-month__blank" aria-hidden="true"></div>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = dateKey(date);
      const dayEvents = eventsForDate(key);
      const isSelected = key === selectedDateKey;
      const isToday = key === dateKey(new Date());
      const eventCount = dayEvents.length;
      const firstTitle = eventCount ? dayEvents[0].title : "";
      const countLabel = eventCount === 1 ? "1 event" : `${eventCount} events`;
      const ariaLabel = `${formatDate(date)}${eventCount ? `, ${countLabel}` : ", no events"}`;

      cells.push(`
        <button
          class="events-month__day${eventCount ? " has-events" : ""}${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}"
          type="button"
          data-calendar-date="${escapeAttr(key)}"
          aria-label="${escapeAttr(ariaLabel)}"
          aria-pressed="${isSelected ? "true" : "false"}"
        >
          <span class="events-month__day-number">${day}</span>
          ${eventCount ? `<span class="events-month__event-title">${escapeHtml(firstTitle)}</span>` : '<span class="events-month__event-title is-empty">No events</span>'}
          ${eventCount ? `<span class="events-month__event-count">${escapeHtml(countLabel)}</span>` : ""}
        </button>
      `);
    }

    const totalCells = firstWeekday + daysInMonth;
    const trailingCells = (7 - (totalCells % 7)) % 7;

    for (let index = 0; index < trailingCells; index += 1) {
      cells.push('<div class="events-month__blank" aria-hidden="true"></div>');
    }

    calendarNodes.grid.innerHTML = cells.join("");
    renderSelectedDate();
  }

  function renderSelectedDate() {
    if (!calendarNodes) return;

    const selectedDate = dateFromKey(selectedDateKey);
    const selectedEvents = eventsForDate(selectedDateKey);

    calendarNodes.selectedTitle.textContent = selectedDate
      ? selectedDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        })
      : "Selected date";

    calendarNodes.selectedCount.textContent = `${selectedEvents.length} ${selectedEvents.length === 1 ? "event" : "events"}`;
    calendarNodes.selectedEvents.innerHTML = "";

    if (!selectedEvents.length) {
      renderEmptyState(calendarNodes.selectedEvents, "No events are currently scheduled for this date.");
      return;
    }

    selectedEvents.forEach(event => {
      calendarNodes.selectedEvents.appendChild(createEventCard(event));
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

  function installRuntimeStyles() {
    if (document.getElementById("events-runtime-fixes")) return;

    const style = document.createElement("style");
    style.id = "events-runtime-fixes";
    style.textContent = `
      body.events-page .event-card__desc {
        display: block !important;
        max-height: none !important;
        overflow: visible !important;
        white-space: normal !important;
        -webkit-line-clamp: unset !important;
        line-clamp: unset !important;
      }

      body.events-page .badge.badge--cover {
        color: #ffffff !important;
        background: linear-gradient(135deg, #6d28d9 0%, #a855f7 58%, #d946ef 100%) !important;
        border: 1px solid rgba(233, 213, 255, 0.82) !important;
        box-shadow: 0 8px 26px rgba(147, 51, 234, 0.42) !important;
      }
    `;

    document.head.appendChild(style);
  }

  function containsCoverCharge(description) {
    const text = String(description || "").toLowerCase();

    if (!text) return false;

    if (
      /\bno\s+(?:cover|cover charge|admission|admission fee)\b/i.test(text) ||
      /\bfree\s+admission\b/i.test(text) ||
      /\bno\s+suggested\s+donation\b/i.test(text)
    ) {
      return false;
    }

    return (
      /\bcover\s+(?:charge|fee)\b/i.test(text) ||
      /\bsuggested\s+(?:donation|cover)\b/i.test(text) ||
      /\bdonation(?:s)?\s+(?:suggested|appreciated|requested)\b/i.test(text) ||
      /\$\s*\d+(?:\.\d{1,2})?\s*(?:cover|admission)\b/i.test(text) ||
      /\b(?:cover|admission)\s*(?::|-|is)?\s*\$?\s*\d+(?:\.\d{1,2})?\b/i.test(text)
    );
  }

  function deriveType(title, description, categories) {
    const text = [title, description, ...(categories || [])]
      .join(" ")
      .toLowerCase();

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
        "live music",
        "live band",
        "reggae",
        "rock",
        "funk",
        "acoustic",
        "always free",
        "spectacles",
        "freaky tiki",
        "tonic oasis",
        "punacat",
        "kanaka fyah",
        "positive motion",
        "average joes",
        "hayden james",
        "troubled in paradise",
        "chris murphy",
        "pepper",
        "dc lewis",
        "uncle charlie",
        "jazz"
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
