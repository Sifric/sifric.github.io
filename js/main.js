(function () {
  const views = document.querySelectorAll("[data-view]");
  const routeLinks = document.querySelectorAll("[data-route-link]");
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-button]");
  const main = document.getElementById("main");
  const skipLink = document.querySelector("[data-skip]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const knownRoutes = ["home", "projects", "principles", "contribute", "about"];

  const metaTargets = [
    ['meta[name="description"]', "description"],
    ['meta[property="og:title"]', "title"],
    ['meta[property="og:description"]', "description"],
    ['meta[name="twitter:title"]', "title"],
    ['meta[name="twitter:description"]', "description"]
  ];

  let currentRoute = null;

  function readRoute() {
    const hash = window.location.hash;

    if (hash === "" || hash === "#" || hash === "#/") {
      return "home";
    }

    const match = hash.match(/^#\/([a-z-]+)\/?$/);
    const name = match ? match[1] : "";

    return knownRoutes.includes(name) ? name : "not-found";
  }

  function closeMenu() {
    header.dataset.open = "false";
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
    document.body.style.overflow = "";
  }

  function openMenu() {
    header.dataset.open = "true";
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Close menu");
    document.body.style.overflow = "hidden";
  }

  function updateMeta(view) {
    metaTargets.forEach(function (target) {
      const element = document.querySelector(target[0]);
      const value = target[1] === "title" ? view.dataset.title : view.dataset.description;

      if (element && value) {
        element.setAttribute("content", value);
      }
    });
  }

  function showRoute(name) {
    const changed = name !== currentRoute;
    currentRoute = name;

    views.forEach(function (view) {
      view.hidden = view.dataset.view !== name;
    });

    routeLinks.forEach(function (link) {
      if (link.dataset.routeLink === name) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    const activeView = document.querySelector('[data-view="' + name + '"]');
    document.title = activeView.dataset.title;
    updateMeta(activeView);

    closeMenu();

    if (changed) {
      window.scrollTo(0, 0);
    }

    document.dispatchEvent(new CustomEvent("routechange", { detail: { route: name } }));
  }

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  function watchReveals() {
    const items = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function playIntro() {
    let alreadySeen = false;

    try {
      alreadySeen = sessionStorage.getItem("open-sifric-intro") === "seen";
      sessionStorage.setItem("open-sifric-intro", "seen");
    } catch (error) {
      alreadySeen = false;
    }

    if (alreadySeen || prefersReducedMotion.matches || currentRoute !== "home") {
      return;
    }

    const intro = document.createElement("div");
    const mark = document.createElement("img");

    intro.className = "intro";
    intro.setAttribute("aria-hidden", "true");
    mark.src = "assets/icon.png";
    mark.alt = "";
    intro.append(mark);
    document.body.append(intro);

    function dismiss() {
      if (intro.classList.contains("is-leaving")) {
        return;
      }

      intro.classList.add("is-leaving");
      window.setTimeout(function () {
        intro.remove();
      }, 700);
    }

    intro.addEventListener("click", dismiss);
    window.setTimeout(dismiss, 1500);
  }

  menuButton.addEventListener("click", function () {
    if (header.dataset.open === "true") {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && header.dataset.open === "true") {
      closeMenu();
      menuButton.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 820 && header.dataset.open === "true") {
      closeMenu();
    }
  });

  skipLink.addEventListener("click", function (event) {
    event.preventDefault();
    main.focus({ preventScroll: false });
  });

  document.querySelectorAll('a[href^="#/"]').forEach(function (link) {
    link.addEventListener("click", function () {
      if (link.getAttribute("href") === window.location.hash || (link.getAttribute("href") === "#/" && readRoute() === "home")) {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
      }
    });
  });

  window.addEventListener("hashchange", function () {
    showRoute(readRoute());
  });

  window.addEventListener("scroll", updateHeader, { passive: true });

  showRoute(readRoute());
  updateHeader();
  watchReveals();
  playIntro();
})();
