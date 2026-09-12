document.addEventListener("DOMContentLoaded", () => {
  const endpoint = "/.netlify/functions/office365-events";

  const statusNode = document.querySelector("[data-special-events-status]");
  const featuredNode = document.querySelector("[data-special-events-featured]");
  const gridNode = document.querySelector("[data-special-events-grid]");
  const emptyNode = document.querySelector("[data-special-events-empty]");
  const countNode = document.querySelector("[data-special-event-count]");

  if (!statusNode || !featuredNode || !gridNode || !emptyNode) return;

  loadEvents();

  async function loadEvents() {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load ticketed events.");
      }

      const events = (Array.isArray(payload.events) ? payload.events : [])
        .map(normalizeEvent)
        .filter(Boolean)
        .filter(event => event.startDate >= startOfToday())
        .filter(isTicketedSpecialEvent)
        .sort((a, b) => a.startDate - b.startDate);

      renderEvents(events);

      statusNode.textContent = events.length
        ? "Live from the Koa's Lounge events calendar."
        : "";
    } catch (error) {
      statusNode.textContent = "Ticketed events could not be loaded right now.";
      if (countNode) countNode.textContent = "Unavailable";
      featuredNode.innerHTML = "";
      gridNode.innerHTML = "";
      emptyNode.hidden = false;
    }
  }

  function normalizeEvent(event) {
    if (!event || !event.start) return null;

    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : null;

    if (Number.isNaN(startDate.getTime())) return null;

    const description = String(event.description || "");
    const categories = Array.isArray(event.categories) ? event.categories : [];
    const metadata = parseMetadata(description);

    return {
      title: event.title || "Special Event",
      description,
      cleanDescription: cleanDescription(description),
      categories,
      location: event.location || "Koa's Lounge",
      startDate,
      endDate,
      paymentUrl: metadata.paymentUrl,
      imageUrl: metadata.imageUrl || event.imageUrl || "",
      price: metadata.price,
      capacity: metadata.capacity,
      ages: metadata.ages,
      includes: metadata.includes,
      registrationCloses: metadata.registrationCloses
    };
  }

  function isTicketedSpecialEvent(event) {
    const categoryText = event.categories.join(" ").toLowerCase();

    const explicitCategory =
      /\bpaid event\b/.test(categoryText) ||
      /\bticketed event\b/.test(categoryText) ||
      /\bpaid special event\b/.test(categoryText);

    const explicitMarker =
      /\[(?:paid|ticketed)\s+event\]/i.test(event.description) ||
      /\bpaid\s+admission\b/i.test(event.description) ||
      /\badmission\s+(?:fee|price|is|of|:)\s*\$?\d/i.test(event.description) ||
      /\bticket(?:s| price| fee)\s*(?:are|is|:|of)?\s*\$?\d/i.test(event.description);

    return explicitCategory || explicitMarker;
  }

  function parseMetadata(description) {
    return {
      paymentUrl:
        lineValue(
          description,
          [
            "Payment Link",
            "Payment URL",
            "Tickets",
            "Ticket Link",
            "Register",
            "Registration Link",
            "Sign Up",
            "Signup",
            "Sign-up"
          ],
          true
        ) || firstLikelyPaymentUrl(description),

      imageUrl: normalizeImageUrl(
        lineValue(description, ["Image", "Image URL", "Event Image", "Flyer"])
      ),

      price: extractPrice(description),
      capacity: lineValue(description, ["Capacity", "Seats", "Spots"]),
      ages: lineValue(description, ["Ages", "Age"]),
      includes: lineValue(description, ["Includes", "Included"]),
      registrationCloses: lineValue(description, [
        "Registration Closes",
        "Sales End",
        "Ticket Sales End"
      ])
    };
  }

  function lineValue(text, labels, requireUrl = false) {
    const lines = String(text || "").split(/\r?\n/);

    for (const line of lines) {
      for (const label of labels) {
        const pattern = new RegExp(
          "^\\s*" + escapeRegExp(label) + "\\s*:\\s*(.+?)\\s*$",
          "i"
        );

        const match = line.match(pattern);

        if (!match) continue;

        const value = match[1].trim();

        if (requireUrl) {
          const url = value.match(/https?:\/\/[^\s<>"']+/i);
          return url ? stripTrailingPunctuation(url[0]) : "";
        }

        return value;
      }
    }

    return "";
  }

  function normalizeImageUrl(value) {
    const image = stripTrailingPunctuation(String(value || "").trim());

    if (!image) return "";

    if (/^https?:\/\//i.test(image)) {
      return image;
    }

    if (/^\/assets\//i.test(image)) {
      return image;
    }

    if (/^(?:\.\/)?assets\//i.test(image)) {
      return "/" + image.replace(/^\.\//, "");
    }

    return "";
  }

  function firstLikelyPaymentUrl(description) {
    const urls = String(description || "").match(/https?:\/\/[^\s<>"']+/gi) || [];

    return (
      urls
        .map(stripTrailingPunctuation)
        .find(url =>
          /stripe\.com|buy\.stripe\.com|eventbrite\.com|square\.link|squareup\.com|paypal\.com/i.test(
            url
          )
        ) || ""
    );
  }

  function extractPrice(description) {
    const text = String(description || "");

    const patterns = [
      /(?:ticket(?: price)?|admission(?: fee| price)?|price)\s*(?:is|:|of|-)?\s*(\$\s*\d+(?:\.\d{1,2})?)/i,
      /\bpaid\s+admission(?:\s+of)?\s*(\$\s*\d+(?:\.\d{1,2})?)/i,
      /(\$\s*\d+(?:\.\d{1,2})?)\s*(?:per\s+person|per\s+guest|admission|ticket)\b/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].replace(/\s+/g, "");
    }

    return "";
  }

  function cleanDescription(description) {
    description = String(description || "").replace(/\[cid:[^\]]+\]\s*/gi, "");

    const labels = [
      "Payment Link",
      "Payment URL",
      "Tickets",
      "Ticket Link",
      "Register",
      "Registration Link",
      "Sign Up",
      "Signup",
      "Sign-up",
      "Image",
      "Image URL",
      "Event Image",
      "Flyer",
      "Ticket Price",
      "Admission",
      "Admission Fee",
      "Price",
      "Capacity",
      "Seats",
      "Spots",
      "Ages",
      "Age",
      "Includes",
      "Included",
      "Registration Closes",
      "Sales End",
      "Ticket Sales End"
    ];

    const cleaned = String(description || "")
      .split(/\r?\n/)
      .filter(line => {
        const trimmed = line.trim();

        if (!trimmed) return true;
        if (/^\[(?:paid|ticketed)\s+event\]$/i.test(trimmed)) return false;
        if (/^details\s*:?\s*$/i.test(trimmed)) return false;

        return !labels.some(label =>
          new RegExp("^\\s*" + escapeRegExp(label) + "\\s*:", "i").test(trimmed)
        );
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    /* Outlook descriptions often use "Details: ..." on the same line. */
    return cleaned.replace(/^details\s*:\s*/i, "").trim();
  }

  function renderEvents(events) {
    featuredNode.innerHTML = "";
    gridNode.innerHTML = "";

    if (countNode) {
      countNode.textContent = `${events.length} ${events.length === 1 ? "event" : "events"}`;
    }

    if (!events.length) {
      emptyNode.hidden = false;
      return;
    }

    emptyNode.hidden = true;

    events.forEach((event, index) => {
      const target = index === 0 ? featuredNode : gridNode;
      target.appendChild(createEventCard(event, true));
    });
  }

  function createEventCard(event, featured) {
    const article = document.createElement("article");
    article.className = `ticketed-event${featured ? " ticketed-event--featured" : ""}`;

    const mediaMarkup = event.imageUrl
      ? `
        <div class="ticketed-event__media ticketed-event__media--event">
          <img src="${escapeAttr(event.imageUrl)}" alt="${escapeAttr(event.title)} event artwork">
        </div>
      `
      : `
        <div class="ticketed-event__media ticketed-event__media--fallback">
          <img class="ticketed-event__fallback-mark" src="/assets/images/logo.png" alt="">
        </div>
      `;

    const metaItems = [
      ["Time", formatTimeRange(event.startDate, event.endDate)],
      ["Location", event.location],
      event.capacity ? ["Capacity", event.capacity] : null,
      event.ages ? ["Ages", event.ages] : null,
      event.includes ? ["Includes", event.includes] : null,
      event.registrationCloses ? ["Sales End", event.registrationCloses] : null
    ].filter(Boolean);

    article.innerHTML = `
      ${mediaMarkup}

      <div class="ticketed-event__body">
        <div class="ticketed-event__topline">
          <span class="ticketed-event__badge">Ticketed Event</span>
          <span class="ticketed-event__date">${escapeHtml(formatDate(event.startDate))}</span>
        </div>

        <h3>${escapeHtml(event.title)}</h3>

        ${
          event.cleanDescription
            ? `<div class="ticketed-event__description">${formatDescription(
                event.cleanDescription
              )}</div>`
            : ""
        }

        <div class="ticketed-event__meta">
          ${metaItems
            .map(
              ([label, value]) => `
                <div class="ticketed-event__meta-item">
                  <span class="ticketed-event__meta-label">${escapeHtml(label)}</span>
                  <span class="ticketed-event__meta-value">${escapeHtml(value)}</span>
                </div>
              `
            )
            .join("")}
        </div>

        <div class="ticketed-event__footer">
          <div>
            <div class="ticketed-event__price">${escapeHtml(event.price || "Paid Event")}</div>
            <span class="ticketed-event__price-note">${
              event.price ? "Ticket price" : "Advance registration"
            }</span>
          </div>

          ${
            event.paymentUrl
              ? `<a class="ticketed-event__cta" href="${escapeAttr(
                  event.paymentUrl
                )}" target="_blank" rel="noopener">Reserve &amp; Pay</a>`
              : `<span class="ticketed-event__pending">Online payment link coming soon</span>`
          }
        </div>
      </div>
    `;

    return article;
  }

  function formatDescription(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatTimeRange(startDate, endDate) {
    const start = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });

    if (!endDate || Number.isNaN(endDate.getTime())) return start;

    const end = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });

    return `${start} – ${end}`;
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function stripTrailingPunctuation(url) {
    return String(url || "").replace(/[),.;!?]+$/g, "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
});
