# The Oasis RV Resort — Website

Private RV resort on Lakeshore Drive, Osoyoos, BC. 104 privately-owned lots fronting Osoyoos Lake.

## Structure

```
deploy-mirror/          Static site files (deployed to hosting)
├── index.html          Home page
├── admin.html          Listing management (password-protected)
├── cabin-selector.html Site selector
├── booking-success.html Booking confirmation
├── data/cards.json     Sale & rental listing data
├── images/             Photos, maps, logos
├── icons/              Activity icons
├── models/             3D resort map & falcon models
├── fonts/              Oswald, Great Vibes
└── _next/static/       Compiled JS/CSS bundles

src/                    Source code (admin editor)
├── app/admin/          Card editor component & styles
├── app/globals.css     Global stylesheet
└── app/layout.tsx      Root layout
```

## Deployment

This is a static site — no server-side rendering, no database, no build step required.

**To deploy:** Upload the contents of `deploy-mirror/` to your hosting provider's public directory.

- **GoDaddy cPanel:** Upload to `public_html/`
- **Netlify:** `npx netlify-cli deploy --prod --dir=deploy-mirror`

## Admin

The listing editor is at `/admin` (password-protected). It manages the Buy/Rent cards on the home page via `localStorage` for live preview and `cards.json` export for permanent updates.
