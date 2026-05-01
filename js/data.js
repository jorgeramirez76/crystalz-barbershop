// CRYSTALZ DATA — single source of truth for the barbers + services.
// Edit here when prices change or new barbers join.

window.CRYSTALZ_DATA = {

  brand: {
    name: "Crystalz Barbershop",
    owner: "Leonardo Jaramillo",
    yearFounded: 2010,
    instagram: "https://www.instagram.com/crystalzusa/",
    booksyMain: "https://booksy.com/en-us/1097676_crystalz-barbershop_barber-shop_28871_roselle-park"
  },

  locations: {
    "roselle-park": {
      label: "Roselle Park (Flagship)",
      address: "13 W Westfield Ave, Roselle Park, NJ 07204",
      phone: "+19082591151",
      phoneDisplay: "(908) 259-1151"
    },
    "elizabeth": {
      label: "Elizabeth",
      address: "910 Elizabeth Ave, Elizabeth, NJ 07201",
      phone: "+19083516040",
      phoneDisplay: "(908) 351-6040"
    }
  },

  // The 6 confirmed barbers. Personal Booksy URL provided as fallback link.
  // Photo path resolves to /images/barbers/<filename>.jpeg
  barbers: [
    {
      id: "leo",
      name: "Leonardo Jaramillo",
      nick: "Leo · Owner",
      photo: "images/barbers/leo-placeholder.jpg",
      handle: "@crystalzusa",
      handleUrl: "https://www.instagram.com/crystalzusa/",
      bio: "Founder. Built Crystalz from one chair to two locations. Classic precision cuts, old-school discipline.",
      locations: ["roselle-park"],
      booksyUrl: "https://booksy.com/en-us/1097676_crystalz-barbershop_barber-shop_28871_roselle-park",
      badge: "Owner",
      priceCut: 40,
      priceCutBeard: 50
    },
    {
      id: "joel",
      name: "Joel Santamaria",
      nick: "Joel the Barber",
      photo: "images/barbers/joel.jpeg",
      handle: "@joelthebarberjs",
      handleUrl: "https://www.instagram.com/joelthebarberjs/",
      bio: "Most-followed barber in the shop with a 12K Instagram audience. Known shop-wide for fade precision and detailed designs.",
      locations: ["roselle-park"],
      booksyUrl: "https://booksy.com/en-us/440381_joel-the-barber_barber-shop_28871_roselle-park",
      badge: "12K · Most Booked",
      priceCut: 40,
      priceCutBeard: 50
    },
    {
      id: "mauricio",
      name: "Mauricio Santamaria",
      nick: "Montana",
      photo: "images/barbers/mauricio.jpeg",
      handle: "@montanabrbr",
      handleUrl: "https://www.instagram.com/montanabrbr/",
      bio: "Skin fade specialist. 5.0 rating across 85+ Booksy reviews. Sharp on lineups and shape-ups.",
      locations: ["roselle-park"],
      booksyUrl: "https://booksy.com/en-us/479130_montana-brbr_barber-shop_28871_roselle-park",
      badge: "5.0 ★",
      priceCut: 36,
      priceCutBeard: 45
    },
    {
      id: "chino91",
      name: "Uriel Santamaria",
      nick: "Chino91",
      photo: "images/barbers/chino91.jpeg",
      handle: "@chino91thebarber",
      handleUrl: "https://www.instagram.com/chino91thebarber/",
      bio: "Modern stylist. Offers a monthly membership — $120/mo unlimited cuts, $150/mo cuts + beard. Strong on classic-meets-trend looks.",
      locations: ["roselle-park"],
      booksyUrl: "https://booksy.com/en-us/482363_chino91thebarber_other_28871_roselle-park",
      badge: "Membership Available",
      priceCut: 35,
      priceCutBeard: 50
    },
    {
      id: "miguel-eliza",
      name: "Miguel Eliza",
      nick: "Miguel",
      photo: "images/barbers/miguel-eliza.jpeg",
      handle: null,
      handleUrl: null,
      bio: "Veteran barber on the Crystalz team. 4.9 rating across 225+ Booksy reviews. Strong with seniors, kids, and detailed regular cuts.",
      locations: ["roselle-park"],
      booksyUrl: "https://booksy.com/en-us/434096_miguel-eliza_barber-shop_28871_roselle-park",
      badge: "225+ Reviews",
      priceCut: 40,
      priceCutBeard: 50
    },
    {
      id: "miguel-po",
      name: "Miguel Po",
      nick: "Miguel · Elizabeth",
      photo: "images/barbers/placeholder.jpg",
      handle: null,
      handleUrl: null,
      bio: "Elizabeth location specialist. Long-standing regulars praise his work — \"client for 4 years and counting.\" Walk-ins welcome.",
      locations: ["elizabeth"],
      booksyUrl: "https://booksy.com/en-us/1097676_crystalz-barbershop_barber-shop_28871_roselle-park",
      badge: "Elizabeth",
      priceCut: 40,
      priceCutBeard: 50
    }
  ],

  services: [
    { id: "haircut",          icon: "✂",  name: "Haircut",                 priceLow: 35, priceHigh: 40, note: "Standard cut, no beard" },
    { id: "haircut-beard",    icon: "♛",  name: "Haircut + Beard",         priceLow: 45, priceHigh: 50, note: "Most popular service"  },
    { id: "skin-fade",        icon: "◐",  name: "Skin Fade",               priceLow: 40, priceHigh: 45, note: "Tight skin to taper"   },
    { id: "haircut-eyebrows", icon: "✦",  name: "Cut + Beard + Eyebrows",  priceLow: 50, priceHigh: 55, note: "The full reset"        },
    { id: "kids",             icon: "★",  name: "Kids Cut (under 12)",     priceLow: 30, priceHigh: 35, note: "Booster seat ready"    },
    { id: "senior",           icon: "✿",  name: "Senior (60+)",            priceLow: 25, priceHigh: 25, note: "Miguel Eliza only"     },
    { id: "lineup",           icon: "▬",  name: "Lineup / Shape-Up Only",  priceLow: 18, priceHigh: 25, note: "Detail edge"           },
    { id: "beard-only",       icon: "丨", name: "Beard Sculpt Only",        priceLow: 20, priceHigh: 25, note: "Beard work only"       },
    { id: "eyebrows",         icon: "‾",  name: "Eyebrows",                priceLow: 5,  priceHigh: 9,  note: "Quick add-on"          },
    { id: "design",           icon: "✺",  name: "Custom Design",           priceLow: 5,  priceHigh: 25, note: "Add to any cut"        }
  ]
};
