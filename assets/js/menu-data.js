window.MENU_DATA = {
  hero: {
    eyebrow: "Cocktail Menu",
    title: "Island pours. After-dark energy.",
    lead: "Cocktails, martinis, beer, wine, and zero-proof favorites made for nights in Pāhoa."
  },

  featured: {
    eyebrow: "Featured pour",
    name: "Koa House Mai Tai",
    description: "Bright citrus, island sweetness, and a generous rum-forward finish.",
    price: "$15",
    note: "Top shelf"
  },

  categories: [
    {
      id: "signature-cocktails",
      navLabel: "Cocktails",
      title: "Signature Cocktails",
      subtitle: "Island-inspired house favorites",
      badge: "House favorites",
      items: [
        { name: "Pāhoa After Dark", description: "Dark rum, pineapple, lime, and island spice.", price: "$13", traits: ["Tropical", "Bold"], featured: true },
        { name: "Blue Lantern", description: "Vodka, citrus, blue curaçao, and a sparkling finish.", price: "$13", traits: ["Citrus", "Bright"] },
        { name: "Koa House Mai Tai", description: "Rum-forward, bright, tropical, and built for the room.", price: "$15", traits: ["Tropical", "Strong"], featured: true },
        { name: "Velvet Hibiscus", description: "Gin, hibiscus, lemon, and delicate floral notes.", price: "$13", traits: ["Floral", "Smooth"] }
      ]
    },
    {
      id: "martinis-classics",
      navLabel: "Martinis",
      title: "Martinis & Classics",
      subtitle: "Timeless favorites and polished pours",
      badge: "Guest favorites",
      items: [
        { name: "Espresso Martini", description: "Vodka, coffee liqueur, and espresso.", price: "$13", traits: ["Rich", "Smooth"] },
        { name: "Old Fashioned", description: "Bourbon, bitters, orange, and a measured touch of sweetness.", price: "$13", traits: ["Classic", "Strong"] },
        { name: "House Margarita", description: "Tequila, lime, and orange liqueur.", price: "$13", traits: ["Citrus", "Tart"] },
        { name: "Negroni", description: "Gin, Campari, and sweet vermouth.", price: "$13", traits: ["Bitter", "Classic"] }
      ]
    },
    {
      id: "core-pricing",
      navLabel: "Pricing",
      title: "Core Cocktail Pricing",
      subtitle: "Choose your pour level",
      badge: "Easy ordering",
      items: [
        { name: "Well Cocktails", description: "House spirits and core mixed drinks.", price: "$8", traits: ["Base tier"] },
        { name: "Call Cocktails", description: "Mid-tier spirits, signatures, and upgraded pours.", price: "$13", traits: ["Call tier"] },
        { name: "Top Shelf Cocktails", description: "Premium base spirits and featured builds.", price: "$15", traits: ["Premium"] },
        { name: "Double Shot Upcharge", description: "Added to the selected cocktail tier.", price: "+50%", traits: ["Upgrade"] }
      ]
    },
    {
      id: "beer-wine",
      navLabel: "Beer & Wine",
      title: "Beer & Wine",
      subtitle: "Easygoing pours for every kind of night",
      badge: "Rotating selection",
      items: [
        { name: "Domestic Beer", description: "Rotating bottles and cans.", price: "$5–7", traits: ["Cold", "Classic"] },
        { name: "Local & Craft Beer", description: "Ask about current Hawaiʻi and craft selections.", price: "$7–9", traits: ["Local", "Rotating"] },
        { name: "Wine by the Glass", description: "Red, white, rosé, and sparkling selections.", price: "$8–12", traits: ["Glass"] },
        { name: "Sparkling & Celebratory", description: "Ask your bartender about current sparkling options.", price: "Market", traits: ["Bubbles"] }
      ]
    },
    {
      id: "zero-proof",
      navLabel: "Zero-Proof",
      title: "Zero-Proof",
      subtitle: "Full flavor without the alcohol",
      badge: "Everyone welcome",
      items: [
        { name: "House Refresher", description: "Seasonal citrus, soda, and fresh garnish.", price: "$8", traits: ["Fresh", "Citrus"] },
        { name: "Tropical Zero-Proof", description: "Pineapple, lime, and island-inspired flavors.", price: "$9", traits: ["Tropical", "Bright"] },
        { name: "Bartender's Zero-Proof Choice", description: "Tell us what you like and we'll build something for you.", price: "$10", traits: ["Custom"] }
      ]
    }
  ]
};
