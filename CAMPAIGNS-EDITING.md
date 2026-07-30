# Koa's Lounge campaign editing

The homepage and Events-page campaign cards are generated from:

```text
assets/js/promotions-data.js
```

## Hide or show a campaign

Change:

```js
active: true
```

to:

```js
active: false
```

## Change a status

Examples:

```js
status: "Coming Soon"
status: "Now Booking"
status: "Friday + Saturday"
```

## Change a destination

Update the `href` value:

```js
href: "/game-nights.html"
```

## Dedicated pages

- `after-dark.html`
- `game-nights.html`
- `draft-parties.html`

The After Dark page uses `assets/js/after-dark-events.js` to look for relevant nightlife events from the existing Office 365 calendar endpoint.
