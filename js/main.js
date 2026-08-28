/* ============================================================
   Muhammad Aleem — AI & ML Portfolio
   Main interactivity + Three.js neural network
   (SEO-SAFE VERSION — reveal animation no longer hides content
   by default, and the Three.js block is isolated so it can never
   block the rest of the page's script from finishing.)
============================================================ */
    (() => {
      "use strict";

      /* ============================================================
         UTILITY / NAVIGATION
      ============================================================ */

      document.getElementById("year").textContent = new Date().getFullYear();

      const mobileButton = document.getElementById("mobileMenuButton");
      const mobileMenu = document.getElementById("mobileMenu");

      mobileButton.addEventListener("click", () => {
        const isOpen = !mobileMenu.classList.contains("hidden");
        mobileMenu.classList.toggle("hidden", isOpen);
        mobileMenu.classList.toggle("mobile-menu-open", !isOpen);
        mobileButton.setAttribute("aria-expanded", String(!isOpen));
        mobileButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
      });

      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
          const target = document.querySelector(link.getAttribute("href"));
          if (!target) return;

          event.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          mobileMenu.classList.add("hidden");
          mobileMenu.classList.remove("mobile-menu-open");
          mobileButton.setAttribute("aria-expanded", "false");
          mobileButton.setAttribute("aria-label", "Open navigation");
        });
      });

      const sections = [...document.querySelectorAll("main section[id]")];
      const navLinks = [...document.querySelectorAll(".nav-link")];

      const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          navLinks.forEach(link => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        });
      }, {
        rootMargin: "-35% 0px -55% 0px"
      });

      sections.forEach(section => sectionObserver.observe(section));

      /* ============================================================
         REVEAL ANIMATIONS + SKILL PROGRESS  (SEO-SAFE)
         Content is visible by default in CSS (see style.css: .reveal
         now starts at opacity:1). Here we only ADD the hidden ".pre"
         state right before observing each element that isn't already
         marked "visible" in the HTML — then remove it once the element
         scrolls into view, producing the same fade/slide effect for
         real visitors. If this script fails to run, or a renderer
         (like a search engine crawler) never scrolls, nothing was ever
         hidden in the first place — content stays fully visible.
      ============================================================ */

      const revealItems = document.querySelectorAll(".reveal");

      revealItems.forEach(el => {
        if (!el.classList.contains("visible")) el.classList.add("pre");
      });

      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          entry.target.classList.remove("pre");
          entry.target.classList.add("visible");

          // Only override a progress-fill's width from data-progress when that
          // attribute is actually present on the revealed element itself.
          // (Skill cards contain several .progress-fill bars with widths set
          // individually by app.js — grabbing just the first one here and
          // resetting it to 0% was wiping out the first skill's bar.)
          if (entry.target.dataset.progress) {
            const progress = entry.target.querySelector(".progress-fill");
            if (progress) {
              progress.style.width = entry.target.dataset.progress + "%";
            }
          }

          revealObserver.unobserve(entry.target);
        });
      }, {
        threshold: .12
      });

      revealItems.forEach(el => revealObserver.observe(el));

      // Fail-safe: force-reveal anything still marked ".pre" after 3s, in
      // case an element never intersects (e.g. a renderer that doesn't
      // scroll/resize the page, zero-height containers, or content injected
      // by app.js after this observer was already set up). This guarantees
      // nothing is left permanently invisible to a search engine.
      setTimeout(() => {
        document.querySelectorAll(".reveal.pre").forEach(el => {
          el.classList.remove("pre");
          el.classList.add("visible");
          if (el.dataset.progress) {
            const progress = el.querySelector(".progress-fill");
            if (progress) progress.style.width = el.dataset.progress + "%";
          }
        });
      }, 3000);

      // Exposed so app.js can hook animations onto cards it injects after this
      // script has already run its initial querySelectorAll pass.
      function attachTilt(card) {
        card.addEventListener("pointermove", event => {
          if (window.innerWidth < 768) return;

          // Don't keep rotating the card while the pointer is over a link/button
          // inside it - continuously moving the element under the cursor makes
          // mousedown and mouseup land on different spots, so the browser never
          // fires a "click" on it (right-click "open in new tab" still worked
          // because that's a single instantaneous hit-test, not a down/up pair).
          if (event.target.closest("a, button")) return;

          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;

          const rotateY = (x - .5) * 18;
          const rotateX = (.5 - y) * 18;

          card.style.transform =
            `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(18px) translateY(-10px) scale(1.015)`;
        });

        card.addEventListener("pointerleave", () => {
          card.style.transform = "";
        });
      }

      window.PortfolioAnimate = {
        reveal(el) {
          if (!el.classList.contains("visible")) el.classList.add("pre");
          revealObserver.observe(el);
        },
        tilt(el) { attachTilt(el); },
      };

      /* ============================================================
         CURSOR GLOW
      ============================================================ */

      const cursorGlow = document.getElementById("cursorGlow");
      let glowX = window.innerWidth / 2;
      let glowY = window.innerHeight / 2;
      let targetGlowX = glowX;
      let targetGlowY = glowY;

      window.addEventListener("pointermove", event => {
        targetGlowX = event.clientX;
        targetGlowY = event.clientY;
      }, { passive: true });

      function animateGlow() {
        glowX += (targetGlowX - glowX) * .08;
        glowY += (targetGlowY - glowY) * .08;

        cursorGlow.style.left = glowX + "px";
        cursorGlow.style.top = glowY + "px";

        requestAnimationFrame(animateGlow);
      }

      if (!window.matchMedia("(max-width: 767px), (pointer: coarse)").matches) {
        animateGlow();
      }

      /* ============================================================
         PROJECT TILT MICRO-INTERACTION
      ============================================================ */

      document.querySelectorAll(".interactive-card").forEach(attachTilt);

      /* ============================================================
         HERO ROLE ROTATOR
      ============================================================ */

      const roleRotator = document.getElementById("roleRotator");
      // Starts with sensible defaults immediately (so the hero never looks empty),
      // then app.js calls window.setPortfolioRoles(...) once the profile loads
      // from the API and the rotator picks up the new list on its next cycle.
      let roles = ["Data Science", "Machine Learning", "AI"];
      window.setPortfolioRoles = function setPortfolioRoles(newRoles) {
        if (Array.isArray(newRoles) && newRoles.length) roles = newRoles;
      };
      let roleIndex = 0;
      let roleCharIndex = 0;
      let deletingRole = false;

      function typeRole() {
        if (!roleRotator) return;

        const currentRole = roles[roleIndex];
        roleRotator.textContent = deletingRole
          ? currentRole.slice(0, roleCharIndex--)
          : currentRole.slice(0, roleCharIndex++);

        let delay = deletingRole ? 55 : 95;

        if (!deletingRole && roleCharIndex > currentRole.length) {
          deletingRole = true;
          roleCharIndex = currentRole.length;
          delay = 1100;
        } else if (deletingRole && roleCharIndex < 0) {
          deletingRole = false;
          roleIndex = (roleIndex + 1) % roles.length;
          roleCharIndex = 0;
          delay = 300;
        }

        setTimeout(typeRole, delay);
      }

      setTimeout(typeRole, 700);

      /* ============================================================
         CONTACT FORM
         Functional-styled front-end interaction.
         Replace with a real endpoint to enable server delivery.
      ============================================================ */

      const contactForm = document.getElementById("contactForm");
      const formStatus = document.getElementById("formStatus");
      const submitText = document.getElementById("submitText");

      contactForm.addEventListener("submit", async event => {
        event.preventDefault();

        const data = new FormData(contactForm);
        const name = data.get("name");
        const email = data.get("email");
        const subject = data.get("subject");
        const message = data.get("message");

        submitText.textContent = "Sending…";
        formStatus.textContent = "";

        try {
          await window.PortfolioAPI.sendContactMessage({ name, email, subject, message });

          submitText.textContent = "Message Sent ✓";
          formStatus.textContent = `Thanks ${name || "there"} — your message has been sent.`;
          formStatus.className =
            "mt-3 text-center text-[10px] font-mono text-emerald-400";
          contactForm.reset();
        } catch (err) {
          submitText.textContent = "Transmit Message";
          formStatus.textContent = err.message || "Something went wrong. Please try again.";
          formStatus.className =
            "mt-3 text-center text-[10px] font-mono text-red-400";
        }

        setTimeout(() => {
          submitText.textContent = "Transmit Message";
        }, 3500);
      });

      /* ============================================================
         THREE.JS — INTERACTIVE 3D NEURAL NETWORK
         Wrapped in try/catch: if the Three.js CDN script is slow,
         blocked, or fails for any reason (some crawler sandboxes
         restrict third-party script domains), the rest of this file
         — nav, reveal animations, contact form, role rotator, and the
         final "loaded" class below — still runs normally instead of
         the whole script silently dying partway through.
      ============================================================ */

      try {
      if (typeof THREE === "undefined") {
        throw new Error("THREE.js failed to load — skipping 3D neural network, rest of page unaffected.");
      }

      const canvas = document.getElementById("neural-canvas");
      /* mobile-neural-visibility: desktop path remains the original full neural network */
      const isMobilePerformanceMode = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        isMobilePerformanceMode ? 62 : 48,
        window.innerWidth / window.innerHeight,
        .1,
        100
      );

      camera.position.set(0, 0, 17);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !isMobilePerformanceMode,
        powerPreference: "high-performance"
      });

      const mobileRenderScale = isMobilePerformanceMode
        ? Math.min(1, 720 / Math.max(window.innerWidth, 1))
        : 1;
      renderer.setPixelRatio(isMobilePerformanceMode ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(
        isMobilePerformanceMode ? window.innerWidth * mobileRenderScale : window.innerWidth,
        isMobilePerformanceMode ? window.innerHeight * mobileRenderScale : window.innerHeight,
        false
      );
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);

      const neuralGroup = new THREE.Group();
      // Mobile only: center the network and keep its full visual footprint.
      neuralGroup.position.set(isMobilePerformanceMode ? 0 : 3.15, isMobilePerformanceMode ? 0.10 : 0.15, 0);
      neuralGroup.scale.setScalar(isMobilePerformanceMode ? .88 : 1.12);
      scene.add(neuralGroup);

      /* ---- Node construction ---- */

      const layerCounts = isMobilePerformanceMode ? [5, 7, 8, 7, 5] : [7, 10, 12, 10, 7];
      const layers = [];
      const nodes = [];
      const connections = [];

      const nodeGeometry = new THREE.SphereGeometry(.105, 14, 14);

      const materials = {
        cyan: new THREE.MeshBasicMaterial({
          color: 0x00d9ff,
          transparent: true,
          opacity: isMobilePerformanceMode ? .98 : .92
        }),
        green: new THREE.MeshBasicMaterial({
          color: 0x00f5a0,
          transparent: true,
          opacity: isMobilePerformanceMode ? .98 : .92
        }),
        violet: new THREE.MeshBasicMaterial({
          color: 0x8b5cf6,
          transparent: true,
          opacity: isMobilePerformanceMode ? .98 : .92
        })
      };

      const nodeGlowTextures = {};

      function createGlowTexture(color) {
        const size = 64;
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;

        const ctx = c.getContext("2d");
        const gradient = ctx.createRadialGradient(
          size / 2,
          size / 2,
          0,
          size / 2,
          size / 2,
          size / 2
        );

        gradient.addColorStop(0, color);
        gradient.addColorStop(.18, color.replace("1)", ".75)"));
        gradient.addColorStop(.45, color.replace("1)", ".2)"));
        gradient.addColorStop(1, color.replace("1)", "0)"));

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        return new THREE.CanvasTexture(c);
      }

      nodeGlowTextures.cyan = createGlowTexture("rgba(0,217,255,1)");
      nodeGlowTextures.green = createGlowTexture("rgba(0,245,160,1)");
      nodeGlowTextures.violet = createGlowTexture("rgba(139,92,246,1)");

      const glowMaterials = {
        cyan: new THREE.SpriteMaterial({
          map: nodeGlowTextures.cyan,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: isMobilePerformanceMode ? .62 : .78
        }),
        green: new THREE.SpriteMaterial({
          map: nodeGlowTextures.green,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: isMobilePerformanceMode ? .62 : .78
        }),
        violet: new THREE.SpriteMaterial({
          map: nodeGlowTextures.violet,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: isMobilePerformanceMode ? .48 : .55
        })
      };

      const layerColors = ["cyan", "cyan", "green", "violet", "violet"];

      layerCounts.forEach((count, layerIndex) => {
        const layer = [];

        for (let i = 0; i < count; i++) {
          const ySpread = 7.2;
          const normalized = count === 1 ? 0 : i / (count - 1) - .5;

          const x =
            (layerIndex - 2) * 2.45 +
            Math.sin(i * 1.7 + layerIndex) * .18;

          const y =
            normalized * ySpread +
            Math.sin(i * .9 + layerIndex * 1.4) * .35;

          const z =
            Math.cos(i * 1.3 + layerIndex) * 1.1 +
            (Math.random() - .5) * .8;

          const colorName = layerColors[layerIndex];
          const mesh = new THREE.Mesh(nodeGeometry, materials[colorName]);

          mesh.position.set(x, y, z);
          mesh.userData = {
            baseScale: .75 + Math.random() * .45,
            phase: Math.random() * Math.PI * 2,
            layer: layerIndex,
            index: i
          };

          const sprite = new THREE.Sprite(glowMaterials[colorName].clone());
          sprite.scale.set(.95, .95, .95);
          mesh.add(sprite);

          neuralGroup.add(mesh);
          layer.push(mesh);
          nodes.push(mesh);
        }

        layers.push(layer);
      });

      /* ---- Synaptic connections ---- */

      function addConnection(a, b) {
        const positions = new Float32Array([
          a.position.x, a.position.y, a.position.z,
          b.position.x, b.position.y, b.position.z
        ]);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3)
        );

        const color =
          Math.random() > .55
            ? 0x00d9ff
            : Math.random() > .5
              ? 0x00f5a0
              : 0x8b5cf6;

        const material = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: isMobilePerformanceMode ? .23 : .18,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        const line = new THREE.Line(geometry, material);

        line.userData = {
          a,
          b,
          phase: Math.random() * Math.PI * 2,
          strength: .10 + Math.random() * .16
        };

        neuralGroup.add(line);
        connections.push(line);
      }

      for (let layer = 0; layer < layers.length - 1; layer++) {
        const current = layers[layer];
        const next = layers[layer + 1];

        current.forEach(a => {
          const possible = [...next]
            .sort(() => Math.random() - .5)
            .slice(0, Math.min(isMobilePerformanceMode ? 5 : 7, next.length));

          possible.forEach(b => addConnection(a, b));
        });
      }

      /* ---- Traveling synaptic pulses ---- */

      const pulseGeometry = new THREE.SphereGeometry(.035, 8, 8);
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: 0x9ffaff,
        transparent: true,
        opacity: .95
      });

      const pulses = [];

      for (let i = 0; i < (isMobilePerformanceMode ? 8 : 48); i++) {
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial.clone());
        pulse.userData = {
          connection: connections[Math.floor(Math.random() * connections.length)],
          progress: Math.random(),
          speed: .0035 + Math.random() * .0065
        };
        neuralGroup.add(pulse);
        pulses.push(pulse);
      }

      /* ---- Mouse interaction ---- */

      const mouse = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0
      };

      window.addEventListener("pointermove", event => {
        mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
      }, { passive: true });

      let scrollVelocity = 0;
      let previousScroll = window.scrollY;

      window.addEventListener("scroll", () => {
        const current = window.scrollY;
        scrollVelocity = current - previousScroll;
        previousScroll = current;
      }, { passive: true });

      /* ---- Animation loop ---- */

      const clock = new THREE.Clock();

      let neuralFrame = 0;
      function animateNeural() {
        requestAnimationFrame(animateNeural);
        const elapsed = clock.getElapsedTime();

        if (isMobilePerformanceMode) {
          // Mobile: render at a stable ~30fps and avoid per-node/per-line math.
          // The network remains visually rich, but the GPU/CPU workload is much lower.
          if (++neuralFrame % 2 !== 0) return;

          neuralGroup.rotation.y += .00085;
          neuralGroup.rotation.x += .00012;

          // Keep a small number of traveling signals for life without heavy work.
          for (let i = 0; i < pulses.length; i++) {
            const pulse = pulses[i];
            const active = pulse.userData.connection;
            if (!active) continue;

            pulse.userData.progress += pulse.userData.speed * 1.45;
            if (pulse.userData.progress > 1) {
              pulse.userData.progress = 0;
              pulse.userData.connection = connections[(i + neuralFrame) % connections.length];
            }

            const connection = pulse.userData.connection;
            const a = connection.userData.a.position;
            const b = connection.userData.b.position;
            pulse.position.lerpVectors(a, b, pulse.userData.progress);
            const intensity = .48 + Math.sin(pulse.userData.progress * Math.PI) * .52;
            pulse.material.opacity = intensity;
            pulse.scale.setScalar(.55 + intensity * .45);
          }

          renderer.render(scene, camera);
          return;
        }

        // Desktop path intentionally preserved.
        const mouseX = mouse.x + (mouse.targetX - mouse.x) * .035;
        const mouseY = mouse.y + (mouse.targetY - mouse.y) * .035;
        mouse.x = mouseX;
        mouse.y = mouseY;

        neuralGroup.rotation.y += .0013 + mouse.x * .0009;
        neuralGroup.rotation.x += .00025 + mouse.y * .0007;

        const targetGroupX = 3.15 + mouse.x * .72;
        const targetGroupY = .15 + mouse.y * .35;

        neuralGroup.position.x += (targetGroupX - neuralGroup.position.x) * .018;
        neuralGroup.position.y += (targetGroupY - neuralGroup.position.y) * .018;
        neuralGroup.position.z += ((scrollVelocity * -.002) - neuralGroup.position.z) * .025;
        scrollVelocity *= .88;

        nodes.forEach(node => {
          const worldPosition = new THREE.Vector3();
          node.getWorldPosition(worldPosition);
          const normalizedX = worldPosition.x / 8;
          const normalizedY = worldPosition.y / 5;
          const dx = mouse.x - normalizedX;
          const dy = mouse.y - normalizedY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const proximity = Math.max(0, 1 - distance * 2.3);
          const pulse = .78 + Math.sin(elapsed * 2.5 + node.userData.phase) * .12 + proximity * .65;
          const base = node.userData.baseScale;
          const scale = base * (1 + proximity * .85);
          node.scale.setScalar(scale);
          const sprite = node.children[0];
          sprite.scale.set(.65 + proximity * .6 + pulse * .05, .65 + proximity * .6 + pulse * .05, 1);
          if (proximity > .05) {
            node.material.opacity = Math.min(1, .72 + proximity * .3);
            sprite.material.opacity = Math.min(1, .35 + proximity * .6);
          } else {
            node.material.opacity = .72;
            sprite.material.opacity = .4;
          }
        });

        connections.forEach(line => {
          const { a, b, phase, strength } = line.userData;
          const positions = line.geometry.attributes.position.array;
          positions[0] = a.position.x; positions[1] = a.position.y; positions[2] = a.position.z;
          positions[3] = b.position.x; positions[4] = b.position.y; positions[5] = b.position.z;
          line.geometry.attributes.position.needsUpdate = true;
          const wave = (Math.sin(elapsed * 2.1 + phase) + 1) / 2;
          line.material.opacity = strength + wave * .08;
        });

        pulses.forEach(pulse => {
          const connection = pulse.userData.connection;
          if (!connection) return;
          pulse.userData.progress += pulse.userData.speed;
          if (pulse.userData.progress > 1) {
            pulse.userData.progress = 0;
            pulse.userData.connection = connections[Math.floor(Math.random() * connections.length)];
          }
          const active = pulse.userData.connection;
          if (!active) return;
          const a = active.userData.a.position;
          const b = active.userData.b.position;
          const t = pulse.userData.progress;
          pulse.position.lerpVectors(a, b, t);
          const intensity = .6 + Math.sin(t * Math.PI) * .8;
          pulse.material.opacity = intensity;
          pulse.scale.setScalar(.65 + intensity * .55);
        });

        renderer.render(scene, camera);
      }

      animateNeural();

      /* ---- Responsive renderer ---- */

      function resizeThree() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.fov = isMobilePerformanceMode ? 62 : 48;
        camera.updateProjectionMatrix();

        renderer.setPixelRatio(isMobilePerformanceMode ? 1 : Math.min(window.devicePixelRatio, 2));
        if (isMobilePerformanceMode) {
          const scale = Math.min(1, 720 / Math.max(width, 1));
          renderer.setSize(width * scale, height * scale, false);
        } else {
          renderer.setSize(width, height, false);
        }
      }

      window.addEventListener("resize", resizeThree);

      } catch (threeErr) {
        console.warn("[neural-canvas] Skipped 3D background:", threeErr.message);
      }

      /* ============================================================
         DYNAMIC HERO DEPTH
      ============================================================ */

      const hero = document.getElementById("home");

      window.addEventListener("pointermove", event => {
        if (window.innerWidth < 900) return;

        const x = (event.clientX / window.innerWidth - .5);
        const y = (event.clientY / window.innerHeight - .5);

        const chips = hero.querySelectorAll(".floating-chip");

        chips.forEach((chip, index) => {
          const strength = (index + 1) * 5;
          chip.style.marginLeft = `${x * strength}px`;
          chip.style.marginTop = `${y * strength}px`;
        });
      }, { passive: true });

      /* ============================================================
         INITIAL LOAD
      ============================================================ */

      window.addEventListener("load", () => {
        document.body.classList.add("loaded");
      });
    })();