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


## Centralized business info
Business hours, address, phone, and email are now centralized in:

- `assets/js/site-config.js`

They render automatically into:
- the footer on every page
- the contact page
- the Open Now / Closed indicator

To update hours later, edit only the `business.hours` section in `assets/js/site-config.js`.
