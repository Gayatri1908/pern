const siteData = {
  brand: {
    name: "The Source-Company",
    tagline: "Engineering The next wave of Power",
    email: "support@thesource-company.com",
    phone: "+91 xxxxx-xxxxx",
    logo: "assets/images/99.png",
    footerLogo: "assets/images/99.png"
  },
  nav: [
    { key: "home", label: "Home", href: "index.html" },
    {
      key: "products",
      label: "Products",
      href: "products.html",
      children: [
        { label: "Silo Series", href: "domain.html?domain=storage" }
      ]
    },
    {
      key: "services",
      label: "Services",
      href: "services.html",
      children: [
        { label: "System Design & Installation", href: "services.html#services-design" },
        { label: "Monitoring and Maintenance", href: "services.html#services-monitoring" }
      ]
    },
    { key: "applications", label: "Applications", href: "applications.html" },
    { key: "charging-stations", label: "Charging Stations", href: "charging-stations.html" },
    { key: "contact", label: "Contact", href: "contact.html" }
  ],
  // Application cards use their own images so they can be updated without
  // changing the shared home/domain theme artwork.
  applicationsPreview: [
    {
      title: "High-Tension Power Lines",
      description: "Reinforced lightweight conductors withstand continuous mechanical tension and wind loading while delivering efficient power transmission.High fatigue resistance ensures stable long-duration operation of airborne platforms.",
      image: "assets/images/hight tension power lines.jpeg",
      imageAlt: "High-tension power infrastructure"
    },
    {
      title: "Water-Resistant Systems",
      description: "Marine-grade sealing and corrosion-resistant materials protect electrical systems from moisture and salt exposure. Water-based deployment improves efficiency through natural cooling and enables large-scale installation on unused water bodies.",
      image: "assets/images/water resistant systems.jpeg",
      imageAlt: "Water-resistant energy system deployment"
    },
    {
      title: "Multilayer Architectre",
      description: "Pressure-rated enclosures, redundant sealing, and relief mechanisms ensure reliability in extreme hydrostatic environments. Layered protection prevents structural failure and safeguards critical electronics from water ingress.",
      image: "assets/images/multilayerarchitecture.jpeg",
      imageAlt: "Multilayer marine system architecture"
    },
    {
      title: "Micropored FC systems",
      description: "Micro-porous electrodes increase reaction surface area, improving energy density and electrochemical efficiency. The design enables compact hydrogen storage with enhanced thermal stability and rapid energy conversion.",
      image: "assets/images/micropored fc.jpeg",
      imageAlt: "Microporous fuel cell systems"
    },
    {
      title: "Hydrogen-Lift Blimps",
      description: "Hydrogen provides higher lift capacity and significantly lower operational cost compared with helium. Modern multilayer gas cells and controlled safety systems enable practical and scalable hydrogen-based aerostat deployment.",
      image: "assets/images/hydrogen lift blimps.jpeg",
      imageAlt: "Hydrogen-lift aerial platform"
    }
  ],
  systemBlueprints: {
    thermus: {
      name: "Thermus",
      category: "Thermal Transfer Platform",
      subsections: [
        {
          slug: "core",
          title: "Thermus Core",
          summary: "Primary thermal balancing and load prediction logic.",
          bullets: [
            "Dynamic temperature profiling",
            "Thermal reserve forecasting",
            "Continuous heat path tuning"
          ]
        },
        {
          slug: "transfer",
          title: "Thermus Transfer",
          summary: "Energy exchange pathways for controlled heat movement.",
          bullets: [
            "Closed-loop transfer optimization",
            "Adaptive flow setpoints",
            "Multi-medium compatibility"
          ]
        },
        {
          slug: "monitor",
          title: "Thermus Monitor",
          summary: "High-density thermal observation with predictive alerts.",
          bullets: [
            "Hotspot detection layers",
            "Sensor confidence monitoring",
            "Thermal trend analytics"
          ]
        },
        {
          slug: "reactor",
          title: "Thermus Reactor",
          summary: "Protected control around thermal process events and transitions.",
          bullets: [
            "Guarded process envelopes",
            "Automated intervention thresholds",
            "Integrated safety responses"
          ]
        }
      ],
      baseSpecs: [
        { label: "Control Cadence", value: "Adaptive thermal loop management" },
        { label: "Safety Logic", value: "Multi-zone fail-safe intervention" }
      ]
    },
    dynamus: {
      name: "Dynamus",
      category: "Motion And Force System",
      subsections: [
        {
          slug: "drive",
          title: "Dynamus Drive",
          summary: "Drive control for torque, thrust, and multi-axis motion output.",
          bullets: [
            "Adaptive power delivery",
            "Dynamic load compensation",
            "Wear-aware drive calibration"
          ]
        },
        {
          slug: "control",
          title: "Dynamus Control",
          summary: "Sequencing logic for motion events, overrides, and safe transitions.",
          bullets: [
            "Scenario-based motion profiles",
            "Operator lockout safeguards",
            "Coordinated actuator timing"
          ]
        },
        {
          slug: "force",
          title: "Dynamus Force",
          summary: "Force management for constrained environments and precision handling.",
          bullets: [
            "Pressure and torque balancing",
            "Real-time resistance feedback",
            "High-cycle durability logic"
          ]
        },
        {
          slug: "motion",
          title: "Dynamus Motion",
          summary: "Path execution and position assurance across moving assemblies.",
          bullets: [
            "Sub-millimeter path correction",
            "Vibration-aware trajectory updates",
            "Closed-loop feedback stabilization"
          ]
        }
      ],
      baseSpecs: [
        { label: "Control Layer", value: "Closed-loop servo orchestration" },
        { label: "Service Model", value: "Modular actuator replacement" }
      ]
    },
    reactus: {
      name: "Reactus",
      category: "Reactive Process Platform",
      subsections: [
        {
          slug: "core",
          title: "Reactus Core",
          summary: "Recipe control and condition management for active processes.",
          bullets: [
            "Multi-stage process scheduling",
            "State-aware control transitions",
            "Integrated safety checkpoints"
          ]
        },
        {
          slug: "chamber",
          title: "Reactus Chamber",
          summary: "Protected operating environment for reaction stability and containment.",
          bullets: [
            "Pressure envelope protection",
            "Material-compatible chamber design",
            "Automated purge readiness"
          ]
        },
        {
          slug: "catalyst",
          title: "Reactus Catalyst",
          summary: "Catalyst and reagent handling for consistent output quality.",
          bullets: [
            "Precision dosing control",
            "Consumable lifecycle tracking",
            "Closed-loop quality assurance"
          ]
        },
        {
          slug: "control",
          title: "Reactus Control",
          summary: "Operator supervision, intervention logic, and compliance traceability.",
          bullets: [
            "Guided intervention paths",
            "Traceable event logging",
            "Exception response workflows"
          ]
        }
      ],
      baseSpecs: [
        { label: "Recipe Engine", value: "Stage-based process orchestration" },
        { label: "Quality Layer", value: "Traceable control and audit records" }
      ]
    }
  },
  domains: {
    storage: {
      name: "Silo",
      theme: "theme-storage",
      heading: "Silo Series",
      showcaseDescription: "Power reserves for unexpected surges.",
      overview: "Silo provides advanced energy storage systems designed to capture surplus power and release it precisely when demand rises. By stabilizing supply across renewable sources, it ensures continuous energy delivery while effectively handling sudden power surges and generation fluctuations. Built for scalable grid integration, Silo strengthens long-term energy resilience and supports balanced power distribution across modern energy networks.",
      stats: [
        { label: "Primary Focus", value: "Energy reserve systems" },
        { label: "Deployment Model", value: "Grid and campus installations" },
        { label: "System Trait", value: "High-availability energy control" }
      ],
      systems: {
        thermus: {
          summary: "Sand-based energy storage systems store excess energy as thermal heat within high-capacity sand reservoirs, enabling efficient long-duration energy storage with low-cost and abundant materials. The stored heat can be retained for extended periods and converted back into usable energy, providing stable grid support and effective management of power surges.",
          overview: "Storage Thermus manages cell temperatures, cooling pathways, and anomaly detection to protect energy assets during charge, discharge, and standby modes.",
          features: [
            "Cell temperature equalization across pack groups",
            "Adaptive cooling for shifting load conditions",
            "Pre-conditioning logic for optimal dispatch readiness",
            "Thermal runaway detection with staged response"
          ],
          specs: [
            { label: "Thermal Range", value: "-20C to 120C" },
            { label: "Transfer Media", value: "Cold plate or refrigerant loop" },
            { label: "Sensor Density", value: "160 cell-group channels" },
            { label: "Safety Layer", value: "Emergency thermal purge" }
          ],
          applications: [
            "Grid battery facilities",
            "EV charging depots",
            "Critical backup power systems"
          ]
        },
        reactus: {
          summary: "Hydrogen fuel cell storage systems convert surplus electricity into hydrogen and deliver clean on-demand power, providing a zero-emission alternative to conventional diesel generators. Their high energy density and modular architecture enable quiet, reliable backup power and long-duration energy supply without fuel combustion or particulate emissions",
          overview: "Storage Reactus manages chemistry conditioning, gas handling, and controlled process transitions for advanced storage and conversion programs.",
          features: [
            "Chemistry stabilization under variable states of charge",
            "Gas handling and chamber protection workflows",
            "Controlled conversion routines for hybrid systems",
            "High-safety process transitions with traceable logic"
          ],
          specs: [
            { label: "Chamber Pressure", value: "Up to 30 bar" },
            { label: "Chemistry Support", value: "Lithium, sodium, hybrid lines" },
            { label: "Control Model", value: "Recipe-based conversion engine" },
            { label: "Containment", value: "Vented high-safety cabinets" }
          ],
          applications: [
            "Hybrid storage labs",
            "Conditioning skids",
            "Pilot chemistry programs"
          ]
        }
      }
    }
  }
};

