# Koa's Lounge Design System Guide

Edit `assets/css/styles.css` and start at the very top under:

`KOA'S LOUNGE DESIGN SYSTEM`

## Fastest controls

### Change fonts
Update these two variables:
- `--font-display`
- `--font-body`

### Change brand colors
Update:
- `--color-bg-900`
- `--color-bg-800`
- `--color-bg-700`
- `--color-aqua`
- `--color-teal`
- `--color-text-strong`

### Change the whole site's spacing
Update:
- `--section-space`
- `--section-space-compact`
- `--space-*`

### Change all rounded corners
Update:
- `--radius-sm`
- `--radius-md`
- `--radius-lg`
- `--radius-xl`

### Change shadows and depth
Update:
- `--shadow-sm`
- `--shadow-md`
- `--shadow-lg`
- `--shadow-accent`

## Theme swapping
There are example commented theme overrides in the CSS:
- `.theme-tropical`
- `.theme-nightlife`

You can turn one on by adding the class to `<body>` on any page.

## Recommended workflow
1. Change only variables first.
2. Refresh the site.
3. Only edit component rules if you want a one-off exception.

This keeps the design system centralized and easy to maintain.