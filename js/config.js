/* ============================================================
   Shared config for the public site + the admin panel.
   Change API_BASE_URL if the backend isn't on localhost:5000.
   Both index.html and admin/index.html load this file.
============================================================ */
(function (root) {
  "use strict";

  const API_BASE_URL = "https://api.aleempatel.dev/api";

  // Root of the backend (without the trailing /api) - used to resolve
  // uploaded file paths like "uploads/profile-123.jpg" into full URLs.
  function apiRoot() {
    return API_BASE_URL.replace(/\/api\/?$/, "");
  }

  // Resolves a stored path/URL (profile picture, resume, project image) into
  // something a browser can load, whether it's already absolute or a
  // relative "uploads/..." path returned by the backend.
  function assetUrl(pathOrUrl) {
    if (!pathOrUrl) return "";
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    return `${apiRoot()}/${String(pathOrUrl).replace(/^\/+/, "")}`;
  }

  root.PortfolioConfig = { API_BASE_URL, apiRoot, assetUrl };
})(window);
