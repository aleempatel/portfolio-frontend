/* ============================================================
   Admin panel application logic.
============================================================ */
(() => {
  "use strict";

  const API = window.PortfolioAPI;
  const { assetUrl } = window.PortfolioConfig;

  const TOKEN_KEY = "portfolio_admin_token";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ---------------------------------------------------------
     TOASTS
  --------------------------------------------------------- */
  function toast(message, type = "success") {
    const stack = $("#toastStack");
    const el = document.createElement("div");
    el.className = `admin-toast ${type === "error" ? "error" : "success"}`;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function errMsg(err) {
    return (err && err.message) || "Something went wrong.";
  }

  /* ---------------------------------------------------------
     MODAL
  --------------------------------------------------------- */
  function closeModal() {
    $("#modalRoot").innerHTML = "";
  }

  function openModal(innerHtml) {
    $("#modalRoot").innerHTML = `
      <div class="admin-modal-overlay" id="modalOverlay">
        <div class="admin-modal">${innerHtml}</div>
      </div>`;
    $("#modalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "modalOverlay") closeModal();
    });
  }

  /* ---------------------------------------------------------
     AUTH
  --------------------------------------------------------- */
  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }
  function setToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
  }
  function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }

  function showLogin() {
    $("#loginScreen").classList.remove("hidden");
    $("#dashboard").classList.add("hidden");
  }

  function showDashboard() {
    $("#loginScreen").classList.add("hidden");
    $("#dashboard").classList.remove("hidden");
    if (!currentTab) switchTab("profile");
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = $("#loginUsername").value.trim();
    const password = $("#loginPassword").value;
    const errBox = $("#loginError");
    const btn = $("#loginSubmitBtn");
    const label = $("#loginSubmitLabel");

    errBox.classList.add("hidden");

    btn.disabled = true;
    label.innerHTML = `<span class="admin-spinner"></span> Signing in…`;

    try {
      const res = await API.login(username, password);
      setToken(res.token);
      toast(`Welcome back, ${res.user && res.user.username ? res.user.username : "admin"}.`);
      showDashboard();
    } catch (err) {
      errBox.textContent = errMsg(err);
      errBox.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      label.textContent = "Sign in";
    }
  }

  function handleLogout() {
    clearToken();
    currentTab = null;
    toast("Logged out.");
    showLogin();
  }

  // Any authed API call that comes back 401 means the session has expired -
  // bounce back to the login screen instead of silently failing.
  function handleAuthError(err) {
    if (err && err.status === 401) {
      clearToken();
      showLogin();
      toast("Session expired. Please log in again.", "error");
      return true;
    }
    return false;
  }

  /* ---------------------------------------------------------
     TAB SWITCHING
  --------------------------------------------------------- */
  let currentTab = null;

  const TAB_RENDERERS = {
    profile: renderProfileTab,
    skills: () => renderResourceTab("skills"),
    education: () => renderResourceTab("education"),
    courses: () => renderResourceTab("courses"),
    experience: () => renderResourceTab("experience"),
    projects: () => renderResourceTab("projects"),
    account: renderAccountTab,
  };

  function switchTab(tab) {
    currentTab = tab;
    $$(".admin-nav-btn[data-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });
    const renderer = TAB_RENDERERS[tab];
    if (renderer) renderer();
  }

  /* ---------------------------------------------------------
     FIELD SCHEMA HELPERS (shared by all generic CRUD resources)
  --------------------------------------------------------- */
  function fieldToHtml(field, value) {
    const val = value === undefined || value === null ? "" : value;
    const id = `field_${field.key}`;
    const req = field.required ? "required" : "";

    if (field.type === "textarea") {
      return `
        <div class="mb-4">
          <label class="field-label" for="${id}">${esc(field.label)}</label>
          <textarea class="field-textarea" id="${id}" ${req} placeholder="${esc(field.placeholder || "")}">${esc(val)}</textarea>
        </div>`;
    }
    if (field.type === "lines") {
      const text = Array.isArray(val) ? val.join("\n") : val;
      return `
        <div class="mb-4">
          <label class="field-label" for="${id}">${esc(field.label)}</label>
          <textarea class="field-textarea" id="${id}" placeholder="${esc(field.placeholder || "")}">${esc(text)}</textarea>
          <p class="field-hint">One per line.</p>
        </div>`;
    }
    if (field.type === "tags") {
      const text = Array.isArray(val) ? val.join(", ") : val;
      return `
        <div class="mb-4">
          <label class="field-label" for="${id}">${esc(field.label)}</label>
          <input class="field-input" type="text" id="${id}" value="${esc(text)}" placeholder="${esc(field.placeholder || "e.g. Python, SQL, Docker")}" />
          <p class="field-hint">Comma separated.</p>
        </div>`;
    }
    if (field.type === "checkbox") {
      return `
        <div class="mb-4 flex items-center gap-2.5">
          <input type="checkbox" id="${id}" ${val ? "checked" : ""} class="w-4 h-4 accent-cyan-400" />
          <label class="text-sm text-slate-300" for="${id}">${esc(field.label)}</label>
        </div>`;
    }
    if (field.type === "number") {
      return `
        <div class="mb-4">
          <label class="field-label" for="${id}">${esc(field.label)}</label>
          <input class="field-input" type="number" id="${id}" value="${esc(val)}" ${field.min !== undefined ? `min="${field.min}"` : ""} ${field.max !== undefined ? `max="${field.max}"` : ""} ${req} />
        </div>`;
    }
    // default: text
    return `
      <div class="mb-4">
        <label class="field-label" for="${id}">${esc(field.label)}</label>
        <input class="field-input" type="text" id="${id}" value="${esc(val)}" placeholder="${esc(field.placeholder || "")}" ${req} />
      </div>`;
  }

  function collectFieldValues(fields) {
    const out = {};
    fields.forEach((field) => {
      const el = $(`#field_${field.key}`);
      if (!el) return;
      if (field.type === "checkbox") {
        out[field.key] = el.checked;
      } else if (field.type === "lines") {
        out[field.key] = el.value.split("\n").map((s) => s.trim()).filter(Boolean);
      } else if (field.type === "tags") {
        out[field.key] = el.value.split(",").map((s) => s.trim()).filter(Boolean);
      } else if (field.type === "number") {
        out[field.key] = el.value === "" ? undefined : Number(el.value);
      } else {
        out[field.key] = el.value;
      }
    });
    return out;
  }

  /* ---------------------------------------------------------
     RESOURCE DEFINITIONS
  --------------------------------------------------------- */
  const RESOURCES = {
    skills: {
      label: "Skill",
      columns: [
        { key: "name", label: "Name" },
        { key: "category", label: "Category", muted: true },
        { key: "proficiency", label: "Proficiency", format: (v) => `${v ?? 0}%` },
      ],
      fields: [
        { key: "name", label: "Name", required: true, placeholder: "e.g. Python" },
        { key: "category", label: "Category", placeholder: "e.g. Machine Learning" },
        { key: "proficiency", label: "Proficiency (0–100)", type: "number", min: 0, max: 100 },
        { key: "order", label: "Order", type: "number", placeholder: "0" },
      ],
    },
    education: {
      label: "Education",
      columns: [
        { key: "degree", label: "Degree" },
        { key: "institution", label: "Institution", muted: true },
        { key: "startDate", label: "Dates", format: (v, row) => [row.startDate, row.endDate].filter(Boolean).join(" – ") },
      ],
      fields: [
        { key: "degree", label: "Degree", required: true, placeholder: "e.g. BS Computer Science" },
        { key: "institution", label: "Institution", required: true },
        { key: "location", label: "Location" },
        { key: "grade", label: "Grade / CGPA" },
        { key: "startDate", label: "Start Date", placeholder: "e.g. 2021" },
        { key: "endDate", label: "End Date", placeholder: "e.g. 2025" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "order", label: "Order", type: "number", placeholder: "0" },
      ],
    },
    courses: {
      label: "Course",
      columns: [
        { key: "title", label: "Title" },
        { key: "provider", label: "Provider", muted: true },
        { key: "date", label: "Date", muted: true },
      ],
      fields: [
        { key: "title", label: "Title", required: true },
        { key: "provider", label: "Provider", placeholder: "e.g. Coursera, IBM" },
        { key: "date", label: "Date", placeholder: "e.g. 2024" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "certificateUrl", label: "Certificate URL" },
        { key: "order", label: "Order", type: "number", placeholder: "0" },
      ],
    },
    experience: {
      label: "Experience",
      columns: [
        { key: "jobTitle", label: "Job Title" },
        { key: "company", label: "Company", muted: true },
        { key: "startDate", label: "Dates", format: (v, row) => [row.startDate, row.current ? "Present" : row.endDate].filter(Boolean).join(" – ") },
      ],
      fields: [
        { key: "jobTitle", label: "Job Title", required: true },
        { key: "company", label: "Company", required: true },
        { key: "location", label: "Location" },
        { key: "employmentType", label: "Employment Type", placeholder: "Full-time, Internship…" },
        { key: "startDate", label: "Start Date", placeholder: "e.g. Jan 2024" },
        { key: "endDate", label: "End Date", placeholder: "e.g. Jun 2024" },
        { key: "current", label: "Currently working here", type: "checkbox" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "responsibilities", label: "Responsibilities", type: "lines" },
        { key: "technologies", label: "Technologies", type: "tags" },
        { key: "order", label: "Order", type: "number", placeholder: "0" },
      ],
    },
    projects: {
      label: "Project",
      columns: [
        { key: "title", label: "Title" },
        { key: "category", label: "Category", muted: true },
        { key: "featured", label: "Featured", format: (v) => (v ? "★ Yes" : "—") },
      ],
      fields: [
        { key: "title", label: "Title", required: true },
        { key: "category", label: "Category", placeholder: "e.g. Machine Learning" },
        { key: "description", label: "Short Description", type: "textarea" },
        { key: "longDescription", label: "Long Description", type: "textarea" },
        { key: "technologies", label: "Technologies", type: "tags" },
        { key: "liveUrl", label: "Live URL" },
        { key: "githubUrl", label: "GitHub URL" },
        { key: "featured", label: "Featured project", type: "checkbox" },
        { key: "order", label: "Order", type: "number", placeholder: "0" },
      ],
      hasImages: true,
    },
  };

  /* ---------------------------------------------------------
     GENERIC RESOURCE TAB (table + add/edit modal)
  --------------------------------------------------------- */
  async function renderResourceTab(resourceKey) {
    const resource = RESOURCES[resourceKey];
    const container = $("#tabContent");
    container.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-xl font-bold text-white">${esc(resource.label)}s</h2>
        <button class="admin-btn admin-btn-primary" id="addResourceBtn">+ Add ${esc(resource.label)}</button>
      </div>
      <div class="admin-panel-card">
        <div id="resourceTableWrap"><p class="text-sm text-slate-500">Loading…</p></div>
      </div>`;

    $("#addResourceBtn").addEventListener("click", () => openResourceForm(resourceKey, null));

    await loadResourceTable(resourceKey);
  }

  async function loadResourceTable(resourceKey) {
    const resource = RESOURCES[resourceKey];
    const wrap = $("#resourceTableWrap");
    if (!wrap) return;

    let items = [];
    try {
      items = (await API.list(resourceKey)).data || [];
    } catch (err) {
      if (handleAuthError(err)) return;
      wrap.innerHTML = `<p class="text-sm text-slate-500">Could not load data: ${esc(errMsg(err))}</p>`;
      return;
    }

    if (!items.length) {
      wrap.innerHTML = `<p class="text-sm text-slate-500">Nothing here yet — click "Add ${esc(resource.label)}" to create the first one.</p>`;
      return;
    }

    wrap.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            ${resource.columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr data-id="${item._id}">
              ${resource.columns
                .map((c) => {
                  const raw = item[c.key];
                  const display = c.format ? c.format(raw, item) : raw;
                  return `<td class="${c.muted ? "cell-muted" : ""}">${esc(display)}</td>`;
                })
                .join("")}
              <td class="cell-actions">
                ${resource.hasImages ? `<button class="admin-btn admin-btn-secondary admin-btn-sm images-btn" data-id="${item._id}">Images</button> ` : ""}
                <button class="admin-btn admin-btn-secondary admin-btn-sm edit-btn" data-id="${item._id}">Edit</button>
                <button class="admin-btn admin-btn-danger admin-btn-sm delete-btn" data-id="${item._id}">Delete</button>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;

    $$(".edit-btn", wrap).forEach((btn) =>
      btn.addEventListener("click", () => {
        const item = items.find((i) => i._id === btn.dataset.id);
        openResourceForm(resourceKey, item);
      })
    );
    $$(".delete-btn", wrap).forEach((btn) =>
      btn.addEventListener("click", () => confirmDeleteResource(resourceKey, btn.dataset.id))
    );
    if (resource.hasImages) {
      $$(".images-btn", wrap).forEach((btn) =>
        btn.addEventListener("click", () => {
          const item = items.find((i) => i._id === btn.dataset.id);
          openImagesModal(item);
        })
      );
    }
  }

  function openResourceForm(resourceKey, item) {
    const resource = RESOURCES[resourceKey];
    const isEdit = !!item;
    const values = item || {};

    openModal(`
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold text-white">${isEdit ? "Edit" : "Add"} ${esc(resource.label)}</h3>
        <button class="text-slate-500 hover:text-slate-300 text-xl leading-none" id="closeModalBtn">&times;</button>
      </div>
      <form id="resourceForm">
        ${resource.fields.map((f) => fieldToHtml(f, values[f.key])).join("")}
        <div id="resourceFormError" class="field-error hidden"></div>
        <div class="mt-5 flex gap-3">
          <button type="submit" class="admin-btn admin-btn-primary flex-1" id="resourceSubmitBtn">
            <span id="resourceSubmitLabel">${isEdit ? "Save Changes" : "Create"}</span>
          </button>
          <button type="button" class="admin-btn admin-btn-secondary" id="cancelFormBtn">Cancel</button>
        </div>
        ${resource.hasImages && !isEdit ? `<p class="field-hint mt-3">Save the project first, then use the "Images" button to upload photos.</p>` : ""}
      </form>
    `);

    $("#closeModalBtn").addEventListener("click", closeModal);
    $("#cancelFormBtn").addEventListener("click", closeModal);
    $("#resourceForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("#resourceSubmitBtn");
      const label = $("#resourceSubmitLabel");
      const errBox = $("#resourceFormError");
      errBox.classList.add("hidden");
      btn.disabled = true;
      label.innerHTML = `<span class="admin-spinner"></span> Saving…`;

      const payload = collectFieldValues(resource.fields);
      try {
        if (isEdit) {
          await API.update(resourceKey, item._id, payload);
          toast(`${resource.label} updated.`);
        } else {
          await API.create(resourceKey, payload);
          toast(`${resource.label} added.`);
        }
        closeModal();
        loadResourceTable(resourceKey);
      } catch (err) {
        if (handleAuthError(err)) return;
        errBox.textContent = errMsg(err);
        errBox.classList.remove("hidden");
        btn.disabled = false;
        label.textContent = isEdit ? "Save Changes" : "Create";
      }
    });
  }

  function confirmDeleteResource(resourceKey, id) {
    const resource = RESOURCES[resourceKey];
    openModal(`
      <h3 class="text-lg font-bold text-white mb-3">Delete ${esc(resource.label)}?</h3>
      <p class="text-sm text-slate-400 mb-6">This can't be undone.</p>
      <div class="flex gap-3">
        <button class="admin-btn admin-btn-danger flex-1" id="confirmDeleteBtn">Delete</button>
        <button class="admin-btn admin-btn-secondary" id="cancelDeleteBtn">Cancel</button>
      </div>
    `);
    $("#cancelDeleteBtn").addEventListener("click", closeModal);
    $("#confirmDeleteBtn").addEventListener("click", async () => {
      try {
        await API.remove(resourceKey, id);
        toast(`${resource.label} deleted.`);
        closeModal();
        loadResourceTable(resourceKey);
      } catch (err) {
        if (handleAuthError(err)) return;
        toast(errMsg(err), "error");
      }
    });
  }

  /* ---------------------------------------------------------
     PROJECT IMAGE GALLERY MODAL
  --------------------------------------------------------- */
  function openImagesModal(project) {
    const images = project.images || [];
    openModal(`
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold text-white">Images — ${esc(project.title)}</h3>
        <button class="text-slate-500 hover:text-slate-300 text-xl leading-none" id="closeModalBtn">&times;</button>
      </div>

      <div id="imageGrid" class="grid grid-cols-3 gap-3 mb-5">
        ${images
          .map(
            (img, idx) => `
          <div class="relative group">
            <img src="${assetUrl(img)}" class="admin-image-thumb" />
            <button class="delete-image-btn absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white text-xs grid place-items-center" data-index="${idx}" title="Remove image">&times;</button>
          </div>`
          )
          .join("") || `<p class="col-span-3 text-sm text-slate-500">No images yet.</p>`}
      </div>

      <label class="field-label" for="imageUploadInput">Upload new images</label>
      <input class="field-input" type="file" id="imageUploadInput" accept="image/*" multiple />
      <p class="field-hint">JPG, PNG, WEBP or GIF. Up to 8MB each.</p>
      <div id="imageUploadError" class="field-error hidden"></div>

      <div class="mt-5 flex gap-3">
        <button class="admin-btn admin-btn-primary flex-1" id="uploadImagesBtn">
          <span id="uploadImagesLabel">Upload</span>
        </button>
        <button class="admin-btn admin-btn-secondary" id="doneImagesBtn">Done</button>
      </div>
    `);

    $("#closeModalBtn").addEventListener("click", closeModal);
    $("#doneImagesBtn").addEventListener("click", closeModal);

    $$(".delete-image-btn").forEach((btn) =>
      btn.addEventListener("click", async () => {
        try {
          const res = await API.deleteProjectImage(project._id, btn.dataset.index);
          toast("Image removed.");
          openImagesModal(res.data);
        } catch (err) {
          if (handleAuthError(err)) return;
          toast(errMsg(err), "error");
        }
      })
    );

    $("#uploadImagesBtn").addEventListener("click", async () => {
      const input = $("#imageUploadInput");
      const errBox = $("#imageUploadError");
      errBox.classList.add("hidden");
      if (!input.files || !input.files.length) {
        errBox.textContent = "Choose at least one image first.";
        errBox.classList.remove("hidden");
        return;
      }
      const btn = $("#uploadImagesBtn");
      const label = $("#uploadImagesLabel");
      btn.disabled = true;
      label.innerHTML = `<span class="admin-spinner"></span> Uploading…`;

      const formData = new FormData();
      Array.from(input.files).forEach((file) => formData.append("images", file));

      try {
        const res = await API.uploadProjectImages(project._id, formData);
        toast(res.message || "Images uploaded.");
        openImagesModal(res.data);
        loadResourceTable("projects");
      } catch (err) {
        if (handleAuthError(err)) return;
        errBox.textContent = errMsg(err);
        errBox.classList.remove("hidden");
        btn.disabled = false;
        label.textContent = "Upload";
      }
    });
  }

  /* ---------------------------------------------------------
     PROFILE TAB
  --------------------------------------------------------- */
  async function renderProfileTab() {
    const container = $("#tabContent");
    container.innerHTML = `<p class="text-sm text-slate-500">Loading…</p>`;

    let profile = {};
    try {
      profile = (await API.getProfile()).data || {};
    } catch (err) {
      container.innerHTML = `<p class="text-sm text-slate-500">Could not load profile: ${esc(errMsg(err))}</p>`;
      return;
    }

    container.innerHTML = `
      <h2 class="text-xl font-bold text-white mb-5">Profile</h2>

      <div class="admin-panel-card mb-6">
        <h3 class="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Profile Picture</h3>
        <div class="flex items-center gap-5">
          <img id="profilePicPreview" src="${profile.profilePicture ? assetUrl(profile.profilePicture) : ""}" class="admin-avatar-thumb" style="${profile.profilePicture ? "" : "display:none;"}" />
          <div id="profilePicPlaceholder" class="admin-avatar-thumb grid place-items-center text-slate-600 text-xs" style="${profile.profilePicture ? "display:none;" : ""}">No image</div>
          <div class="flex flex-col gap-2">
            <input type="file" id="pictureInput" accept="image/*" class="text-xs text-slate-400" />
            <div class="flex gap-2">
              <button class="admin-btn admin-btn-secondary admin-btn-sm" id="uploadPictureBtn">Upload</button>
              <button class="admin-btn admin-btn-danger admin-btn-sm" id="deletePictureBtn" ${profile.profilePicture ? "" : "disabled"}>Remove</button>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-panel-card mb-6">
        <h3 class="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Résumé / CV</h3>
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-xs text-slate-500" id="resumeStatus">${profile.resumeUrl ? "A résumé is currently uploaded." : "No résumé uploaded yet."}</span>
          ${profile.resumeUrl ? `<a href="${assetUrl(profile.resumeUrl)}" target="_blank" class="text-xs text-cyan-300 hover:underline">View current file</a>` : ""}
        </div>
        <div class="mt-3 flex flex-col gap-2">
          <input type="file" id="resumeInput" accept=".pdf,.doc,.docx" class="text-xs text-slate-400" />
          <div class="flex gap-2">
            <button class="admin-btn admin-btn-secondary admin-btn-sm" id="uploadResumeBtn">Upload</button>
            <button class="admin-btn admin-btn-danger admin-btn-sm" id="deleteResumeBtn" ${profile.resumeUrl ? "" : "disabled"}>Remove</button>
          </div>
        </div>
      </div>

      <div class="admin-panel-card">
        <h3 class="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Details</h3>
        <form id="profileForm">
          <div class="grid sm:grid-cols-2 gap-x-4">
            <div class="mb-4">
              <label class="field-label" for="pf_name">Full Name</label>
              <input class="field-input" type="text" id="pf_name" value="${esc(profile.name)}" />
            </div>
            <div class="mb-4">
              <label class="field-label" for="pf_title">Title</label>
              <input class="field-input" type="text" id="pf_title" value="${esc(profile.title)}" placeholder="e.g. AI & ML Specialist" />
            </div>
          </div>

          <div class="mb-4">
            <label class="field-label" for="pf_roles">Rotating Roles (under your name)</label>
            <input class="field-input" type="text" id="pf_roles" value="${esc((profile.roles || []).join(", "))}" placeholder="Data Science, Machine Learning, AI" />
            <p class="field-hint">Comma separated — cycles under your name on the hero section.</p>
          </div>

          <div class="mb-4">
            <label class="field-label" for="pf_bio">Hero Intro (short)</label>
            <textarea class="field-textarea" id="pf_bio">${esc(profile.bio)}</textarea>
            <p class="field-hint">The short paragraph shown right under your name.</p>
          </div>

          <div class="mb-4">
            <label class="field-label" for="pf_aboutBio">About Section (longer intro)</label>
            <textarea class="field-textarea" id="pf_aboutBio" style="min-height:140px;">${esc(profile.aboutBio)}</textarea>
            <p class="field-hint">Separate paragraphs with a blank line.</p>
          </div>

          <div class="grid sm:grid-cols-2 gap-x-4">
            <div class="mb-4">
              <label class="field-label" for="pf_email">Email</label>
              <input class="field-input" type="email" id="pf_email" value="${esc(profile.email)}" />
            </div>
            <div class="mb-4">
              <label class="field-label" for="pf_phone">Phone</label>
              <input class="field-input" type="text" id="pf_phone" value="${esc(profile.phone)}" />
            </div>
            <div class="mb-4">
              <label class="field-label" for="pf_location">Location</label>
              <input class="field-input" type="text" id="pf_location" value="${esc(profile.location)}" />
            </div>
            <div class="mb-4">
              <label class="field-label" for="pf_website">Website</label>
              <input class="field-input" type="text" id="pf_website" value="${esc(profile.website)}" />
            </div>
            <div class="mb-4">
              <label class="field-label" for="pf_github">GitHub</label>
              <input class="field-input" type="text" id="pf_github" value="${esc(profile.github)}" placeholder="username or full URL" />
            </div>
            <div class="mb-4">
              <label class="field-label" for="pf_linkedin">LinkedIn</label>
              <input class="field-input" type="text" id="pf_linkedin" value="${esc(profile.linkedin)}" placeholder="username or full URL" />
            </div>
            <div class="mb-4">
              <label class="field-label" for="pf_twitter">Twitter / X</label>
              <input class="field-input" type="text" id="pf_twitter" value="${esc(profile.twitter)}" />
            </div>
          </div>

          <div id="profileFormError" class="field-error hidden"></div>
          <button type="submit" class="admin-btn admin-btn-primary mt-2" id="profileSubmitBtn">
            <span id="profileSubmitLabel">Save Profile</span>
          </button>
        </form>
      </div>
    `;

    $("#profileForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("#profileSubmitBtn");
      const label = $("#profileSubmitLabel");
      const errBox = $("#profileFormError");
      errBox.classList.add("hidden");
      btn.disabled = true;
      label.innerHTML = `<span class="admin-spinner"></span> Saving…`;

      const payload = {
        name: $("#pf_name").value,
        title: $("#pf_title").value,
        roles: $("#pf_roles").value,
        bio: $("#pf_bio").value,
        aboutBio: $("#pf_aboutBio").value,
        email: $("#pf_email").value,
        phone: $("#pf_phone").value,
        location: $("#pf_location").value,
        website: $("#pf_website").value,
        github: $("#pf_github").value,
        linkedin: $("#pf_linkedin").value,
        twitter: $("#pf_twitter").value,
      };

      try {
        await API.updateProfile(payload);
        toast("Profile saved.");
      } catch (err) {
        if (handleAuthError(err)) return;
        errBox.textContent = errMsg(err);
        errBox.classList.remove("hidden");
      } finally {
        btn.disabled = false;
        label.textContent = "Save Profile";
      }
    });

    $("#uploadPictureBtn").addEventListener("click", async () => {
      const input = $("#pictureInput");
      if (!input.files || !input.files[0]) return toast("Choose an image first.", "error");
      const formData = new FormData();
      formData.append("picture", input.files[0]);
      try {
        const res = await API.uploadProfilePicture(formData);
        toast("Profile picture updated.");
        const url = assetUrl(res.data.profilePicture);
        $("#profilePicPreview").src = url;
        $("#profilePicPreview").style.display = "";
        $("#profilePicPlaceholder").style.display = "none";
        $("#deletePictureBtn").disabled = false;
      } catch (err) {
        if (handleAuthError(err)) return;
        toast(errMsg(err), "error");
      }
    });

    $("#deletePictureBtn").addEventListener("click", async () => {
      try {
        await API.deleteProfilePicture();
        toast("Profile picture removed.");
        $("#profilePicPreview").style.display = "none";
        $("#profilePicPlaceholder").style.display = "";
        $("#deletePictureBtn").disabled = true;
      } catch (err) {
        if (handleAuthError(err)) return;
        toast(errMsg(err), "error");
      }
    });

    $("#uploadResumeBtn").addEventListener("click", async () => {
      const input = $("#resumeInput");
      if (!input.files || !input.files[0]) return toast("Choose a file first.", "error");
      const formData = new FormData();
      formData.append("resume", input.files[0]);
      try {
        await API.uploadResume(formData);
        toast("Résumé updated.");
        renderProfileTab();
      } catch (err) {
        if (handleAuthError(err)) return;
        toast(errMsg(err), "error");
      }
    });

    $("#deleteResumeBtn").addEventListener("click", async () => {
      try {
        await API.deleteResume();
        toast("Résumé removed.");
        renderProfileTab();
      } catch (err) {
        if (handleAuthError(err)) return;
        toast(errMsg(err), "error");
      }
    });
  }

  /* ---------------------------------------------------------
     ACCOUNT TAB (change password)
  --------------------------------------------------------- */
  function renderAccountTab() {
    const container = $("#tabContent");
    container.innerHTML = `
      <h2 class="text-xl font-bold text-white mb-5">Account</h2>
      <div class="admin-panel-card" style="max-width:420px;">
        <h3 class="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Change Password</h3>
        <form id="passwordForm">
          <div class="mb-4">
            <label class="field-label" for="currentPassword">Current Password</label>
            <input class="field-input" type="password" id="currentPassword" required />
          </div>
          <div class="mb-4">
            <label class="field-label" for="newPassword">New Password</label>
            <input class="field-input" type="password" id="newPassword" required minlength="6" />
            <p class="field-hint">At least 6 characters.</p>
          </div>
          <div id="passwordFormError" class="field-error hidden"></div>
          <button type="submit" class="admin-btn admin-btn-primary" id="passwordSubmitBtn">
            <span id="passwordSubmitLabel">Update Password</span>
          </button>
        </form>
      </div>
    `;

    $("#passwordForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("#passwordSubmitBtn");
      const label = $("#passwordSubmitLabel");
      const errBox = $("#passwordFormError");
      errBox.classList.add("hidden");
      btn.disabled = true;
      label.innerHTML = `<span class="admin-spinner"></span> Updating…`;

      try {
        await API.changePassword($("#currentPassword").value, $("#newPassword").value);
        toast("Password updated.");
        $("#passwordForm").reset();
      } catch (err) {
        if (handleAuthError(err)) return;
        errBox.textContent = errMsg(err);
        errBox.classList.remove("hidden");
      } finally {
        btn.disabled = false;
        label.textContent = "Update Password";
      }
    });
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  function init() {
    $("#loginForm").addEventListener("submit", handleLogin);
    $("#logoutBtn").addEventListener("click", handleLogout);
    $$(".admin-nav-btn[data-tab]").forEach((btn) =>
      btn.addEventListener("click", () => switchTab(btn.dataset.tab))
    );

    if (getToken()) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
