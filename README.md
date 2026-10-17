# Real Reel Drama

Website of **Real Reel Drama** (“Verticals & all the feelings”), Meagan Johnson’s home for vertical drama culture: homepage (Meet Meagan, Real Reel Unscripted, Reviews, Industry, About, Social medias), About and Contact pages. Every text and picture can be changed in a **CMS** (`/cms`) restricted to allowed Google accounts, without touching the Figma mock-up’s style.

Built on the same model as **Voices of Verticals**, **I Love Verticals** and **Inkspire** (Google sign-in, security, Hostinger deployment through the `production` branch).

- Figma mock-up: https://www.figma.com/design/NTBZA61INfRtRelapOPGka/RealReelDrama (Homepage, Styleguide, Blog UI kit, reusable components)

## Stack

- **Front end**: React + Vite + React Router (`client/`), plain CSS with the mock-up’s tokens (`client/src/styles/tokens.css`), fonts via `@fontsource`
- **Back end**: Node.js + Express + Mongoose (`server/`)
- **Database**: MongoDB (local or Atlas); images uploaded in the CMS are stored in MongoDB too

### Fonts

The mock-up uses Paperink, French Aperitif, Brandon Grotesque and Lulo One. Their web licenses aren’t part of the project, so the site uses the substitutions approved in the Figma UI kit: **Caveat** (handwritten accents), **Patrick Hand** (editorial titles), **Nunito Sans** (body and controls) and **Josefin Sans** (uppercase overlines). With a web license for the originals, add their `@font-face` rules and put their names first in the font stacks of `tokens.css`.

## Requirements

- **Node.js 20 or later** (22 recommended, see `.nvmrc`: `nvm use` in the folder)
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas database

## Installation

```bash
npm run install:all
cp server/.env.example server/.env   # then adjust MONGODB_URI
```

`server/.env` holds your credentials: it is never pushed to GitHub.

### CMS sign-in (Google)

The public site is open to everyone. The CMS (`/cms`) and every `/api/cms` route require a Google sign-in (no password stored). In `server/.env`:

- `GOOGLE_CLIENT_ID`: OAuth “Web application” client ID (Google Cloud Console; authorized origins `http://localhost` and `http://localhost:5176`, then the live address)
- `ALLOWED_EMAILS`: Google emails allowed to edit the content, comma-separated
- `SESSION_SECRET`: random string of at least 32 characters (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

Without `GOOGLE_CLIENT_ID`, the CMS is open without sign-in locally (warning banner); in production (`NODE_ENV=production`), the server refuses to start without it.

## Running the app

```bash
npm run dev
```

- Site: http://localhost:5176
- CMS: http://localhost:5176/cms
- API: http://localhost:5004/api/health

> Ports 5176 / 5004 so Inkspire (5173 / 5001), I Love Verticals (5174 / 5002) and Voices of Verticals (5175 / 5003) can run at the same time.

## The CMS

- **Dashboard**: pages edited, unread messages, uploaded images.
- **Pages** (Homepage, About, Contact): one form per page, split like the mock-up (Hero, Real Reel Unscripted, Reviews…). Lists (links, cards, topics…) can be added, reordered and removed. Tag colors are picked from the UI kit’s tags. “Restore mock-up texts” puts the mock-up texts back in a section. Each page also has its SEO title and description, with a search result preview.
- **Images**: upload (button or drag and drop) JPEG, PNG, WebP or GIF up to 8 MB; every image field of the editors can upload or pick from the library, or go back to the mock-up photo. An image still used on a page can’t be deleted.
- **Messages**: messages sent from the Contact page (read / unread, reply by email, delete).
- **Site settings**: brand, footer texts and social media links (used by the footer, the homepage “Social medias” section and the Contact page).

As long as a page hasn’t been saved in the CMS, the site shows the mock-up texts (`server/src/data/pages.js`). A link left empty (the mock-up doesn’t give the social, Vertibase or podcast addresses) keeps its label visible but isn’t clickable; a button without a link shows the kit’s “Disabled” state.

### Adding a field or a section

Everything is described in `server/src/data/pages.js` (sections, fields, default texts): the CMS builds its forms from this file and the server uses it to validate what it receives. After adding one, show the new field in the matching React page (`client/src/pages/`).

## Production (Hostinger)

- `npm run build`: installs the server and client dependencies, then builds the interface (`client/dist`)
- `npm install` at the root: on a fresh copy or with `NODE_ENV=production`, also runs `npm run build` (`postinstall` script); `RRD_SKIP_BUILD=1` prevents it
- `npm start`: starts the server; with `NODE_ENV=production`, it also serves the interface (with each page’s SEO tags written into the HTML), adds the security headers (helmet) and rate-limits requests
- Variables to set at Hostinger: `NODE_ENV=production`, `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `ALLOWED_EMAILS`, `SESSION_SECRET`, `SITE_URL` (public address: canonical links, `/sitemap.xml`)

### GitHub Actions

- `ci.yml`: on every push to `main`, installs, builds and runs `scripts/smoke-test.sh` (server in production mode)
- `deploy.yml` (manual, Actions tab › “Deploy to production”): runs the check again, then moves the `production` branch forward; Hostinger redeploys as soon as it changes

## Structure

```
client/
  src/main.jsx              site and CMS routes
  src/components/           header, footer, UI kit (buttons, links, tags…)
  src/pages/                site pages
  src/pages/cms/            dashboard, page editor, images, messages, sign-in
  src/styles/               tokens.css (mock-up), base.css (UI kit), site.css, cms.css
  src/assets/icons/         icons exported from the Figma mock-up
  public/images/            mock-up photos (resized)
server/
  src/data/pages.js         definition and default texts of each page
  src/routes/               public API, CMS, sign-in, sitemap/robots
  src/utils/                content validation, SEO, security, Google sign-in
scripts/                    postinstall (Hostinger), smoke test
```
