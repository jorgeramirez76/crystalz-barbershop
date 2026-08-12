#!/usr/bin/env python3
"""Generate individual barber bio pages from js/data.js.

Each barber gets their own page at barbers/<id>.html with:
  - Hero portrait + name + nickname
  - IG handle (clickable)
  - Full bio
  - Their service price grid (uses their own rates)
  - Gallery of their work (placeholder until real shots provided)
  - Embedded booking form pre-targeted to this barber
  - Booksy direct-link backup
  - Footer

Run: python3 build_barber_pages.py
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
DATA_JS = ROOT / "js" / "data.js"
OUT_DIR = ROOT / "barbers"
OUT_DIR.mkdir(exist_ok=True)


BARBERS = [
    {"id": "leo", "name": "Leonardo Jaramillo", "nick": "Leo · Owner",
     "photo": "images/barbers/leo-placeholder.jpg",
     "handle": "@crystalzusa", "handleUrl": "https://www.instagram.com/crystalzusa/",
     "bio": "Founder. Built Crystalz from one chair to two locations. Classic precision cuts, old-school discipline.",
     "locations": ["roselle-park"],
     "booksyUrl": "https://booksy.com/en-us/1097676_crystalz-barbershop_barber-shop_28871_roselle-park",
     "badge": "Owner", "priceCut": 40, "priceCutBeard": 50},
    {"id": "joel", "name": "Joel Santamaria", "nick": "Joel the Barber",
     "photo": "images/barbers/joel.jpeg",
     "handle": "@joelthebarberjs", "handleUrl": "https://www.instagram.com/joelthebarberjs/",
     "bio": "Most-followed barber in the shop with a 12K Instagram audience. Known shop-wide for fade precision and detailed designs.",
     "locations": ["roselle-park"],
     "booksyUrl": "https://booksy.com/en-us/440381_joel-the-barber_barber-shop_28871_roselle-park",
     "badge": "12K · Most Booked", "priceCut": 40, "priceCutBeard": 50},
    {"id": "mauricio", "name": "Mauricio Santamaria", "nick": "Montana",
     "photo": "images/barbers/mauricio.jpeg",
     "handle": "@montanabrbr", "handleUrl": "https://www.instagram.com/montanabrbr/",
     "bio": "Skin fade specialist. 5.0 rating across 85+ Booksy reviews. Sharp on lineups and shape-ups.",
     "locations": ["roselle-park"],
     "booksyUrl": "https://booksy.com/en-us/479130_montana-brbr_barber-shop_28871_roselle-park",
     "badge": "5.0 ★", "priceCut": 36, "priceCutBeard": 45},
    {"id": "chino91", "name": "Uriel Santamaria", "nick": "Chino91",
     "photo": "images/barbers/chino91.jpeg",
     "handle": "@chino91thebarber", "handleUrl": "https://www.instagram.com/chino91thebarber/",
     "bio": "Modern stylist. Offers a monthly membership — $120/mo unlimited cuts, $150/mo cuts + beard. Strong on classic-meets-trend looks.",
     "locations": ["roselle-park"],
     "booksyUrl": "https://booksy.com/en-us/482363_chino91thebarber_other_28871_roselle-park",
     "badge": "Membership Available", "priceCut": 35, "priceCutBeard": 50},
    {"id": "miguel-eliza", "name": "Miguel Eliza", "nick": "Miguel",
     "photo": "images/barbers/miguel-eliza.jpeg",
     "handle": None, "handleUrl": None,
     "bio": "Veteran barber on the Crystalz team. 4.9 rating across 225+ Booksy reviews. Strong with seniors, kids, and detailed regular cuts.",
     "locations": ["roselle-park"],
     "booksyUrl": "https://booksy.com/en-us/434096_miguel-eliza_barber-shop_28871_roselle-park",
     "badge": "225+ Reviews", "priceCut": 40, "priceCutBeard": 50},
    {"id": "anibal", "name": "Anibal Barbero", "nick": "Anibal",
     "photo": "images/barbers/anibal.jpeg",
     "handle": None, "handleUrl": None,
     "bio": "Almost 10 years behind the chair. Perfect 5.0 rating across 45+ Booksy reviews — \"my go-to guy\" is what regulars say. Punctual and consistent.",
     "locations": ["roselle-park"],
     "booksyUrl": "https://booksy.com/en-us/854665_anibal-barbero_barber-shop_28871_roselle-park",
     "badge": "5.0 ★ · 45+ Reviews", "priceCut": 35, "priceCutBeard": 45},
    {"id": "miguel-po", "name": "Miguel Po", "nick": "Miguel · Elizabeth",
     "photo": "images/barbers/placeholder.jpg",
     "handle": None, "handleUrl": None,
     "bio": "Elizabeth location specialist. Long-standing regulars praise his work — \"client for 4 years and counting.\" Walk-ins welcome.",
     "locations": ["elizabeth"],
     "booksyUrl": "https://booksy.com/en-us/1097676_crystalz-barbershop_barber-shop_28871_roselle-park",
     "badge": "Elizabeth", "priceCut": 40, "priceCutBeard": 50},
]


def parse_data() -> dict:
    return {"barbers": BARBERS, "services": []}


def render_barber_page(b: dict, services: list) -> str:
    """Return the HTML for a single barber's bio page."""
    handle_block = (
        f'<a href="{b["handleUrl"]}" target="_blank" rel="noopener" class="barber-page-handle">{b["handle"]}</a>'
        if b.get("handle") else
        '<span class="barber-page-handle" style="opacity:0.5;">— Crystalz Family —</span>'
    )
    location_label = "Roselle Park" if "roselle-park" in b["locations"] else "Elizabeth"
    location_phone_display = "(908) 259-1151" if "roselle-park" in b["locations"] else "(908) 351-6040"
    location_phone_tel = "+19082591151" if "roselle-park" in b["locations"] else "+19083516040"
    location_address = "13 W Westfield Ave, Roselle Park, NJ 07204" if "roselle-park" in b["locations"] else "910 Elizabeth Ave, Elizabeth, NJ 07201"
    badge_html = f'<div class="barber-page-badge">{b["badge"]}</div>' if b.get("badge") else ""
    booksy_btn = f'<a href="{b["booksyUrl"]}" target="_blank" rel="noopener" class="btn btn-outline">Book on Booksy</a>'

    # Pick 3 gallery images for this barber's "their work" mini-gallery
    gallery_html = """
    <div class="barber-page-gallery">
      <div class="gallery-item"><img src="../images/gallery/01-joel-inspo.jpeg" alt="work sample"></div>
      <div class="gallery-item"><img src="../images/gallery/06-skin-fade.jpeg" alt="work sample"></div>
      <div class="gallery-item"><img src="../images/gallery/02-fade-detail.jpeg" alt="work sample"></div>
      <div class="gallery-item"><img src="../images/gallery/05-beard-work.jpeg" alt="work sample"></div>
    </div>
    """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{b["nick"]} — {b["name"]} | Crystalz Barbershop {location_label}</title>
  <meta name="description" content="Book {b["nick"]} at Crystalz Barbershop {location_label}. {b["bio"]}">
  <meta property="og:title" content="{b["nick"]} — Crystalz Barbershop {location_label}">
  <meta property="og:description" content="{b["bio"]}">
  <meta property="og:image" content="../{b["photo"]}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,500;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
  <link rel="icon" type="image/svg+xml" href="../assets/logo.svg">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "{b["name"]}",
    "alternateName": "{b["nick"]}",
    "jobTitle": "Barber",
    "worksFor": {{
      "@type": "HairSalon",
      "name": "Crystalz Barbershop",
      "address": {{
        "@type": "PostalAddress",
        "streetAddress": "{location_address.split(',')[0]}",
        "addressLocality": "{location_label}",
        "addressRegion": "NJ",
        "postalCode": "{location_address.split()[-2]}"
      }}
    }},
    "image": "../{b["photo"]}"
  }}
  </script>
