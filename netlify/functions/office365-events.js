exports.handler = async () => {
  try {
    const tenantId = process.env.MS_TENANT_ID;
    const clientId = process.env.MS_CLIENT_ID;
    const clientSecret = process.env.MS_CLIENT_SECRET;
    const calendarOwner = process.env.MS_CALENDAR_OWNER;
    const calendarName = process.env.MS_CALENDAR_NAME;
    const calendarIdFromEnv = process.env.MS_CALENDAR_ID;
    const lookAheadDays = parseInt(process.env.MS_LOOKAHEAD_DAYS || "90", 10);

    // 🔍 DEBUG BLOCK (temporary)
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        debug: true,
        hasTenant: !!tenantId,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasCalendarOwner: !!calendarOwner,
        hasCalendarName: !!calendarName,
        tenantIdTail: tenantId ? tenantId.slice(-6) : null,
        clientIdTail: clientId ? clientId.slice(-6) : null,
        secretLength: clientSecret ? clientSecret.length : 0
      })
    };

    // --- EVERYTHING BELOW WILL NOT RUN UNTIL DEBUG BLOCK IS REMOVED ---

    const missing = [];
    if (!tenantId) missing.push("MS_TENANT_ID");
    if (!clientId) missing.push("MS_CLIENT_ID");
    if (!clientSecret) missing.push("MS_CLIENT_SECRET");
    if (!calendarOwner) missing.push("MS_CALENDAR_OWNER");

    if (missing.length) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing required environment variables",
          missing
        })
      };
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
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Token request failed",
          details: tokenData
        })
      };
    }

    const accessToken = tokenData.access_token;

    async function graphGet(url) {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'outlook.timezone="Pacific/Honolulu"'
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
        return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Set either MS_CALENDAR_ID or MS_CALENDAR_NAME for a non-default calendar."
          })
        };
      }

      const calendarsUrl =
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(calendarOwner)}/calendars` +
        `?$select=id,name,isDefaultCalendar`;

      const calendarsData = await graphGet(calendarsUrl);
      const calendars = calendarsData.value || [];

      const target = calendars.find(
        c => (c.name || "").trim().toLowerCase() === calendarName.trim().toLowerCase()
      );

      if (!target) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: `Calendar "${calendarName}" not found`,
            availableCalendars: calendars.map(c => ({
              name: c.name,
              id: c.id
            }))
          })
        };
      }

      calendarId = target.id;
    }

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + lookAheadDays);

    const graphUrl =
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(calendarOwner)}` +
      `/calendars/${encodeURIComponent(calendarId)}/calendarView` +
      `?startDateTime=${encodeURIComponent(start.toISOString())}` +
      `&endDateTime=${encodeURIComponent(end.toISOString())}`;

    const graphData = await graphGet(graphUrl);

    return {
      statusCode: 200,
      body: JSON.stringify(graphData)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};