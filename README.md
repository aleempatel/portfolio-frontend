# Portfolio — Frontend

A dynamic, backend-driven portfolio site with a full admin panel. Every
piece of content — profile info, both intro texts, the rotating role
text under your name, skills, education, courses, experience, and
projects — is stored in the backend and editable from the admin panel,
not hardcoded in the HTML.
 
## Folder structure

```
portfolio/
├── index.html            → Public site markup (dynamic containers, no
│                            hardcoded content — filled in by JS)
├── css/
│   └── style.css          → All visual styling (design unchanged)
├── js/
│   ├── tailwind-config.js  → Tailwind theme config
│   ├── config.js            → API base URL + asset URL resolver
│   ├── api.js                → Fetch wrapper for the backend REST API
│   ├── main.js                → Nav, scroll-reveal, cursor glow, card
│   │                            tilt, role-rotator, 3D neural network
│   ├── lightbox.js             → Fullscreen project image gallery
│   │                             (smooth scroll-snap viewer)
│   └── app.js                   → Fetches data from the API and renders
│                                  it into index.html's containers
└── admin/
    ├── index.html          → Admin login + dashboard shell
    ├── admin.css            → Dashboard-only styling
    └── admin.js              → Login, and full CRUD UI for every
                                 resource (profile, skills, education,
                                 courses, experience, projects + images)
```

## How it works

1. `js/config.js` defines the backend API URL (default
   `http://localhost:5000/api`) and a helper that turns a stored path
   like `uploads/profile-123.jpg` into a full loadable URL.
2. `js/api.js` is a thin wrapper around every backend endpoint (reads +
   authenticated writes).
3. `js/app.js` runs after the page loads, fetches everything from the
   API, and populates the hero name/roles/bio, About paragraphs, Skills,
   Projects, Education, Courses, Experience, and Contact sections. If
   the backend isn't running, each section shows a small "unavailable"
   message instead of breaking the page.
4. The **Admin** button fixed in the bottom-right corner of the public
   site opens `admin/index.html`.

## Admin panel

Open `admin/index.html` directly, or click the gear-like Admin button
on the bottom-right of the public site. Log in with the
`ADMIN_USERNAME` / `ADMIN_PASSWORD` you set in the backend's `.env`
(created by running `npm run seed` in the backend).

From the dashboard you can fully control:
- **Profile** — name, rotating roles under your name, the short hero
  intro and the longer About write-up (the "dono introductions"),
  profile picture, résumé/CV file, email, phone, location, GitHub,
  LinkedIn, Twitter, website
- **Skills** — add/edit/delete, grouped by category, with a proficiency
  percentage
- **Education** — add/edit/delete degrees, institutions, dates, grade
- **Courses** — add/edit/delete certifications and short courses
- **Experience** — add/edit/delete roles, with responsibilities and
  technologies
- **Projects** — add/edit/delete, plus a dedicated image gallery
  manager (upload/remove up to 70 screenshots per project)
- **Account** — change the admin password

All uploaded files (profile picture, résumé, project images) are stored
in the backend's **AWS S3 bucket** — see the backend README for setup.
There's nothing to configure on the frontend for this; it just displays
whatever URL the backend returns.

If your backend isn't on `localhost:5000`, expand "Advanced: API URL"
on the login screen and point it at your backend's `/api` URL — this
is remembered in the browser for next time.

## Project image gallery

Clicking a project's cover image (or the "View all N photos" link on
its card) opens a fullscreen gallery: a smooth, vertical scroll-snap
viewer that glides through that project's images one at a time, with
arrow-key/arrow-button navigation, a counter, and Escape/click-outside
to close. This is `js/lightbox.js` — it works with however many images
a project has (up to the 70-image admin limit).

## Running it

1. Start the backend first (see its own README) — `npm run dev` from
   the `backend/` folder.
2. Serve this folder with any static server, e.g. `npx serve .` or the
   VS Code "Live Server" extension (or just open `index.html` directly
   in a browser — the API calls work either way since the backend's
   CORS is permissive in development).
3. Visit the site, then click **Admin** (bottom-right) to log in and
   start filling in your real content — nothing shows up on the public
   site until you add it from the admin panel.

No build step is required — plain HTML/CSS/JS with CDN-loaded Tailwind
and Three.js.
