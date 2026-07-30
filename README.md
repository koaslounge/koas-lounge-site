# Koa's Lounge Netlify Site

## Quick launch
1. Upload this folder to Netlify.
2. Replace `REPLACE_WITH_YOUR_PUBLIC_CALENDAR_ID` in `events.html`.
3. Update phone, hours, and social links in `contact.html`.
4. Update menu sections in `menu.html` to match your live offerings.

## Notes
- Fonts load from Google Fonts.
- All images are local and already optimized for web.
- The visual direction is intentionally more editorial and luxury-lounge inspired.


## Menu editing
You can now update the full menu from one file:

- `assets/js/menu-data.js`

The menu page layout stays in `menu.html`, but the actual menu content is rendered from `menu-data.js`.

After editing `assets/js/menu-data.js`, commit and push normally:
```bash
git add .
git commit -m "Update menu"
git push
```


## Band booking form
Added pages:
- `band-booking.html`
- `band-booking-success.html`

This form uses Netlify Forms, so submissions can be captured directly in Netlify after deployment.

Required fields:
- Band Name
- Email
- Phone Number
- Primary Link

## Business hours
Edit `assets/js/business-config.js` to update hours site-wide. See `BUSINESS-HOURS.md`.

## Menu page layout refresh
The menu page now includes static fallback content plus JavaScript enhancement. This prevents blank or collapsed sections if a script loads slowly or fails. Menu content remains centralized in `assets/js/menu-data.js`.
