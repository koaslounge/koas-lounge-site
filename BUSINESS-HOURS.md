# Business Hours

Edit one file to change hours across the entire website:

`assets/js/business-config.js`

The shared footer, contact page, and live Open Now / Closed indicator all read from this file.

## Current schedule

- Sunday: Closed except recurring events below
- 4th Sunday: Monthly Pool Tournament, 3 PM–8 PM
- 5th Sunday: Social Brunch, 2 PM–6 PM
- Monday: Closed
- Tuesday–Thursday: 5 PM–10 PM
- Friday–Saturday: 5 PM–12 AM

The 4th- and 5th-Sunday rules override the normal Sunday closure automatically. The live status uses the `Pacific/Honolulu` time zone and refreshes every minute.
