# Central Image Config

Change site images in one file:

`assets/js/site-config.js`

## How to swap an image
1. Add a new file into `assets/images/`
2. Open `assets/js/site-config.js`
3. Change the path for the image key you want

Example:
```js
homeHero: "assets/images/new-hero.jpg"
```

## Main image keys
- logo
- homeHero
- homeStory
- homeEvents
- aboutHero
- aboutStory
- eventsHero
- menuHero
- contactHero
- galleryOne
- galleryTwo
- galleryThree

You usually do not need to edit HTML anymore.
