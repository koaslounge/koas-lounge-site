document.addEventListener("DOMContentLoaded", () => {
  const endpoint = "/.netlify/functions/office365-events";

  const statusNode = document.querySelector("[data-home-events-status]");
  const sourceNode = document.querySelector("[data-home-events-source]");
  const gridNode = document.querySelector("[data-home-events-grid]");

  if (!statusNode || !gridNode) return;

  loadHomeEvents();

  async function loadHomeEvents() {
    try {
      statusNode.textContent = "Loading tonight’s lineup...";

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

      const featured = selectHomeEvents(events);

      if (sourceNode) {
        sourceNode.textContent = payload?.source?.calendarName
          ? `Source: ${payload.source.calendarName}`
          : "Source: Office 365";
      }

      renderHomeEvents(featured);

      statusNode.textContent = featured.length
        ? "Live lineup loaded."
        : "No upcoming events are listed right now.";
    } catch (error) {
      statusNode.textContent = "Unable to load tonight’s lineup.";
      if (sourceNode) sourceNode.textContent = error.message || "Unknown error";
      gridNode.innerHTML = `<div class="home-tonight__empty">Please check back shortly for the latest events.</div>`;
    }
  }

  function normalizeEvent(event) {
    if (!event || !event.start) return null;

    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : null;

    if (Number.isNaN(startDate.getTime())) return null;

    return {
      title: event.title || "Untitled Event",
      location: event.location || "",
      description: event.description || "",
      url: event.url || "",
      startDate,
      endDate,
      type: deriveType(event.title || "", event.description || "", event.categories || [])
    };
  }

  function selectHomeEvents(events) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const tonight = events.filter(e => e.startDate >= todayStart && e.startDate < tomorrowStart);
    if (tonight.length) return tonight.slice(0, 3);

    return events.slice(0, 3);
  }

  function renderHomeEvents(events) {
    if (!events.length) {
      gridNode.innerHTML = `<div class="home-tonight__empty">No upcoming events are scheduled right now.</div>`;
      return;
    }

    gridNode.innerHTML = "";

    events.forEach((event, index) => {
      const card = document.createElement("article");
      card.className = "home-tonight__card" + (index === 0 ? " home-tonight__card--featured" : "");

      card.innerHTML = `
        <div class="home-tonight__badge">${escapeHtml(getTypeLabel(event.type))}</div>
        <div class="home-tonight__card-title">${escapeHtml(event.title)}</div>
        <div class="home-tonight__meta">
          <div>${escapeHtml(formatDate(event.startDate))}</div>
          <div>${escapeHtml(formatTimeRange(event.startDate, event.endDate))}</div>
          ${event.location ? `<div>${escapeHtml(event.location)}</div>` : ""}
        </div>
        ${event.url ? `<a class="home-tonight__link" href="${escapeHtml(event.url)}" target="_blank" rel="noopener">View Details</a>` : ""}
      `;

      gridNode.appendChild(card);
    });
  }

  function deriveType(title, description, categories) {
    const text = [title, description, ...(categories || [])].join(" ").toLowerCase();
    if (text.includes("karaoke")) return "karaoke";
    if (text.includes("dj") || text.includes("edm") || text.includes("house") || text.includes("bass")) return "dj";
    if (text.includes("brunch")) return "brunch";
    if (text.includes("jam")) return "jam";
    if (text.includes("soul magic")) return "vinyl";
    if (text.includes("trivia")) return "trivia";
    if (text.includes("band") || text.includes("live music") || text.includes("reggae") || text.includes("funk")) return "live music";
    return "special event";
  }

  function getTypeLabel(type) {
    switch (type) {
      case "karaoke": return "Karaoke";
      case "dj": return "DJ Night";
      case "brunch": return "Brunch";
      case "jam": return "Jam Session";
      case "trivia": return "Trivia";
      case "vinyl": return "Vinyl Night";
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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
});