const domainSystemCardSlides = {
  terra: {
    helius: [
      { src: "assets/images/SR-124.jpg", label: "Industry Solar", productId: "TH-552" },
      { src: "assets/images/TH-133.jpg", label: "Residency Solar", productId: "TH-133" },
    ],
    reactus: [
      { src: "assets/images/TR-342.jpg", label: "Industry Fuel Cells", productId: "TR-342" },
      { src: "assets/images/TR-233.jpeg", label: "Residency Fuel Cells", productId: "TR-233" },
    ]
  },
  hydra: {
    helius: [
      { src: "assets/images/HH-441.jpeg", label: "Solar Grid", productId: "HH-441" }
    ],
    dynamus: [
      { src: "assets/images/HD-541.jpeg", label: "Wave Energy Converter", productId: "HD-541" },
      { src: "assets/images/HD-551.jpeg", label: "Tidal Energy Converter", productId: "HD-551" }
    ]
  },
  aero: {
    helius: [
      { src: "assets/images/AH-231.png", label: "Aerial Solar", productId: "AH-231" }
    ],
    dynamus: [
      { src: "assets/images/AD-241.jpg", label: "Turbine to Industry", productId: "AD-341" },
      { src: "assets/images/AD-651.png", label: "Turbine to Grid", productId: "AD-651" }
    ]
  },
  storage: {
    thermus: [
      { src: "assets/images/sand battery.jpg", label: "Sand based Storage", productId: "ST-551" }
    ],
    reactus: [
      { src: "assets/images/SR-341.jpg", label: "Hydrogen Based Storage", productId: "SR-341" },
      { src: "assets/images/TR-233.jpeg", label: "Portable Hydrogen Based Storage", productId: "SR-124" }
    ]
  }
};

