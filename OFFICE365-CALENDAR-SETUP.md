# Office 365 Calendar Setup for Koa's Lounge on Netlify

This build is configured for a **non-default** Microsoft 365 calendar.

## Use these environment variables in Netlify

Required:
- `MS_TENANT_ID`
- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- `MS_CALENDAR_OWNER=chris@sibel.org`

Recommended for this site:
- `MS_CALENDAR_NAME=Koas Lounge Events`

Optional:
- `MS_CALENDAR_ID`  
  Use this only if you want to hard-code the specific calendar ID. If `MS_CALENDAR_ID` is omitted, the function will look up the calendar automatically by `MS_CALENDAR_NAME`.
- `MS_LOOKAHEAD_DAYS=90`

## Recommended Microsoft Graph permissions

For a server-to-server Netlify Function, use an Entra app registration with:
- **Application permission:** `Calendars.Read`

Then grant **admin consent**.

## Why this version is better

Because "Koas Lounge Events" is not the default calendar, this function first lists calendars for:

- `chris@sibel.org`

Then it finds the calendar with name:

- `Koas Lounge Events`

Then it calls `calendarView` on that calendar.

This means you do **not** need to manually retrieve and store the calendar ID just to get started.

## Expected Netlify function route

- `/.netlify/functions/office365-events`

## Expected response shape

```json
{
  "source": {
    "owner": "chris@sibel.org",
    "calendarName": "Koas Lounge Events",
    "calendarId": "resolved-at-runtime"
  },
  "count": 12,
  "events": [
    {
      "title": "Karaoke Night",
      "start": "2026-04-23T18:00:00.0000000",
      "end": "2026-04-23T22:00:00.0000000",
      "location": "Koa's Lounge",
      "description": "Weekly karaoke.",
      "url": "https://outlook.office.com/calendar/item/...",
      "categories": []
    }
  ]
}
```

## Deployment notes

1. Add the files from this package to your repo.
2. In Netlify, set the environment variables above.
3. Deploy the site.
4. Visit the Events page.
5. If the function cannot find the calendar by name, it will return a list of available calendars to help identify the exact name or ID.

## Important privacy note

Only put public-safe event details in the "Koas Lounge Events" calendar, since the website will display what this calendar contains.
