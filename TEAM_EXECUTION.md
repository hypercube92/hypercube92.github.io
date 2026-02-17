# Build Team - Le General Wagram

This refactor is executed by 3 specialist tracks working in parallel.

## Expert 1 - SEO & Information Architecture
- Defined bilingual structure (`/fr` + `/en`) with conversion-focused page paths.
- Implemented on-page SEO: titles, descriptions, canonical tags, hreflang links.
- Added structured data where relevant (`Restaurant`, `FAQPage`, `Event`, `JobPosting`, `Menu`, `BreadcrumbList`).
- Added technical SEO files: `sitemap.xml` and `robots.txt`.

## Expert 2 - UI/UX & Brand System
- Built a reusable visual system in `/assets/styles.css` with brand tokens.
- Implemented modern responsive layout with strong typography and immersive hero sections.
- Added reusable components: cards, timeline, forms, sticky mobile CTA, section heads.
- Included motion system (`.reveal`) and mobile navigation behavior.

## Expert 3 - Product Features & Conversion
- Implemented all key user journeys: booking, private events, contact, careers, order.
- Added client-side validation and conversion hooks (`data-track`) in `/assets/script.js`.
- Built menu browsing pages (main menu + submenus + happy hour).
- Added trust/support pages: reviews, FAQ, legal, privacy, cookie policy.

## Sprint Backlog (Next)
1. Connect forms to a backend (email + CRM + anti-spam).
2. Integrate real menu data source and CMS for content updates.
3. Add analytics stack (GA4 + GTM + conversion events dashboard).
4. Replace placeholders with production photo/video assets.
5. Run Lighthouse + accessibility QA and tune Core Web Vitals.
