(function () {
  "use strict";

  window.KOA_PROMOTIONS = {
    heading: {
      eyebrow: "What is next at Koa's",
      title: "More reasons to meet at Koa's.",
      copy: "New experiences are taking shape at the lounge—from game-night competition to private draft parties and a bigger After Dark identity."
    },
    items: [
      {
        id: "game-nights",
        active: true,
        status: "Coming Soon",
        statusTone: "soon",
        eyebrow: "Koa's Game Nights",
        title: "Mario Kart tournaments and game nights",
        description: "Nintendo Switch racing, friendly competition, music, and the kind of bragging rights that last until the next rematch.",
        meta: ["Nintendo Switch", "Tournament format", "Group-friendly"],
        ctaLabel: "Get Game Night Updates",
        href: "/game-nights.html",
        theme: "race",
        imageKey: "promoGameNights"
      },
      {
        id: "draft-parties",
        active: true,
        status: "Now Booking",
        statusTone: "booking",
        eyebrow: "Fantasy Football",
        title: "Give your league a better draft room",
        description: "Bring the rivalry, your draft board, and the whole league. We will help you plan a draft party built around your group.",
        meta: ["Group seating", "Display requests", "Custom planning"],
        ctaLabel: "Request a Draft Party",
        href: "/draft-parties.html",
        theme: "field",
        imageKey: "promoDraftParties"
      },
      {
        id: "after-dark",
        active: true,
        status: "Friday + Saturday",
        statusTone: "live",
        eyebrow: "Koa's After Dark",
        title: "The lights go low. The energy goes up.",
        description: "DJs, live performers, crafted cocktails, and the weekend identity people learn to plan around.",
        meta: ["Nightlife", "Music", "Late-night energy"],
        ctaLabel: "Enter After Dark",
        href: "/after-dark.html",
        theme: "night",
        imageKey: "promoAfterDark"
      }
    ],
    hashtag: {
      eyebrow: "The phrase for a Koa's night",
      title: "Great nights deserve a meeting place.",
      tag: "#MeetMeAtKoas",
      copy: "Use it on the group chat, the flyer, the photo, and the post. The goal is simple: when people make plans, Koa's is already part of the thought."
    }
  };
})();
