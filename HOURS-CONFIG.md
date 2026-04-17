# Business Hours Config

Edit this file to update hours site-wide:

`assets/js/site-config.js`

## Section to edit
Look for:

`business: { ... hours: [...] }`

## What updates automatically
- footer hours on every page
- contact page hours
- open now / closed indicator

## Current structure
Each hours entry uses:
- `label`
- `days`
- `closed`
- `display`
- `open` and `close` for open days

Example:
```js
{
  label: "Tuesday–Thursday",
  days: ["tuesday", "wednesday", "thursday"],
  closed: false,
  open: "17:00",
  close: "22:00",
  display: "5 PM – 10 PM"
}
```
