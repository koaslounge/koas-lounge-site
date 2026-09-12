"use strict";

exports.handler = async event => {
  try {
    const eventId = event?.queryStringParameters?.eventId || "";
    const attachmentId = event?.queryStringParameters?.attachmentId || "";

    if (!eventId || !attachmentId) {
      return jsonResponse(400, { error: "eventId and attachmentId are required." });
    }

    const tenantId = process.env.MS_TENANT_ID;
    const clientId = process.env.MS_CLIENT_ID;
    const clientSecret = process.env.MS_CLIENT_SECRET;
    const calendarOwner = process.env.MS_CALENDAR_OWNER;

    if (!tenantId || !clientId || !clientSecret || !calendarOwner) {
      return jsonResponse(500, { error: "Missing Microsoft calendar configuration." });
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
      return jsonResponse(500, { error: "Microsoft token request failed." });
    }

    const base =
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(calendarOwner)}` +
      `/events/${encodeURIComponent(eventId)}/attachments/${encodeURIComponent(attachmentId)}`;

    const metadataRes = await fetch(base + "?$select=id,name,contentType,size", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const metadata = await metadataRes.json();

    if (!metadataRes.ok) {
      return jsonResponse(metadataRes.status || 404, { error: "Unable to read event image." });
    }

    const contentType = String(metadata?.contentType || "").toLowerCase();
    const name = String(metadata?.name || "");
    const isImage = contentType.startsWith("image/") || /\.(?:png|jpe?g|gif|webp|heic|heif)$/i.test(name);

    if (!isImage) {
      return jsonResponse(415, { error: "Attachment is not an image." });
    }

    const maxBytes = 5 * 1024 * 1024;
    if (Number(metadata?.size || 0) > maxBytes) {
      return jsonResponse(413, { error: "Event image exceeds 5 MB." });
    }

    const contentRes = await fetch(base + "/$value", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!contentRes.ok) {
      return jsonResponse(contentRes.status || 404, { error: "Unable to download event image." });
    }

    const bytes = Buffer.from(await contentRes.arrayBuffer());
    if (bytes.length > maxBytes) {
      return jsonResponse(413, { error: "Event image exceeds 5 MB." });
    }

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": metadata?.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=3600, s-maxage=86400"
      },
      body: bytes.toString("base64")
    };
  } catch (error) {
    return jsonResponse(500, { error: error.message || "Unable to load event image." });
  }
};

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    body: JSON.stringify(payload)
  };
}