</head>
<body>

<nav class="nav" id="nav">
  <a href="../index.html" class="nav-logo"><img src="../assets/logo.svg" alt="Crystalz"></a>
  <ul class="nav-links">
    <li><a href="../index.html#barbers">All Barbers</a></li>
    <li><a href="../index.html#services">Services</a></li>
    <li><a href="../index.html#gallery">Gallery</a></li>
    <li><a href="../index.html#locations">Locations</a></li>
  </ul>
  <a href="#" class="btn book-trigger" data-barber="{b["id"]}">Book Now</a>
  <button class="nav-toggle" id="navToggle" aria-label="Toggle nav">☰</button>
</nav>

<header class="barber-page-hero">
  <div class="barber-page-hero-bg"></div>
  <img class="barber-page-portrait" src="../{b["photo"]}" alt="{b["name"]}">
  <div class="barber-page-hero-content">
    <a href="../index.html#barbers" class="barber-page-back">← All Barbers</a>
    {badge_html}
    <h1 class="barber-page-name">{b["nick"]}</h1>
    <p class="barber-page-fullname">{b["name"]}</p>
    {handle_block}
    <p class="barber-page-bio">{b["bio"]}</p>
    <div class="barber-page-meta">
      <div><span>Location</span> {location_label}</div>
      <div><span>Address</span> {location_address}</div>
      <div><span>Phone</span> <a href="tel:{location_phone_tel}">{location_phone_display}</a></div>
    </div>
    <div class="barber-page-actions">
      <a href="#" class="btn book-trigger" data-barber="{b["id"]}">Book With {b["nick"].split(' ')[0]}</a>
      {booksy_btn}
    </div>
  </div>
