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
      return jsonResponse(500, { error: "Missing Microsoft calendar configuration." });
    }

    const accessToken = await getAccessToken();

    const base =
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(calendarOwner)}` +
      `/calendars/${encodeURIComponent(calendarId)}` +
      `/events/${encodeURIComponent(eventId)}` +
      `/attachments/${encodeURIComponent(attachmentId)}`;

    const attachmentRes = await fetch(
      base + "?$select=id,name,contentType,size,contentBytes",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!attachmentRes.ok) {
      return jsonResponse(attachmentRes.status || 404, {
        error: "Unable to read event image."
      });
    }

    const attachment = await attachmentRes.json();
    const contentType = String(attachment?.contentType || "").toLowerCase();
    const name = String(attachment?.name || "");
    const isImage =
      contentType.startsWith("image/") ||
      /\.(?:png|jpe?g|gif|webp|heic|heif)$/i.test(name);

    if (!isImage) {
      return jsonResponse(415, { error: "Attachment is not an image." });
    }

    const maxBytes = 5 * 1024 * 1024;
    if (Number(attachment?.size || 0) > maxBytes) {
      return jsonResponse(413, { error: "Event image exceeds 5 MB." });
    }

    let bytes;

    if (typeof attachment?.contentBytes === "string" && attachment.contentBytes) {
      bytes = Buffer.from(attachment.contentBytes, "base64");
    } else {
      const rawRes = await fetch(base + "/$value", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!rawRes.ok) {
        return jsonResponse(rawRes.status || 404, {
          error: "Unable to download event image."
        });
      }

      bytes = Buffer.from(await rawRes.arrayBuffer());
    }

    if (bytes.length > maxBytes) {
      return jsonResponse(413, { error: "Event image exceeds 5 MB." });
    }

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": attachment?.contentType || "image/jpeg",
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