const THEME_STORAGE_KEY = "site-theme";
const COOKIE_CONSENT_KEY = "site-cookie-consent";
const COOKIE_LIFETIME_DAYS = 180;

function getCookie(name) {
  if (typeof document === "undefined" || !document.cookie) {
    return "";
  }

  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : "";
}

function setCookie(name, value, days = COOKIE_LIFETIME_DAYS) {
  if (typeof document === "undefined") {
    return;
  }

  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function readStoredPreference(key) {
  const cookieValue = getCookie(key);
  if (cookieValue) {
    return cookieValue;
  }

  try {
    // Migrate legacy localStorage values into cookies so older visits keep
    // their saved theme without maintaining two separate preference systems.
    const legacyValue = window.localStorage.getItem(key);
    if (legacyValue) {
      setCookie(key, legacyValue);
      return legacyValue;
    }
  } catch (_error) {
    return "";
  }

  return "";
}

function persistPreference(key, value) {
  setCookie(key, value);

  try {
    window.localStorage.setItem(key, value);
  } catch (_error) {
    // Ignore private-mode storage failures and keep the cookie as the source of truth.
  }
}

function getSystemCardSlides(domainSlug, systemSlug) {
  return domainSystemCardSlides[domainSlug]?.[systemSlug] || [];
}

function renderSystemCardSlider(domainSlug, systemSlug) {
  const slides = getSystemCardSlides(domainSlug, systemSlug);
  if (slides.length === 0) {
    return "";
  }

  return `
    <div class="system-card-slider" data-system-card-slider>
      <div class="system-card-track">
        ${slides.map((slide) => `
          <figure class="system-card-slide">
            <img src="${slide.src}" alt="${slide.label} ${slide.productId}" loading="lazy" decoding="async">
            <span class="system-card-product-id">${slide.productId}</span>
            <figcaption>${slide.label}</figcaption>
          </figure>
        `).join("")}
      </div>
      <div class="system-card-controls">
        <button class="system-card-button" type="button" data-direction="-1" aria-label="Show previous image">
          <span aria-hidden="true">&larr;</span>
        </button>
        <button class="system-card-button" type="button" data-direction="1" aria-label="Show next image">
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </div>
  `;
}

function attachSystemCardSliders() {
  const sliders = document.querySelectorAll("[data-system-card-slider]");
  if (sliders.length === 0) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  sliders.forEach((slider) => {
    const track = slider.querySelector(".system-card-track");
    const slides = slider.querySelectorAll(".system-card-slide");
    const buttons = slider.querySelectorAll(".system-card-button");

    if (!track || slides.length === 0) {
      return;
    }

    if (slides.length === 1) {
      slides[0].classList.add("is-active");
      return;
    }

    let index = 0;
    let intervalId = null;
    let inViewport = true;

    function render() {
      track.style.transform = `translate3d(${-100 * index}%, 0, 0)`;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === index);
      });
    }

    function step(direction) {
      index = (index + direction + slides.length) % slides.length;
      render();
    }

    function stopAutoRotate() {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    }

    function startAutoRotate() {
      if (prefersReducedMotion || intervalId || document.hidden || !inViewport) {
        return;
      }

      intervalId = window.setInterval(() => {
        step(1);
      }, 4800);
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const direction = Number(button.dataset.direction || "1") === -1 ? -1 : 1;
        stopAutoRotate();
        step(direction);
        startAutoRotate();
      });
    });

    slider.addEventListener("mouseenter", stopAutoRotate);
    slider.addEventListener("mouseleave", startAutoRotate);
    slider.addEventListener("focusin", stopAutoRotate);
    slider.addEventListener("focusout", (event) => {
      if (!(event.relatedTarget instanceof Element) || !slider.contains(event.relatedTarget)) {
        startAutoRotate();
      }
    });

    // Pause background carousel work when the slider is off-screen so motion
    // remains smooth for the visible content.
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          inViewport = Boolean(entry?.isIntersecting);

          if (inViewport) {
            startAutoRotate();
          } else {
            stopAutoRotate();
          }
        },
        {
          threshold: 0.35
        }
      );

      observer.observe(slider);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAutoRotate();
      } else {
        startAutoRotate();
      }
    });

    render();
    startAutoRotate();
  });
}

function preferredTheme() {
  const storedTheme = readStoredPreference(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.body.classList.toggle("theme-dark", nextTheme === "dark");
  document.body.classList.toggle("theme-light", nextTheme === "light");
  document.documentElement.style.colorScheme = nextTheme;
  persistPreference(THEME_STORAGE_KEY, nextTheme);

  const themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    const isDark = nextTheme === "dark";
    const label = themeToggle.querySelector(".theme-toggle-label");
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    if (label) {
      label.textContent = isDark ? "Light" : "Dark";
    }
  }
}

