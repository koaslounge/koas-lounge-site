window.BUSINESS_CONFIG = {
  timezone: "Pacific/Honolulu",
  phone: "(808) 965-6644",
  email: "info@koaslounge.com",
  address: {
    line1: "15-2929 Pahoa Village Rd",
    line2: "Pāhoa, HI 96778"
  },

  // Regular weekly hours.
  hours: [
    {
      days: [0],
      label: "Sunday",
      open: null,
      close: null,
      display: "Closed except 4th & 5th Sundays",
      statusDetail: "Closed today · Open 4th Sunday 3 PM–8 PM and 5th Sunday 2 PM–6 PM"
    },
    { days: [1], label: "Monday", open: null, close: null, display: "Closed" },
    { days: [2, 3, 4], label: "Tuesday–Thursday", open: "17:00", close: "22:00", display: "5 PM – 10 PM" },
    { days: [5, 6], label: "Friday–Saturday", open: "17:00", close: "24:00", display: "5 PM – 12 AM" }
  ],

  // These recurring event hours override the normal Sunday closure.
  recurringHours: [
    {
      day: 0,
      occurrence: 4,
      label: "4th Sunday · Pool Tournament",
      eventName: "Monthly Pool Tournament",
      open: "15:00",
      close: "20:00",
      display: "3 PM – 8 PM"
    },
    {
      day: 0,
      occurrence: 5,
      label: "5th Sunday · Social Brunch",
      eventName: "Social Brunch",
      open: "14:00",
      close: "18:00",
      display: "2 PM – 6 PM"
    }
  ]
};