</header>

<section class="barber-page-pricing">
  <div class="container">
    <p class="eyebrow">Pricing</p>
    <h2>{b["nick"].split(' ')[0]}'s Rates</h2>
    <div class="services-grid">
      <article class="service-card">
        <div class="service-icon">✂</div>
        <div class="service-name">Haircut</div>
        <div class="service-price">${b["priceCut"]}</div>
        <div class="service-note">Standard cut, no beard</div>
      </article>
      <article class="service-card">
        <div class="service-icon">♛</div>
        <div class="service-name">Cut + Beard</div>
        <div class="service-price">${b["priceCutBeard"]}</div>
        <div class="service-note">Most popular</div>
      </article>
      <article class="service-card">
        <div class="service-icon">▬</div>
        <div class="service-name">Lineup / Shape-Up</div>
        <div class="service-price">$18–$25</div>
        <div class="service-note">Detail edge</div>
      </article>
      <article class="service-card">
        <div class="service-icon">‾</div>
        <div class="service-name">Eyebrows</div>
        <div class="service-price">$5–$9</div>
        <div class="service-note">Quick add-on</div>
      </article>
    </div>
    <p style="text-align:center; margin-top:32px; color:var(--cream-dim); font-size:0.92rem;">
      For the full menu and any other services, see <a href="{b["booksyUrl"]}" target="_blank" rel="noopener" style="color:var(--gold);">Booksy</a>.
    </p>
  </div>
</section>

<section class="barber-page-gallery-section">
  <div class="container">
    <p class="eyebrow">Recent Work</p>
    <h2>{b["nick"].split(' ')[0]}'s Portfolio</h2>
    {gallery_html}
    <p style="text-align:center; margin-top:32px; color:var(--cream-dim); font-size:0.92rem;">
      {f'Follow <a href="{b["handleUrl"]}" target="_blank" rel="noopener" style="color:var(--gold);">{b["handle"]}</a> on Instagram for the latest cuts.' if b.get("handle") else 'Follow <a href="https://www.instagram.com/crystalzusa/" target="_blank" rel="noopener" style="color:var(--gold);">@crystalzusa</a> on Instagram for the latest cuts.'}
    </p>
  </div>
</section>

<section class="barber-page-cta">
  <div class="container">
    <p class="eyebrow">Ready?</p>
    <h2>Book with {b["nick"].split(' ')[0]}.</h2>
    <p style="color:var(--cream-dim); margin-top:12px; max-width:560px; margin-left:auto; margin-right:auto;">Pick a service and time. Confirmation by SMS, calendar invite by email. {location_label} location.</p>
    <div style="margin-top:32px; display:flex; gap:14px; justify-content:center; flex-wrap:wrap;">
      <a href="#" class="btn book-trigger" data-barber="{b["id"]}">Book Now</a>
      <a href="tel:{location_phone_tel}" class="btn btn-outline">{location_phone_display}</a>
    </div>
  </div>
</section>

