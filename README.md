# By Sara Online — Fashion Store

Static website (no build step) + Supabase for the database, photos and live updates.

- `index.html` — the shop customers see (Arabic/English, bag, order form, WhatsApp orders)
- `owner.html` — owner dashboard: add/edit/remove items, prices, photos, sale prices, stock,
  hide/show, order of items, store settings, incoming orders (all changes appear live in the shop)
- `supabase/schema.sql` — run once in the Supabase SQL editor
- `js/config.js` — Supabase project URL + publishable key + owner email
- Both pages install as an app on phone and PC (manifest + `sw.js`)
- `tools/icon.html` — renders the logo to the PNG icons in `icons/`

Hosting: GitHub Pages from the `main` branch, custom domain in `CNAME`. `render.yaml` is kept in case it moves to Render.