function renderCookieBanner() {
  if (typeof document === "undefined" || document.querySelector("[data-cookie-banner]")) {
    return;
  }

  const hasSavedChoice = Boolean(getCookie(COOKIE_CONSENT_KEY));

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <aside class="cookie-banner${hasSavedChoice ? " is-hidden" : ""}" data-cookie-banner role="dialog" aria-label="Cookie preferences" aria-hidden="${hasSavedChoice ? "true" : "false"}">
        <div class="cookie-banner-copy">
          <strong>Cookie preferences</strong>
          <p>We use cookies to remember your theme and core site settings so the experience stays consistent across every page.</p>
        </div>
        <div class="cookie-banner-actions">
          <button class="cookie-banner-button is-secondary" type="button" data-cookie-choice="essential">Essential only</button>
          <button class="cookie-banner-button" type="button" data-cookie-choice="accepted">Allow cookies</button>
        </div>
      </aside>
      <button class="cookie-settings-toggle${hasSavedChoice ? " is-visible" : ""}" type="button" data-open-cookie-banner aria-label="Open cookie settings">
        Cookie settings
      </button>
    `
  );
}

function attachCookieBanner() {
  const banner = document.querySelector("[data-cookie-banner]");
  const openButton = document.querySelector("[data-open-cookie-banner]");
  const choiceButtons = document.querySelectorAll("[data-cookie-choice]");

  if (!banner || !openButton || choiceButtons.length === 0) {
    return;
  }

  function syncCookieUI(isVisible) {
    banner.classList.toggle("is-hidden", !isVisible);
    banner.setAttribute("aria-hidden", String(!isVisible));
    openButton.classList.toggle("is-visible", !isVisible);
  }

  // Keep the floating settings control available after a decision so visitors
  // can reopen the banner and update their preference later.
  choiceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.getAttribute("data-cookie-choice") === "accepted" ? "accepted" : "essential";
      setCookie(COOKIE_CONSENT_KEY, choice);
      syncCookieUI(false);
    });
  });

  openButton.addEventListener("click", () => {
    syncCookieUI(true);
  });

  syncCookieUI(!getCookie(COOKIE_CONSENT_KEY));
}

function pageKey() {
  const raw = document.body.dataset.page || "home";
  return raw === "domain" || raw === "system" ? "products" : raw;
}

function setMetaDescription(content) {
  const tag = document.querySelector('meta[name="description"]');
  if (tag && content) {
    tag.setAttribute("content", content);
  }
}

function getAppLoginUrl() {
  if (typeof window === "undefined") return "http://localhost:3001/login";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return `${window.location.protocol}//${host}:3001/login`;
  }
  if (host.includes("thesource-company.in")) {
    return "https://portal.thesource-company.in/login";
  }
  return `${window.location.protocol}//${host}:3001/login`;
}

function getApiBaseUrl() {
  if (typeof window === "undefined") return "http://localhost:8000";
  const host = window.location.hostname;
  return `${window.location.protocol}//${host}:8000`;
}

function renderHeader() {
  const target = document.getElementById("site-header");
  if (!target) {
    return;
  }

  const current = pageKey();
  const links = siteData.nav
    .map((item) => {
      const active = item.key === current ? " active" : "";
      if (!item.children || item.children.length === 0) {
        return `<a class="nav-link${active}" href="${item.href}">${item.label}</a>`;
      }

      // Group child links under one parent item so the mobile flyout can show
      // drill-down navigation without turning the desktop header into a mega menu.
      const childLinks = item.children
        .map((child) => `<a class="nav-sublink" href="${child.href}">${child.label}</a>`)
        .join("");

      return `
        <div class="nav-group${active ? " is-active" : ""}">
          <a class="nav-link${active}" href="${item.href}">${item.label}</a>
          <div class="nav-submenu">
            ${childLinks}
          </div>
        </div>
      `;
    })
    .join("");

  target.innerHTML = `
    <header class="site-header">
      <div class="nav-overlay" data-close-menu></div>
      <div class="nav-shell">
        <a class="brand" href="index.html" aria-label="${siteData.brand.name} home">
          <img class="brand-logo" src="${siteData.brand.logo}" alt="${siteData.brand.name}">
        </a>
        <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">
          <span class="nav-toggle-line" aria-hidden="true"></span>
          <span class="nav-toggle-line" aria-hidden="true"></span>
          <span class="nav-toggle-line" aria-hidden="true"></span>
        </button>
        <nav class="site-nav" aria-label="Primary navigation">
          <button class="theme-toggle" type="button" aria-label="Toggle dark mode" aria-pressed="false" style="margin-right: 8px;">
            <span class="theme-toggle-icon" aria-hidden="true"></span>
            <span class="theme-toggle-label">Dark</span>
          </button>
          ${links}
          <a class="nav-link login-btn" href="${getAppLoginUrl()}">Login</a>
        </nav>
      </div>
    </header>
  `;
}

