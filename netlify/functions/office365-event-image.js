"use strict";

let cachedAccessToken = "";
let cachedAccessTokenExpiresAt = 0;

exports.handler = async event => {
  try {
    const calendarId = event?.queryStringParameters?.calendarId || "";
    const eventId = event?.queryStringParameters?.eventId || "";
    const attachmentId = event?.queryStringParameters?.attachmentId || "";

    if (!calendarId || !eventId || !attachmentId) {
      return jsonResponse(400, {
        error: "calendarId, eventId and attachmentId are required."
      });
    }

    const calendarOwner = process.env.MS_CALENDAR_OWNER;
    if (!calendarOwner) {
      return jsonResponse(500, {
        error: "Missing Microsoft calendar configuration."
      });
    }

    const accessToken = await getAccessToken();

    const base =
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(calendarOwner)}` +
      `/calendars/${encodeURIComponent(calendarId)}` +
      `/events/${encodeURIComponent(eventId)}` +
      `/attachments/${encodeURIComponent(attachmentId)}`;

    // Fetch only lightweight metadata first. Keeping contentBytes out of this
    // request avoids a large base64 JSON payload and is Microsoft's recommended
    // pattern before retrieving /$value.
    const metadataRes = await fetch(
      base + "?$select=id,name,contentType,size,isInline",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!metadataRes.ok) {
      return jsonResponse(metadataRes.status || 404, {
        error: "Unable to read event image metadata."
      });
    }

    const metadata = await metadataRes.json();
    const contentType = String(metadata?.contentType || "").toLowerCase();
    const name = String(metadata?.name || "").toLowerCase();

    const browserSafeImage =
      /^(?:image\/jpeg|image\/png|image\/webp|image\/gif)$/.test(contentType) ||
      /\.(?:png|jpe?g|gif|webp)$/i.test(name);

    if (!browserSafeImage) {
      return jsonResponse(415, {
        error: "Event attachment is not a browser-safe image. Use JPG, PNG, WebP, or GIF."
      });
    }

    // Keep below the practical synchronous-function payload ceiling once the
    // legacy function response is base64 encoded by Netlify.
    const maxBytes = 4 * 1024 * 1024;
    if (Number(metadata?.size || 0) > maxBytes) {
      return jsonResponse(413, {
        error: "Event image exceeds 4 MB. Please attach a web-optimized JPG or PNG."
      });
    }

    const contentRes = await fetch(base + "/$value", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!contentRes.ok) {
      return jsonResponse(contentRes.status || 404, {
        error: "Unable to download event image."
      });
    }

    const bytes = Buffer.from(await contentRes.arrayBuffer());

    if (bytes.length > maxBytes) {
      return jsonResponse(413, {
        error: "Event image exceeds 4 MB. Please attach a web-optimized JPG or PNG."
      });
    }

    const responseType =
      contentRes.headers.get("content-type") ||
      metadata?.contentType ||
      "image/jpeg";

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": responseType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "CDN-Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Netlify-CDN-Cache-Control": "public, durable, max-age=86400, stale-while-revalidate=604800"
      },
      body: bytes.toString("base64")
    };
  } catch (error) {
    return jsonResponse(500, {
      error: error.message || "Unable to load event image."
    });
  }
};

async function getAccessToken() {
  const now = Date.now();

  if (cachedAccessToken && now < cachedAccessTokenExpiresAt) {
    return cachedAccessToken;
  }

  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Missing Microsoft calendar authentication configuration.");
  }

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials"
      })
    }
  );

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error("Microsoft token request failed.");
  }

  const expiresInSeconds = Number(tokenData.expires_in || 3600);
  cachedAccessToken = tokenData.access_token;
  cachedAccessTokenExpiresAt =
    now + Math.max(60, expiresInSeconds - 120) * 1000;

  return cachedAccessToken;
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(payload)
  };
}
