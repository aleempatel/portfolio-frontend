/* ============================================================
   Fetches portfolio content from the backend API and renders it
   into the dynamic containers in index.html. Loads after main.js
   so window.PortfolioAnimate / window.setPortfolioRoles exist.
============================================================ */
(() => {
  "use strict";

  const { assetUrl } = window.PortfolioConfig;
  const API = window.PortfolioAPI;

  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initials(name) {
    if (!name) return "MA";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "MA";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function splitName(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: "" };
    const last = parts.pop();
    return { first: parts.join(" "), last };
  }

  function paragraphs(text) {
    if (!text) return [];
    return text.split(/\n{2,}|\r?\n/).map((p) => p.trim()).filter(Boolean);
  }

  const ACCENTS = [
    { hex: "#00d9ff", text: "text-cyan-200", border: "border-cyan-400/15", bg: "bg-cyan-400/5" },
    { hex: "#00f5a0", text: "text-emerald-200", border: "border-emerald-400/15", bg: "bg-emerald-400/5" },
    { hex: "#8b5cf6", text: "text-violet-200", border: "border-violet-400/15", bg: "bg-violet-400/5" },
    { hex: "#facc15", text: "text-yellow-200", border: "border-yellow-400/15", bg: "bg-yellow-400/5" },
  ];
  const accentFor = (i) => ACCENTS[i % ACCENTS.length];

  const reveal = (el) => window.PortfolioAnimate && window.PortfolioAnimate.reveal(el);
  const tilt = (el) => window.PortfolioAnimate && window.PortfolioAnimate.tilt(el);

  // ---------------- PROFILE ----------------
  async function renderProfile() {
    let profile = {};
    try {
      const res = await API.getProfile();
      profile = res.data || {};
    } catch (err) {
      console.warn("Could not load profile:", err.message);
      return;
    }

    const name = profile.name || "";
    if (name) {
      const { first, last } = splitName(name);
      const firstEl = document.getElementById("heroNameFirst");
      const lastEl = document.getElementById("heroNameLast");
      if (firstEl) firstEl.textContent = first;
      if (lastEl) lastEl.textContent = last;

      const navName = document.getElementById("navName");
      if (navName) navName.textContent = name;
      const footerName = document.getElementById("footerName");
      if (footerName) footerName.textContent = name;

      document.title = `${name} — Portfolio`;
    }

    const initialsText = initials(name);
    ["navAvatarInitials", "aboutAvatarInitials", "footerAvatarInitials"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = initialsText;
    });

    if (Array.isArray(profile.roles) && profile.roles.length) {
      if (typeof window.setPortfolioRoles === "function") window.setPortfolioRoles(profile.roles);
      const navRoleTag = document.getElementById("navRoleTag");
      if (navRoleTag) navRoleTag.textContent = profile.roles.join(" · ");
    }

    if (profile.bio) {
      const heroBio = document.getElementById("heroBio");
      if (heroBio) heroBio.textContent = profile.bio;
    }

    if (profile.aboutBio) {
      const aboutContainer = document.getElementById("aboutBioContent");
      const paras = paragraphs(profile.aboutBio);
      if (aboutContainer && paras.length) {
        aboutContainer.innerHTML = paras
          .map((p) => `<p class="text-sm sm:text-base leading-8 text-slate-400">${esc(p)}</p>`)
          .join("");
      }
    }

    if (profile.profilePicture) {
      const img = document.getElementById("profileImage");
      if (img) {
        img.onload = () => {
          img.style.display = "";
          const fallback = img.nextElementSibling;
          if (fallback) fallback.style.display = "none";
        };
        img.onerror = () => {
          img.style.display = "none";
          const fallback = img.nextElementSibling;
          if (fallback) fallback.style.display = "grid";
        };
        img.src = assetUrl(profile.profilePicture);
      }
    }

    const cvLink = document.getElementById("cvDownloadLink");
    if (cvLink && profile.resumeUrl) {
      cvLink.href = assetUrl(profile.resumeUrl);
    }

    bindContact(
      "contactEmailLink",
      "contactEmailText",
      profile.email,
      (v) => `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(v)}`,
      (v) => v
    );
    const contactEmailLink = document.getElementById("contactEmailLink");
    if (contactEmailLink) {
      contactEmailLink.target = "_blank";
      contactEmailLink.rel = "noopener noreferrer";
    }
    bindContact("contactPhoneLink", "contactPhoneText", profile.phone, (v) => `tel:${v.replace(/\s+/g, "")}`, (v) => v);
    bindContact(
      "contactGithubLink",
      "contactGithubText",
      profile.github,
      (v) => (/^https?:\/\//i.test(v) ? v : `https://github.com/${v.replace(/^@/, "")}`),
      (v) => v.replace(/^https?:\/\//i, "")
    );
    bindContact(
      "contactLinkedinLink",
      "contactLinkedinText",
      profile.linkedin,
      (v) => (/^https?:\/\//i.test(v) ? v : `https://www.linkedin.com/in/${v.replace(/^@/, "")}`),
      (v) => v.replace(/^https?:\/\//i, "")
    );
  }

  function bindContact(linkId, textId, value, hrefFn, textFn) {
    if (!value) return; // keep the placeholder already in the HTML
    const link = document.getElementById(linkId);
    const text = document.getElementById(textId);
    if (link) link.href = hrefFn(value);
    if (text) text.textContent = textFn(value);
  }

  // ---------------- SKILLS ----------------
  async function renderSkills() {
    const container = document.getElementById("skillsGrid");
    if (!container) return;
    let skills = [];
    try {
      skills = (await API.getSkills()).data || [];
    } catch (err) {
      container.innerHTML = `<p class="text-sm text-slate-600 font-mono">Skills unavailable — is the backend running?</p>`;
      return;
    }
    if (!skills.length) {
      container.innerHTML = `<p class="text-sm text-slate-600 font-mono">No skills added yet.</p>`;
      return;
    }

    const groups = new Map();
    skills.forEach((s) => {
      const cat = s.category || "Other";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(s);
    });

    container.innerHTML = "";
    let i = 0;
    groups.forEach((items, category) => {
      const accent = accentFor(i);
      const card = document.createElement("div");
      card.className = "skill-card glass glass-hover rounded-2xl p-6 sm:p-7 reveal interactive-card";
      card.style.setProperty("--skill-color", accent.hex);
      card.innerHTML = `
        <h3 class="mb-7 text-lg font-bold tracking-tight ${accent.text}">${esc(category)}</h3>
        <div class="space-y-5">
          ${items
            .map((s) => {
              const pct = Math.max(0, Math.min(100, Number(s.proficiency) || 0));
              return `
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-slate-200">${esc(s.name)}</span>
                    <span class="text-slate-400">${pct}%</span>
                  </div>
                  <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
                </div>`;
            })
            .join("")}
        </div>`;
      container.appendChild(card);
      reveal(card);
      tilt(card);
      i++;
    });
  }

  // ---------------- PROJECTS ----------------
  async function renderProjects() {
    const container = document.getElementById("projectsGrid");
    if (!container) return;
    let projects = [];
    try {
      projects = (await API.getProjects()).data || [];
    } catch (err) {
      container.innerHTML = `<p class="text-sm text-slate-600 font-mono">Projects unavailable — is the backend running?</p>`;
      return;
    }
    if (!projects.length) {
      container.innerHTML = `<p class="text-sm text-slate-600 font-mono">No projects added yet.</p>`;
      return;
    }

    container.innerHTML = "";
    projects.forEach((p, i) => {
      const accent = accentFor(i);
      const article = document.createElement("article");
      article.className = "project-card glass glass-hover rounded-3xl reveal tilt interactive-card";
      article.style.setProperty("--project-color", accent.hex);

      const coverPath = p.imageUrl || (Array.isArray(p.images) && p.images[0]) || "";
      const coverUrl = coverPath ? assetUrl(coverPath) : "";
      const galleryUrls = (Array.isArray(p.images) && p.images.length ? p.images : [p.imageUrl].filter(Boolean)).map(assetUrl);
      const techs = Array.isArray(p.technologies) ? p.technologies : [];
      const category = (p.category || "Project").toUpperCase();

      const visualStyle = coverUrl
        ? `style="background-image:url('${coverUrl}');background-size:cover;background-position:center;"`
        : "";

      const links = [
        p.liveUrl
          ? `<a href="${esc(p.liveUrl)}" target="_blank" rel="noopener noreferrer" class="btn-secondary rounded-lg px-2 py-2.5 text-center text-[10px] font-semibold">Live Demo</a>`
          : "",
        p.githubUrl
          ? `<a href="${esc(p.githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn-secondary rounded-lg px-2 py-2.5 text-center text-[10px] font-semibold">GitHub</a>`
          : "",
      ]
        .filter(Boolean)
        .join("");

      article.innerHTML = `
        <div class="project-visual" ${visualStyle}>
          ${galleryUrls.length ? `<button type="button" class="gallery-trigger" aria-label="View ${esc(p.title)} image gallery"></button>` : ""}
          <div class="absolute top-4 left-4 z-10 rounded-full border ${accent.border} ${accent.bg} px-2.5 py-1 font-mono text-[9px] ${accent.text}">
            ${esc(category)}
          </div>
          ${coverUrl ? "" : `<div class="visual-orbit"></div><div class="visual-orbit"></div><div class="visual-core"></div>`}
          ${p.featured ? `<div class="absolute bottom-4 left-4 right-4 flex justify-between font-mono text-[9px] text-slate-500"><span>FEATURED</span><span class="text-emerald-400">★</span></div>` : ""}
        </div>
        <div class="p-6 sm:p-7 tilt-inner">
          <div class="text-[10px] font-mono text-slate-600">${String(i + 1).padStart(2, "0")} / ${esc(category)}</div>
          <h3 class="mt-2 text-xl font-bold tracking-tight text-white">${esc(p.title)}</h3>
          ${p.description ? `<p class="mt-4 text-sm leading-7 text-slate-400">${esc(p.description)}</p>` : ""}
          ${techs.length ? `<div class="mt-5 flex flex-wrap gap-1.5">${techs.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
          ${galleryUrls.length > 1 ? `<button type="button" class="gallery-open-btn mt-5 text-[10px] font-mono uppercase tracking-wider ${accent.text} hover:underline">View all ${galleryUrls.length} photos →</button>` : ""}
          ${links ? `<div class="mt-6 grid grid-cols-2 gap-2">${links}</div>` : ""}
        </div>`;
      container.appendChild(article);
      reveal(article);
      tilt(article);

      if (galleryUrls.length && window.PortfolioLightbox) {
        const openGallery = () => window.PortfolioLightbox.open(galleryUrls, p.title);
        const trigger = article.querySelector(".gallery-trigger");
        if (trigger) trigger.addEventListener("click", openGallery);
        const openBtn = article.querySelector(".gallery-open-btn");
        if (openBtn) openBtn.addEventListener("click", openGallery);
      }
    });
  }

  // ---------------- EDUCATION ----------------
  async function renderEducation() {
    const container = document.getElementById("educationList");
    if (!container) return;
    let items = [];
    try {
      items = (await API.getEducation()).data || [];
    } catch (err) {
      container.innerHTML = `<p class="text-sm text-slate-600 font-mono">Education unavailable — is the backend running?</p>`;
      return;
    }
    if (!items.length) {
      container.innerHTML = `<p class="text-sm text-slate-600 font-mono">No education entries added yet.</p>`;
      return;
    }

    container.innerHTML = "";
    items.forEach((ed, i) => {
      const accent = accentFor(i);
      const card = document.createElement("div");
      card.className = "glass glass-hover rounded-3xl p-7 sm:p-8 reveal interactive-card education-card";
      const dateRange = [ed.startDate, ed.endDate].filter(Boolean).join(" – ");
      const metaBits = [ed.institution, ed.location, ed.grade].filter(Boolean).map(esc).join(" · ");
      card.innerHTML = `
        <div class="flex flex-col sm:flex-row gap-5 sm:items-center sm:justify-between">
          <div>
            <div class="text-[10px] font-mono uppercase tracking-[.18em] ${accent.text}">${esc(dateRange || "Education")}</div>
            <h3 class="mt-2 text-2xl font-bold text-white">${esc(ed.degree)}</h3>
            ${metaBits ? `<p class="mt-2 text-sm text-slate-500">${metaBits}</p>` : ""}
            ${ed.description ? `<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">${esc(ed.description)}</p>` : ""}
          </div>
          <div class="w-14 h-14 rounded-2xl border ${accent.border} ${accent.bg} grid place-items-center ${accent.text} shrink-0">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
              <path d="m4 6 8-3 8 3-8 3-8-3Z"/><path d="M6 8v5c0 1.8 2.7 3 6 3s6-1.2 6-3V8"/><path d="M20 7v6"/>
            </svg>
          </div>
        </div>`;
      container.appendChild(card);
      reveal(card);
      tilt(card);
    });
  }

  // ---------------- COURSES ----------------
  async function renderCourses() {
    const container = document.getElementById("coursesList");
    if (!container) return;
    let items = [];
    try {
      items = (await API.getCourses()).data || [];
    } catch (err) {
      container.innerHTML = `<p class="text-sm text-slate-600 font-mono">Courses unavailable — is the backend running?</p>`;
      return;
    }
    if (!items.length) {
      container.innerHTML = `<p class="text-sm text-slate-600 font-mono">No courses added yet.</p>`;
      return;
    }

    container.innerHTML = items
      .map((c) => {
        const meta = [c.provider, c.date].filter(Boolean).map(esc).join(" <span class=\"text-slate-600\">·</span> ");
        const certLink = c.certificateUrl
          ? `<a href="${esc(c.certificateUrl)}" target="_blank" rel="noopener noreferrer" class="course-view-link shrink-0">View <span aria-hidden="true">→</span></a>`
          : "";
        return `
          <div class="course-entry flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="cert-line course-item text-slate-300">${esc(c.title)}${meta ? ` <span class="text-slate-600">—</span> ${meta}` : ""}</div>
              ${c.description ? `<p class="course-description ml-6 mt-1 w-[calc(100%-1.5rem)] max-w-none text-sm leading-6 text-slate-500">${esc(c.description).replace(/\n/g, "<br />")}</p>` : ""}
            </div>
            ${certLink}
          </div>`;
      })
      .join("");
  }

  // ---------------- EXPERIENCE ----------------
  async function renderExperience() {
    const container = document.getElementById("experienceTimeline");
    if (!container) return;
    let items = [];
    try {
      items = (await API.getExperience()).data || [];
    } catch (err) {
      container.innerHTML = `<p class="text-sm text-slate-600 font-mono">Experience unavailable — is the backend running?</p>`;
      return;
    }
    if (!items.length) {
      container.innerHTML = `<p class="text-sm text-slate-600 font-mono">No experience entries added yet.</p>`;
      return;
    }

    container.innerHTML = "";
    items.forEach((ex, i) => {
      const accent = accentFor(i);
      const article = document.createElement("article");
      article.className = "relative reveal";
      const dateRange = [ex.startDate, ex.current ? "Present" : ex.endDate].filter(Boolean).join(" – ");
      const meta = [ex.company, ex.location].filter(Boolean).map(esc).join(" · ");
      const techs = Array.isArray(ex.technologies) ? ex.technologies : [];
      const resp = Array.isArray(ex.responsibilities) ? ex.responsibilities.filter(Boolean) : [];

      article.innerHTML = `
        <div class="timeline-dot" style="border-color:${accent.hex};box-shadow:0 0 18px ${accent.hex}80"></div>
        <div class="timeline-content glass glass-hover rounded-3xl p-6 sm:p-8 interactive-card">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div class="text-[10px] font-mono uppercase tracking-[.18em] ${accent.text}">${esc(dateRange || "")}</div>
              <h3 class="mt-2 text-xl font-bold text-white">${esc(ex.jobTitle)}</h3>
              ${meta ? `<p class="mt-1 text-sm text-slate-500">${meta}</p>` : ""}
            </div>
            ${ex.employmentType ? `<span class="rounded-full border ${accent.border} ${accent.bg} px-3 py-1 text-[9px] font-mono ${accent.text} shrink-0">${esc(ex.employmentType.toUpperCase())}</span>` : ""}
          </div>
          ${ex.description ? `<p class="mt-6 max-w-3xl text-sm leading-7 text-slate-400">${esc(ex.description)}</p>` : ""}
          ${resp.length ? `<ul class="mt-4 max-w-3xl space-y-1.5 text-sm leading-6 text-slate-400 list-disc list-inside">${resp.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
          ${techs.length ? `<div class="mt-5 flex flex-wrap gap-2">${techs.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
        </div>`;
      container.appendChild(article);
      reveal(article);
      const inner = article.querySelector(".timeline-content");
      if (inner) tilt(inner);
    });
  }

  function init() {
    renderProfile();
    renderSkills();
    renderProjects();
    renderEducation();
    renderCourses();
    renderExperience();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
