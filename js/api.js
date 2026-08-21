/* ============================================================
   Tiny fetch wrapper around the backend REST API.
   Shared by index.html (public, read-only) and admin/ (read+write).
============================================================ */
(function (root) {
  "use strict";

  const { API_BASE_URL } = root.PortfolioConfig;

  function authHeaders() {
    let token = null;
    try { token = localStorage.getItem("portfolio_admin_token"); } catch (e) {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function request(path, { method = "GET", body, auth = false, isForm = false } = {}) {
    const headers = { ...(auth ? authHeaders() : {}) };
    if (body && !isForm) headers["Content-Type"] = "application/json";

    let res;
    try {
      res = await fetch(`${root.PortfolioConfig.API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      });
    } catch (networkErr) {
      throw new Error("Could not reach the API. Is the backend running?");
    }

    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }

    if (!res.ok || (data && data.success === false)) {
      const message = (data && data.message) || `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  const api = {
    // ---- public reads ----
    getProfile: () => request("/profile"),
    getSkills: () => request("/skills"),
    getProjects: () => request("/projects"),
    getEducation: () => request("/education"),
    getCourses: () => request("/courses"),
    getExperience: () => request("/experience"),

    // ---- auth ----
    login: (username, password) => request("/auth/login", { method: "POST", body: { username, password } }),
    changePassword: (currentPassword, newPassword) =>
      request("/auth/change-password", { method: "PUT", body: { currentPassword, newPassword }, auth: true }),

    // ---- profile (protected writes) ----
    updateProfile: (payload) => request("/profile", { method: "PUT", body: payload, auth: true }),
    uploadProfilePicture: (formData) =>
      request("/profile/picture", { method: "POST", body: formData, auth: true, isForm: true }),
    deleteProfilePicture: () => request("/profile/picture", { method: "DELETE", auth: true }),
    uploadResume: (formData) => request("/profile/resume", { method: "POST", body: formData, auth: true, isForm: true }),
    deleteResume: () => request("/profile/resume", { method: "DELETE", auth: true }),

    // ---- generic CRUD resources ----
    list: (resource) => request(`/${resource}`),
    create: (resource, payload) => request(`/${resource}`, { method: "POST", body: payload, auth: true }),
    update: (resource, id, payload) => request(`/${resource}/${id}`, { method: "PUT", body: payload, auth: true }),
    remove: (resource, id) => request(`/${resource}/${id}`, { method: "DELETE", auth: true }),

    // ---- project images ----
    uploadProjectImages: (id, formData) =>
      request(`/projects/${id}/images`, { method: "POST", body: formData, auth: true, isForm: true }),
    deleteProjectImage: (id, index) => request(`/projects/${id}/images/${index}`, { method: "DELETE", auth: true }),
  };

  root.PortfolioAPI = api;
})(window);
