exports.handler = async () => {
  try {
    const tenantId = process.env.MS_TENANT_ID;
    const clientId = process.env.MS_CLIENT_ID;
    const clientSecret = process.env.MS_CLIENT_SECRET;
    const calendarOwner = process.env.MS_CALENDAR_OWNER;
    const calendarName = process.env.MS_CALENDAR_NAME;
    const calendarIdFromEnv = process.env.MS_CALENDAR_ID;
    const lookAheadDays = Number.parseInt(process.env.MS_LOOKAHEAD_DAYS || "90", 10);

    const missing = [];
    if (!tenantId) missing.push("MS_TENANT_ID");
    if (!clientId) missing.push("MS_CLIENT_ID");
    if (!clientSecret) missing.push("MS_CLIENT_SECRET");
    if (!calendarOwner) missing.push("MS_CALENDAR_OWNER");

    if (missing.length) {
      return jsonResponse(500, {
        error: "Missing required environment variables",
        missing
      });
    }

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials"
        })
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return jsonResponse(500, {
        error: "Token request failed",
        details: tokenData
      });
    }

    const accessToken = tokenData.access_token;

    async function graphGet(url) {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'outlook.timezone="Pacific/Honolulu", outlook.body-content-type="text"'
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`Graph request failed: ${JSON.stringify(data)}`);
      }

      return data;
    }

    let calendarId = calendarIdFromEnv;

    if (!calendarId) {
      if (!calendarName) {
        return jsonResponse(500, {
          error: "Set either MS_CALENDAR_ID or MS_CALENDAR_NAME for a non-default calendar."
        });
      }

      const calendarsUrl =
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(calendarOwner)}/calendars` +
        `?$select=id,name,canEdit,canShare,isDefaultCalendar`;

      const calendarsData = await graphGet(calendarsUrl);
      const calendars = calendarsData.value || [];

      const target = calendars.find(
        calendar =>
          (calendar.name || "").trim().toLowerCase() ===
          calendarName.trim().toLowerCase()
      );

      if (!target) {
        return jsonResponse(404, {
          error: `Calendar named "${calendarName}" was not found for ${calendarOwner}.`,
          availableCalendars: calendars.map(calendar => ({
            name: calendar.name,
            id: calendar.id,
            isDefaultCalendar: calendar.isDefaultCalendar
          }))
        });
      }

      calendarId = target.id;
    }

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + (Number.isFinite(lookAheadDays) ? lookAheadDays : 90));

    const graphUrl =
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(calendarOwner)}` +
      `/calendars/${encodeURIComponent(calendarId)}/calendarView` +
      `?startDateTime=${encodeURIComponent(start.toISOString())}` +
      `&endDateTime=${encodeURIComponent(end.toISOString())}` +
      `&$select=subject,start,end,location,body,bodyPreview,webLink,isCancelled,categories` +
      `&$orderby=start/dateTime` +
      `&$top=200`;

    const graphData = await graphGet(graphUrl);

    const events = (graphData.value || [])
      .filter(event => !event.isCancelled)
      .map(event => ({
        title: event.subject || "Untitled Event",
        start: event.start?.dateTime || null,
        end: event.end?.dateTime || null,
        location: event.location?.displayName || "",
        description: getEventDescription(event),
        url: event.webLink || "",
        categories: Array.isArray(event.categories) ? event.categories : []
      }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=120"
      },
      body: JSON.stringify({
        source: {
          owner: calendarOwner,
          calendarName: calendarName || null,
          calendarId
        },
        count: events.length,
        events
      })
    };
  } catch (error) {
    return jsonResponse(500, {
      error: error.message || "Unexpected error"
    });
  }
};

function getEventDescription(event) {
  const bodyContent = event?.body?.content;

  if (typeof bodyContent === "string" && bodyContent.trim()) {
    if ((event.body.contentType || "").toLowerCase() === "html") {
      return htmlToPlainText(bodyContent);
    }

    return normalizeDescription(bodyContent);
  }

  return normalizeDescription(event?.bodyPreview || "");
}

function normalizeDescription(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlToPlainText(html) {
  return normalizeDescription(
    String(html || "")
      .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, "\n")
      .replace(/<\s*li\b[^>]*>/gi, "• ")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  );
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  };
}
