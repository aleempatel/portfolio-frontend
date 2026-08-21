/* ============================================================
   Fullscreen project gallery lightbox.
   Opens with window.PortfolioLightbox.open(images, title).
   Vertical scroll-snap so images glide in smoothly one by one;
   also supports arrow buttons, arrow keys, and Escape to close.
============================================================ */
(() => {
  "use strict";

  const overlay = document.getElementById("lightboxOverlay");
  const scroller = document.getElementById("lightboxScroller");
  const counter = document.getElementById("lightboxCounter");
  const titleEl = document.getElementById("lightboxTitle");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  if (!overlay || !scroller) return; // markup not present, nothing to do

  let slides = [];
  let currentIndex = 0;
  let observer = null;
  let lastFocused = null;

  function pad2(n) { return String(n).padStart(2, "0"); }

  function updateCounter(index) {
    counter.textContent = `${pad2(index + 1)} / ${pad2(slides.length)}`;
  }

  function buildSlides(images) {
    scroller.innerHTML = images
      .map(
        (src, i) => `
        <div class="lightbox-slide" data-index="${i}">
          <img src="${src}" alt="Project image ${i + 1}" loading="${i === 0 ? "eager" : "lazy"}" />
        </div>`
      )
      .join("");
    slides = Array.from(scroller.querySelectorAll(".lightbox-slide"));
  }

  function observeSlides() {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("in-view", entry.isIntersecting);
          if (entry.isIntersecting) {
            currentIndex = Number(entry.target.dataset.index);
            updateCounter(currentIndex);
          }
        });
      },
      { root: scroller, threshold: 0.6 }
    );
    slides.forEach((s) => observer.observe(s));
  }

  function scrollToIndex(index) {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    const target = slides[clamped];
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function open(images, title) {
    const list = (images || []).filter(Boolean);
    if (!list.length) return;

    lastFocused = document.activeElement;
    buildSlides(list);
    currentIndex = 0;
    updateCounter(0);
    titleEl.textContent = title || "";

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Wait a frame so the overlay is actually laid out before we observe/scroll.
    requestAnimationFrame(() => {
      scroller.scrollTop = 0;
      observeSlides();
      slides[0] && slides[0].classList.add("in-view");
    });

    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (observer) observer.disconnect();
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => scrollToIndex(currentIndex - 1));
  nextBtn.addEventListener("click", () => scrollToIndex(currentIndex + 1));

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowDown" || e.key === "ArrowRight") scrollToIndex(currentIndex + 1);
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") scrollToIndex(currentIndex - 1);
  });

  window.PortfolioLightbox = { open, close };
})();