function renderFooter() {
  const target = document.getElementById("site-footer");
  if (!target) {
    return;
  }

  const links = siteData.nav
    .map((item) => `<a href="${item.href}">${item.label}</a>`)
    .join("");

  target.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="brand" href="index.html">
              <img class="brand-logo footer-logo" src="${siteData.brand.footerLogo}" alt="${siteData.brand.name}">
            </a>
            <p>${siteData.brand.tagline}</p>
          </div>
          <div class="footer-links">
            <h4>Navigation</h4>
            ${links}
          </div>
          <div class="footer-meta">
            <h4>Contact</h4>
            <a href="mailto:${siteData.brand.email}">${siteData.brand.email}</a>
            
            <span>Bengaluru, India</span>
          </div>
        </div>
        <div class="footer-copy">Copyright ${new Date().getFullYear()} ${siteData.brand.name}. All rights reserved.
      </div>
    </footer>
  `;
}

function attachHeaderBehavior() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const overlay = document.querySelector("[data-close-menu]");
  const navLinks = document.querySelectorAll(".site-nav a");
  const themeToggle = document.querySelector(".theme-toggle");

  function closeMenu() {
    document.body.classList.remove("menu-open");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  function openMenu() {
    document.body.classList.add("menu-open");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
    }
  }

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = document.body.classList.contains("menu-open");
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener("click", closeMenu);
  }

  // Mirror native drawer behavior on mobile by closing the flyout whenever the
  // pointer lands outside the nav panel or the toggle itself.
  document.addEventListener("pointerdown", (event) => {
    if (!document.body.classList.contains("menu-open") || window.innerWidth > 880) {
      return;
    }

    if (!(event.target instanceof Element)) {
      return;
    }

    if (event.target.closest(".site-nav") || event.target.closest(".nav-toggle")) {
      return;
    }

    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  if (themeToggle) {
    applyTheme(document.body.classList.contains("theme-dark") ? "dark" : "light");
    themeToggle.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("theme-dark") ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 880) {
      closeMenu();
    }
  });

  function syncHeaderState() {
    const isScrolled = document.body.classList.contains("is-scrolled");
    const nextScrollY = window.scrollY;

    if (!isScrolled && nextScrollY > 32) {
      document.body.classList.add("is-scrolled");
    } else if (isScrolled && nextScrollY < 12) {
      document.body.classList.remove("is-scrolled");
    }
  }

  window.addEventListener("scroll", syncHeaderState, { passive: true });
  syncHeaderState();
}

function domainEntries() {
  return Object.entries(siteData.domains);
}

function renderHomeShowcase() {
  const target = document.querySelector('[data-render="home-showcase"]');
  if (!target) {
    return;
  }

  target.innerHTML = domainEntries()
    .map(([slug, domain]) => {
      return `
        <article class="application-card" data-reveal>
          <div class="card-visual ${domain.theme}"></div>
          <div class="cinematic-content">
            <span class="eyebrow">${domain.name} Systems</span>
            <h3>${domain.name}</h3>
            <p>${domain.showcaseDescription}</p>
            <a class="button" href="domain.html?domain=${slug}">Explore ${domain.name}</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderProductsGrid() {
  const target = document.querySelector('[data-render="products-grid"]');
  if (!target) {
    return;
  }

  target.innerHTML = domainEntries()
    .map(([slug, domain]) => {
      const description = domain.showcaseDescription || domain.overview || "";
      return `
        <article class="application-card" data-reveal>
          <div class="card-visual ${domain.theme}"></div>
          <span class="eyebrow">${domain.name} Domain</span>
          <h3>${domain.heading}</h3>
          <p class="domain-card-summary">${description}</p>
          <a class="link-arrow" href="domain.html?domain=${slug}">Open ${domain.name}</a>
        </article>
      `;
    })
    .join("");
}

function renderApplicationPreview() {
  const target = document.querySelector('[data-render="application-preview"]');
  if (!target) {
    return;
  }

  target.innerHTML = siteData.applicationsPreview
    .map((item) => {
      return `
        <article class="application-card" data-reveal>
          <div class="card-visual application-card-visual">
            <img src="${item.image}" alt="${item.imageAlt || item.title}" loading="lazy" decoding="async">
          </div>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </article>
      `;
    })
    .join("");
}

function getDomainFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const domainSlug = (params.get("domain") || "storage").toLowerCase();
  return {
    slug: siteData.domains[domainSlug] ? domainSlug : "storage",
    data: siteData.domains[domainSlug] || siteData.domains.storage
  };
}

function getSystemFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const systemSlug = (params.get("system") || "thermus").toLowerCase();
  const blueprint = siteData.systemBlueprints[systemSlug] || siteData.systemBlueprints.thermus;
  const safeSlug = siteData.systemBlueprints[systemSlug] ? systemSlug : "thermus";
  return { slug: safeSlug, blueprint };
}
function renderDomainPage() {
  const target = document.getElementById("domain-page");
  if (!target) {
    return;
  }

  const { slug, data: domain } = getDomainFromUrl();
  const systemCards = Object.entries(domain.systems)
    .map(([systemSlug, systemData]) => {
      const blueprint = siteData.systemBlueprints[systemSlug];
      return `
        <article class="system-card" data-reveal>
          ${renderSystemCardSlider(slug, systemSlug)}
          <span class="eyebrow">${blueprint.category}</span>
          <h3>${blueprint.name}</h3>
          <p>${systemData.summary}</p>
          <!-- <a class="link-arrow" href="system.html?domain=${slug}&system=${systemSlug}">View ${blueprint.name}</a> -->
        </article>
      `;
    })
    .join("");

  const stats = domain.stats
    .map((item) => {
      return `
        <article class="summary-card" data-reveal>
          <span class="eyebrow">${item.label}</span>
          <strong>${item.value}</strong>
        </article>
      `;
    })
    .join("");

  document.title = `${domain.name} | ${siteData.brand.name}`;
  setMetaDescription(`${domain.name} systems from ${siteData.brand.name}. ${domain.overview || domain.showcaseDescription || ""}`);

  target.innerHTML = `
    <section class="page-hero ${domain.theme}">
      <div class="container page-hero-content title-only" data-reveal>
        <h1>${domain.heading}</h1>
      </div>
    </section>

    <section class="content-band">
      <div class="container domain-intro">
        <div class="section-heading" data-reveal>
          <span class="eyebrow">Technology Overview</span>
          <p>${domain.overview || domain.showcaseDescription}</p>
        </div>
        <div class="summary-grid">
          ${stats}
        </div>
      </div>
    </section>

    <section class="content-band muted-band" id="systems">
      <div class="container">
        <div class="section-heading" data-reveal>
          <span class="eyebrow">System Portfolio</span>
          <h2>Navigate the ${domain.name} system family.</h2>
          <p>Every ${domain.name} deployment is structured around two primary systems.</p>
        </div>
        <div class="system-grid">
          ${systemCards}
        </div>
      </div>
    </section>

    <section class="cta-band">
      <div class="container cta-shell" data-reveal>
        <span class="eyebrow">Program Consultation</span>
        <h2>Need a domain-level briefing for ${domain.name}?</h2>
        <p>Our engineering teams can translate portfolio structure into deployment planning, site architecture, and system selection.</p>
        <a class="button" href="contact.html">Request Consultation</a>
      </div>
    </section>
  `;
}

