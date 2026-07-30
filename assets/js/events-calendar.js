document.addEventListener("DOMContentLoaded", () => {
  const endpoint = "/.netlify/functions/office365-events";

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

      const events = (Array.isArray(payload.events) ? payload.events : [])
        .map(normalizeEvent)
        .filter(Boolean)
        .sort((a, b) => a.startDate - b.startDate);

      const grouped = groupEvents(events);

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

      updateSpotlight(events, grouped);

      statusNode.textContent = events.length
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

    return {
      title: event.title || "Untitled Event",
      description: event.description || "",
      location: event.location || "",
      url: event.url || "",
      categories: Array.isArray(event.categories) ? event.categories : [],
      startDate,
      endDate,
      type: deriveType(event.title || "", event.description || "", event.categories || []),
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

    events.slice(0, 8).forEach(event => {
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
            ${event.isHighValueNight ? '<span class="chip chip--featured">Prime Night</span>' : ""}
          </div>

          <div class="event-card__title">${escapeHtml(event.title)}</div>

          <div class="event-card__chips">
            <span class="chip">${escapeHtml(dateLabel)}</span>
          </div>
        </div>
      </div>

      ${event.description ? `<div class="event-card__desc">${escapeHtml(trimText(event.description, 180))}</div>` : ""}

      <div class="event-card__details">
        <div class="event-detail">
          <div class="event-detail__icon">⏰</div>
          <div>${escapeHtml(timeLabel)}</div>
        </div>
        ${event.location ? `
          <div class="event-detail">
            <div class="event-detail__icon">📍</div>
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

  function setCount(node, count) {
    if (!node) return;
    node.textContent = `${count} ${count === 1 ? "event" : "events"}`;
  }

  function deriveType(title, description, categories) {
    const text = [title, description, ...(categories || [])].join(" ").toLowerCase();

    if (text.includes("karaoke")) return "karaoke";
    if (text.includes("soul")) return "vinyl";
    if (text.includes("dj") || text.includes("edm") || text.includes("bass") || text.includes("house")) return "dj";
    if (text.includes("brunch") || text.includes("mimosa")) return "brunch";
    if (text.includes("jam") || text.includes("open band") || text.includes("cypher")) return "jam";
    if (text.includes("trivia")) return "trivia";
    if (
      text.includes("live music") ||
      text.includes("band") ||
      text.includes("reggae") ||
      text.includes("rock") ||
      text.includes("funk") ||
      text.includes("acoustic") ||
      text.includes("jazz")
    ) return "live music";

    return "special event";
  }

  function getTypeLabel(type) {
    switch (type) {
      case "karaoke": return "Karaoke";
      case "dj": return "DJ Night";
      case "brunch": return "Brunch";
      case "vinyl": return "Vinyl Night";
      case "jam": return "Jam Session";
      case "trivia": return "Trivia";
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

  function trimText(text, max) {
    if (!text || text.length <= max) return text;
    return text.slice(0, max - 1).trimEnd() + "…";
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