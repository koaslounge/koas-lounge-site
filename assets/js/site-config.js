window.SITE_CONFIG = {
  images: {
    logo: "assets/images/logo.png",

    homeHero: "assets/images/hero-bar.jpg",
    homeStory: "assets/images/main-room.jpg",
    homeEvents: "assets/images/live-music.jpg",

    aboutHero: "assets/images/night-exterior.jpg",
    aboutStory: "assets/images/patio-day.jpg",
    aboutIntroImage: "assets/images/main-room.jpg",
    aboutDetailImage: "assets/images/berry-cocktail.jpg",

    eventsHero: "assets/images/live-music.jpg",
    menuHero: "assets/images/tall-cocktail.jpg",
    contactHero: "assets/images/night-exterior.jpg",

    galleryOne: "assets/images/berry-cocktail.jpg",
    galleryTwo: "assets/images/citrus-cocktail.jpg",
    galleryThree: "assets/images/pool-table.jpg"
  },

  business: {
    timezone: "Pacific/Honolulu",
    addressLines: ["15-2929 Pahoa Village Rd", "Pāhoa, HI 96778"],
    phoneDisplay: "(808) 965-6644",
    phoneHref: "tel:+18089656644",
    email: "info@koaslounge.com",
    social: {
      instagram: "https://www.instagram.com/koaslounge",
      facebook: "https://www.facebook.com/koaslounge/",
      yelp: "https://www.yelp.com/biz/koas-lounge-pahoa"
    },
    hours: [
      {
        label: "Sunday–Monday",
        days: ["sunday", "monday"],
        closed: true,
        display: "Closed"
      },
      {
        label: "Tuesday–Thursday",
        days: ["tuesday", "wednesday", "thursday"],
        closed: false,
        open: "17:00",
        close: "22:00",
        display: "5 PM – 10 PM"
      },
      {
        label: "Friday–Saturday",
        days: ["friday", "saturday"],
        closed: false,
        open: "17:00",
        close: "24:00",
        display: "5 PM – 12 AM"
      }
    ]
  }
};