function renderSystemPage() {
  const target = document.getElementById("system-page");
  if (!target) {
    return;
  }

  const { slug: domainSlug, data: domain } = getDomainFromUrl();
  const { slug: systemSlug, blueprint } = getSystemFromUrl();
  const systemData = domain.systems[systemSlug] || domain.systems.helius;
  const activeSystemSlug = domain.systems[systemSlug] ? systemSlug : "helius";
  const specs = [...systemData.specs, ...blueprint.baseSpecs];
  const overviewVisual = activeSystemSlug === "helius"
    ? `<div class="card-visual ${domain.theme} system-overview-visual" data-reveal aria-hidden="true"></div>`
    : "";
  const heroSpecs = specs
    .slice(0, 3)
    .map((item) => {
      return `
        <article class="summary-card" data-reveal>
          <span class="eyebrow">${item.label}</span>
          <strong>${item.value}</strong>
        </article>
      `;
    })
    .join("");

  const subsectionCards = blueprint.subsections
    .map((subsection) => {
      return `
        <article class="module-card" id="${activeSystemSlug}-${subsection.slug}" data-reveal>
          ${domain.theme === "theme-hydra" ? '<div class="module-visual theme-hydra" aria-hidden="true"></div>' : ""}
          <span class="eyebrow">${subsection.title}</span>
          <h3>${subsection.summary}</h3>
          <p>This layer is tuned for ${domain.name} deployments and supports ${systemData.summary.toLowerCase()}</p>
          <ul>
            ${subsection.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
          </ul>
        </article>
      `;
    })
    .join("");

  const featureList = systemData.features
    .map((feature) => `<li>${feature}</li>`)
    .join("");

  const specsMarkup = specs
    .map((item) => {
      return `
        <article class="spec-item" data-reveal>
          <strong>${item.label}</strong>
          <span>${item.value}</span>
        </article>
      `;
    })
    .join("");

  const applicationsMarkup = systemData.applications
    .map((item) => {
      return `
        <article class="application-card" data-reveal>
          <div class="card-visual ${domain.theme}"></div>
          <h3>${item}</h3>
          <p>${blueprint.name} extends into this application with a modular control layer, clear operator visibility, and resilient deployment packaging.</p>
        </article>
      `;
    })
    .join("");

  document.title = `${domain.name} ${blueprint.name} | ${siteData.brand.name}`;
  setMetaDescription(`${domain.name} ${blueprint.name} from ${siteData.brand.name}. ${systemData.summary}`);

  target.innerHTML = `
    <section class="page-hero ${domain.theme}">
      <div class="container page-hero-content title-only" data-reveal>
        <h1>${blueprint.name}</h1>
      </div>
    </section>

    <section class="content-band">
      <div class="container system-overview-shell">
        <div class="section-heading" data-reveal>
          <span class="eyebrow">Technology Overview</span>
          <h2>${blueprint.name} is the ${blueprint.category.toLowerCase()} within ${domain.name}.</h2>
          <p>${systemData.overview}</p>
        </div>
        ${overviewVisual}
        <div class="summary-grid">
          ${heroSpecs}
        </div>
      </div>
    </section>

    <section class="content-band muted-band" id="subsections">
      <div class="container">
        <div class="section-heading" data-reveal>
          <span class="eyebrow">Subsection Navigation</span>
          <h2>Navigate the ${blueprint.name} subsystem stack.</h2>
          <p>The four core subsections organize runtime logic, controls, sensing, and deployment pathways into clear modules.</p>
        </div>
        <div class="module-grid">
          ${subsectionCards}
        </div>
      </div>
    </section>

    <section class="content-band" id="features">
      <div class="container split-layout">
        <div data-reveal>
          <div class="section-heading">
            <span class="eyebrow">Feature List</span>
            <h2>Key operating capabilities.</h2>
            <p>${domain.name} ${blueprint.name} is designed for premium performance, clear supervision, and modular scaling.</p>
          </div>
          <ul class="feature-list">
            ${featureList}
          </ul>
        </div>
        <div data-reveal id="specifications">
          <div class="section-heading">
            <span class="eyebrow">Technical Specifications</span>
            <h2>Core specification envelope.</h2>
            <p>Technical characteristics combine domain-specific operating requirements with the shared ${blueprint.name} platform model.</p>
          </div>
          <div class="spec-grid">
            ${specsMarkup}
          </div>
        </div>
      </div>
    </section>

    <section class="content-band" id="applications">
      <div class="container">
        <div class="section-heading" data-reveal>
          <span class="eyebrow">Applications</span>
          <h2>Deployment profiles for ${domain.name} ${blueprint.name}.</h2>
        </div>
        <div class="card-grid">
          ${applicationsMarkup}
        </div>
      </div>
    </section>

    <section class="cta-band">
      <div class="container cta-shell" data-reveal>
        <span class="eyebrow">Engineering Support</span>
        <h2>Need a detailed brief for ${domain.name} ${blueprint.name}?</h2>
        <p>We can share fit guidance, system mapping, and program-level architecture recommendations.</p>
        <a class="button" href="contact.html">Talk To Engineering</a>
      </div>
    </section>
  `;
}