<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="footer-logo"><img src="../assets/logo.svg" alt="Crystalz"></div>
        <p class="footer-tagline">Family-owned NJ barbershop. Two locations. Real cuts, no shortcuts.</p>
      </div>
      <div class="footer-col">
        <h5>Locations</h5>
        <ul>
          <li>Roselle Park</li>
          <li><a href="tel:+19082591151">(908) 259-1151</a></li>
          <li>Elizabeth</li>
          <li><a href="tel:+19083516040">(908) 351-6040</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>Site</h5>
        <ul>
          <li><a href="../index.html#about">Our Story</a></li>
          <li><a href="../index.html#barbers">All Barbers</a></li>
          <li><a href="../index.html#services">Services</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>Direct</h5>
        <ul>
          <li><a href="{b["booksyUrl"]}" target="_blank" rel="noopener">Book on Booksy</a></li>
          {f'<li><a href="{b["handleUrl"]}" target="_blank" rel="noopener">{b["handle"]}</a></li>' if b.get("handle") else ''}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      © 2026 Crystalz Barbershop · Roselle Park & Elizabeth, NJ · Website by <a href="https://clickmingo.com" target="_blank" rel="noopener">ClickMingo</a> · <a href="https://thejorgeramirezgroup.com" target="_blank" rel="noopener" title="New Jersey Real Estate — The Jorge Ramirez Group">The Jorge Ramirez Group</a>
    </div>
  </div>
</footer>

<!-- Mobile sticky CTA -->
<div class="mobile-cta-bar" role="navigation">
  <a href="#" class="mcta mcta-primary book-trigger" data-barber="{b["id"]}">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    <span>Book {b["nick"].split(' ')[0]}</span>
  </a>
  <a href="tel:{location_phone_tel}" class="mcta">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    <span>Call</span>
  </a>
  <a href="https://maps.google.com/?q={location_address.replace(' ', '+')}" target="_blank" rel="noopener" class="mcta">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    <span>Map</span>
  </a>
</div>

<!-- Booking modal — same as main site -->
<div class="modal-overlay" id="bookingModal" role="dialog" aria-modal="true">
  <div class="modal">
    <button class="modal-close" id="modalClose" aria-label="Close">×</button>
    <p class="eyebrow" style="padding-left:0;">Book An Appointment</p>
    <h3>Sharp cut. Real time.</h3>
    <p class="modal-sub">Pick your service and a time. We'll send a confirmation by SMS and your calendar invite by email.</p>
    <form id="bookingForm">
      <div class="form-error" id="formError"></div>
      <div class="form-group">
        <label for="b-location">Location</label>
        <select id="b-location" name="location" required>
          <option value="">— Select a location —</option>
          <option value="roselle-park">Roselle Park · 13 W Westfield Ave</option>
          <option value="elizabeth">Elizabeth · 910 Elizabeth Ave</option>
        </select>
      </div>
      <div class="form-group">
        <label for="b-barber">Barber</label>
        <select id="b-barber" name="barber" required>
          <option value="">— Choose your barber —</option>
        </select>
      </div>
      <div class="form-group">
        <label for="b-service">Service</label>
        <select id="b-service" name="service" required>
          <option value="">— Choose a service —</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="b-date">Date</label>
          <input type="date" id="b-date" name="date" required>
        </div>
        <div class="form-group">
          <label for="b-time">Time</label>
          <select id="b-time" name="time" required>
            <option value="">— Time —</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="b-name">Your Name</label>
          <input type="text" id="b-name" name="name" required>
        </div>
        <div class="form-group">
          <label for="b-phone">Phone</label>
          <input type="tel" id="b-phone" name="phone" placeholder="(908) 555-1234" required>
        </div>
      </div>
      <div class="form-group">
        <label for="b-email">Email</label>
        <input type="email" id="b-email" name="email" required>
      </div>
      <div class="form-group">
        <label for="b-notes">Notes (optional)</label>
        <textarea id="b-notes" name="notes" rows="2"></textarea>
      </div>
      <button type="submit" class="btn" id="submitBtn">Confirm Appointment</button>
    </form>
    <div class="form-success" id="formSuccess">
      <div class="form-success-icon">✓</div>
      <h3>Appointment Confirmed</h3>
      <p style="color:var(--cream-dim); margin-top:12px;">We've sent a confirmation by SMS, and your calendar invite is in your email.</p>
      <button class="btn btn-outline" id="successClose" style="margin-top:24px;">Close</button>
    </div>
  </div>
</div>

<script src="../js/data.js"></script>
<script src="../js/main.js"></script>
</body>
</html>
"""


def main():
    data = parse_data()
    barbers = data["barbers"]
    services = data["services"]
    print(f"Generating {len(barbers)} barber bio pages…")
    for b in barbers:
        out_path = OUT_DIR / f"{b['id']}.html"
        out_path.write_text(render_barber_page(b, services))
        print(f"  wrote {out_path.relative_to(ROOT)}")
    print("Done.")


if __name__ == "__main__":
    main()