function attachContactForm() {
  const form = document.getElementById("contact-form");
  const response = document.getElementById("form-response");
  const submitButton = form?.querySelector('button[type="submit"]');
  if (!form || !response || !submitButton) {
    return;
  }

  function setResponseState(message, tone = "success", mailtoLink = "") {
    response.textContent = "";
    response.classList.remove("is-success", "is-error");
    response.classList.add(tone === "error" ? "is-error" : "is-success");
    response.append(document.createTextNode(message));

    if (mailtoLink) {
      response.append(document.createTextNode(" "));
      const link = document.createElement("a");
      link.href = mailtoLink;
      link.textContent = "Email us directly";
      response.append(link);
    }
  }

  // This site is static, so the most reliable end-to-end contact flow is to
  // open the visitor's mail client with a fully populated inquiry draft.
  function buildInquiryMailto(fields) {
    const subjectParts = ["Website inquiry"];
    if (fields.organization) {
      subjectParts.push(`from ${fields.organization}`);
    }

    const subject = `${subjectParts.join(" ")} (${fields.name})`;
    const body = [
      `Name: ${fields.name}`,
      `Email: ${fields.email}`,
      `Organization: ${fields.organization || "Not provided"}`,
      "",
      "Message:",
      fields.message
    ].join("\n");

    return `mailto:${siteData.brand.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const fields = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      organization: String(formData.get("organization") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };

    const firstMissingField = Object.entries({
      name: fields.name,
      email: fields.email,
      message: fields.message
    }).find(([, value]) => !value)?.[0];

    if (firstMissingField) {
      form.querySelector(`[name="${firstMissingField}"]`)?.focus();
      setResponseState("Please complete the required fields before sending your inquiry.", "error");
      return;
    }

    const mailtoLink = buildInquiryMailto(fields);
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    setResponseState("Sending inquiry...", "success");

    // Try submitting to CRM api first
    fetch("/api/v1/leads/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(fields)
    })
      .then(async (res) => {
        if (res.status === 201) {
          setResponseState("Inquiry sent successfully to our engineering team! We will follow up shortly.", "success");
          form.reset();
        } else {
          throw new Error("API responded with non-201 status");
        }
      })
      .catch((err) => {
        console.warn("CRM Ingestion failed, falling back to mailto flow:", err);
        setResponseState("Your email app should open with a prefilled inquiry draft.", "success", mailtoLink);
        window.location.href = mailtoLink;
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
      });
  });
}

function observeReveals() {
  const elements = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  elements.forEach((element) => observer.observe(element));
}

async function renderPublicEvMap() {
  const container = document.getElementById("public-ev-map");
  if (!container || typeof L === "undefined") return;

  const map = L.map("public-ev-map").setView([18.5204, 73.8567], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  let stations = [
    {
      id: "stat-1",
      name: "Green Charge Hub — Central Station",
      address: "Koregaon Park, Pune, Maharashtra",
      lat: 18.5362,
      lng: 73.8940,
      chargePct: 88,
      health: 96,
      totalPorts: 8,
      availPorts: 5,
      capacity: "250 kWh",
      type: "Ultra-Fast DC (250kW)",
      isFast: true,
      status: "ONLINE"
    },
    {
      id: "stat-2",
      name: "EcoVolt Express Charging Node",
      address: "Baner Highway, Pune, Maharashtra",
      lat: 18.5590,
      lng: 73.7868,
      chargePct: 74,
      health: 92.5,
      totalPorts: 6,
      availPorts: 2,
      capacity: "180 kWh",
      type: "Fast DC (150kW)",
      isFast: true,
      status: "ONLINE"
    },
    {
      id: "stat-3",
      name: "SolarPulse Fleet Battery Depot",
      address: "Hadapsar Industrial Zone, Pune",
      lat: 18.5089,
      lng: 73.9259,
      chargePct: 42,
      health: 68,
      totalPorts: 4,
      availPorts: 0,
      capacity: "300 kWh",
      type: "Dual AC (22kW)",
      isFast: false,
      status: "MAINTENANCE"
    },
    {
      id: "stat-4",
      name: "HyperGrid Mega Station",
      address: "BKC Business District, Mumbai",
      lat: 19.0657,
      lng: 72.8686,
      chargePct: 95,
      health: 98,
      totalPorts: 12,
      availPorts: 9,
      capacity: "500 kWh",
      type: "Ultra-Fast DC (350kW)",
      isFast: true,
      status: "ONLINE"
    }
  ];

  // Try fetching live backend data from FastAPI API
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/products/public/ev-stations`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        stations = data.map(p => ({
          id: p.id,
          name: p.station_name || p.product_code,
          address: p.station_address || "Pune, Maharashtra",
          lat: p.install_lat || 18.5204,
          lng: p.install_lng || 73.8567,
          chargePct: p.current_charge_pct ?? 85,
          health: p.battery_health ?? 95,
          totalPorts: p.total_ports ?? 4,
          availPorts: p.available_ports ?? 2,
          capacity: `${p.battery_capacity_kwh || 150} kWh`,
          type: p.charger_type || "Fast DC (150kW)",
          isFast: p.charger_type ? (p.charger_type.includes("Fast") || p.charger_type.includes("350kW") || p.charger_type.includes("250kW") || p.charger_type.includes("150kW")) : true,
          status: (p.status || "online").toUpperCase()
        }));
      }
    }
  } catch (e) {
    console.warn("Backend API offline, using fallback station dataset:", e);
  }

  const markerMap = {};

  stations.forEach(station => {
    const marker = L.marker([station.lat, station.lng]).addTo(map);
    const popupContent = `
      <div style="font-family: sans-serif; padding: 4px; color: #0F172A;">
        <div style="font-weight: 700; font-size: 13px; color: #007bff; margin-bottom: 2px;">${station.name}</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">${station.address}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; background: #f8fafc; padding: 6px; border-radius: 6px; margin-bottom: 8px;">
          <div><strong>Status:</strong> <span style="color: ${station.status === 'ONLINE' ? '#16a34a' : '#ea580c'}">${station.status}</span></div>
          <div><strong>Battery Charge:</strong> <span style="color: #10B981; font-weight: 700;">${station.chargePct}%</span></div>
          <div><strong>Battery Health:</strong> ${station.health}%</div>
          <div><strong>Ports:</strong> ${station.availPorts} / ${station.totalPorts} Avail</div>
          <div><strong>Type:</strong> ${station.type}</div>
        </div>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}" target="_blank" style="display: block; text-align: center; font-size: 11px; font-weight: 600; color: #007bff; text-decoration: none; padding: 4px; border: 1px solid #007bff; border-radius: 4px;">
          Google Maps Directions
        </a>
      </div>
    `;
    marker.bindPopup(popupContent);
    markerMap[station.id] = { marker, lat: station.lat, lng: station.lng };
  });

  window.focusStationOnMap = function (id) {
    const target = markerMap[id];
    if (target && container) {
      container.scrollIntoView({ behavior: "smooth", block: "center" });
      map.flyTo([target.lat, target.lng], 15, { duration: 1.2 });
      target.marker.openPopup();
    }
  };

  // Render cards list if container exists
  const cardsContainer = document.getElementById("charging-stations-cards-container");
  if (cardsContainer) {
    cardsContainer.innerHTML = stations.map(s => {
      const isOnline = s.status === "ONLINE";
      return `
        <article class="info-card" onclick="focusStationOnMap('${s.id}')" style="display: flex; flex-direction: column; justify-content: space-between; padding: 22px; border-radius: 16px; background: var(--surface); border: 1px solid var(--line); cursor: pointer;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
              <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0; color: var(--text);">${s.name}</h3>
              <span style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 12px; text-transform: uppercase; background: ${isOnline ? 'rgba(50, 205, 50, 0.15)' : 'rgba(244, 183, 64, 0.15)'}; color: ${isOnline ? '#32cd32' : '#f4b740'}; border: 1px solid ${isOnline ? 'rgba(50,205,50,0.3)' : 'rgba(244,183,64,0.3)'}; flex-shrink: 0;">
                ${s.status}
              </span>
            </div>

            <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 16px;">📍 ${s.address}</p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: rgba(0,0,0,0.04); padding: 12px; border-radius: 10px; font-size: 0.82rem; margin-bottom: 16px; border: 1px solid var(--line);">
              <div>
                <span style="color: var(--muted); display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Battery Charge</span>
                <strong style="color: #32cd32; font-size: 1.05rem;">🔋 ${s.chargePct}% Charge</strong>
              </div>
              <div>
                <span style="color: var(--muted); display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Charging Ports</span>
                <strong style="color: var(--text); font-size: 0.95rem;">${s.availPorts} / ${s.totalPorts} Avail</strong>
              </div>
              <div>
                <span style="color: var(--muted); display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Battery Health</span>
                <strong style="color: var(--text); font-size: 0.95rem;">${s.health}%</strong>
              </div>
              <div>
                <span style="color: var(--muted); display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Storage Capacity</span>
                <strong style="color: var(--text); font-size: 0.95rem;">${s.capacity}</strong>
              </div>
              <div>
                <span style="color: var(--muted); display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Fast Charging</span>
                <span style="color: ${s.isFast ? 'var(--highlight)' : 'var(--muted)'}; font-weight: 700;">${s.isFast ? '⚡ Yes (DC)' : 'AC Standard'}</span>
              </div>
              <div>
                <span style="color: var(--muted); display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Est. Charge Time</span>
                <strong style="color: var(--text);">${isOnline ? '~24 mins' : 'N/A'}</strong>
              </div>
            </div>

            <div style="font-size: 0.82rem; color: var(--muted); margin-bottom: 16px;">
              <strong>Charger Specification:</strong> ${s.type}
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: auto;">
            <button 
              type="button" 
              class="button secondary" 
              style="flex: 1; min-height: 42px; font-size: 0.8rem; padding: 0 14px; text-transform: uppercase;"
              onclick="event.stopPropagation(); focusStationOnMap('${s.id}')"
            >
              📍 Zoom in Map
            </button>
            <a 
              class="button" 
              style="flex: 1; min-height: 42px; font-size: 0.8rem; padding: 0 14px; text-transform: uppercase; text-align: center; text-decoration: none;" 
              href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}" 
              target="_blank"
              onclick="event.stopPropagation();"
            >
              Directions
            </a>
          </div>
        </article>
      `;
    }).join("");
  }
}

function init() {
  applyTheme(preferredTheme());
  renderHeader();
  renderFooter();
  renderHomeShowcase();
  renderProductsGrid();
  renderApplicationPreview();
  renderDomainPage();
  renderSystemPage();
  renderPublicEvMap();
  attachHeaderBehavior();
  attachSystemCardSliders();
  attachContactForm();
  observeReveals();
}

init();
