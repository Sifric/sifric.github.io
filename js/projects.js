(function () {
  const organization = "Sifric";
  const endpoint = "https://api.github.com/orgs/" + organization + "/repos?type=public&sort=pushed&per_page=100";
  const organizationUrl = "https://github.com/orgs/" + organization + "/repositories";
  const cacheKey = "open-sifric-repositories";
  const cacheLifetime = 10 * 60 * 1000;
  const hiddenRepositories = [".github", "sifric.github.io"];
  const svgNamespace = "http://www.w3.org/2000/svg";
  const list = document.querySelector("[data-project-list]");
  const dateFormat = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

  let hasLoaded = false;

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text) {
      element.textContent = text;
    }

    return element;
  }

  function createIcon(name, extraClass) {
    const svg = document.createElementNS(svgNamespace, "svg");
    const use = document.createElementNS(svgNamespace, "use");

    svg.setAttribute("class", extraClass ? "icon " + extraClass : "icon");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", "#icon-" + name);
    svg.append(use);

    return svg;
  }

  function isWebUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch (error) {
      return false;
    }
  }

  function readCache() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(cacheKey));

      if (stored && Date.now() - stored.savedAt < cacheLifetime) {
        return stored.repositories;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function writeCache(repositories) {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), repositories: repositories }));
    } catch (error) {
      return;
    }
  }

  function describeLicense(license) {
    if (!license) {
      return "No license listed";
    }

    if (license.spdx_id && license.spdx_id !== "NOASSERTION") {
      return license.spdx_id;
    }

    return license.name || "Custom license";
  }

  function buildCard(repository) {
    const card = createElement("article", "project-card");
    const head = createElement("div", "project-head");
    const name = createElement("a", "project-name", repository.name);
    const description = createElement("p", "project-description", repository.description || "No description provided.");
    const meta = createElement("div", "project-meta");

    name.href = repository.html_url;
    name.target = "_blank";
    name.rel = "noopener noreferrer";

    head.append(createIcon("book"), name);

    if (repository.archived) {
      head.append(createElement("span", "project-tag", "Archived"));
    } else if (repository.fork) {
      head.append(createElement("span", "project-tag", "Fork"));
    }

    if (repository.language) {
      const language = createElement("span");
      language.append(createElement("i", "language-dot"), document.createTextNode(repository.language));
      meta.append(language);
    }

    meta.append(createElement("span", "", describeLicense(repository.license)));

    if (repository.pushed_at) {
      meta.append(createElement("span", "", "Updated " + dateFormat.format(new Date(repository.pushed_at))));
    }

    card.append(head, description, meta);

    if (repository.homepage && isWebUrl(repository.homepage)) {
      const site = createElement("a", "project-site", "Project website");
      site.href = repository.homepage;
      site.target = "_blank";
      site.rel = "noopener noreferrer";
      site.append(createIcon("arrow-up-right"));
      card.append(site);
    }

    return card;
  }

  function showLoading() {
    list.setAttribute("aria-busy", "true");
    list.replaceChildren();

    for (let index = 0; index < 3; index += 1) {
      const card = createElement("div", "project-card is-loading");
      card.append(
        createElement("div", "skeleton skeleton-title"),
        createElement("div", "skeleton skeleton-line"),
        createElement("div", "skeleton skeleton-line skeleton-line-short")
      );
      list.append(card);
    }
  }

  function showMessage(title, message) {
    const status = createElement("div", "project-status");
    const row = createElement("div", "button-row button-row-center");
    const link = createElement("a", "button button-secondary", "View on GitHub");

    link.href = organizationUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    row.append(link);
    status.append(createElement("h3", "", title), createElement("p", "", message), row);

    list.setAttribute("aria-busy", "false");
    list.replaceChildren(status);
  }

  function showRepositories(repositories) {
    const visible = repositories.filter(function (repository) {
      return !hiddenRepositories.includes(repository.name);
    });

    if (visible.length === 0) {
      showMessage("No public projects to list yet", "When public repositories are available they will appear here. You can always check the organization on GitHub directly.");
      return;
    }

    list.setAttribute("aria-busy", "false");
    list.replaceChildren(...visible.map(buildCard));
  }

  async function loadRepositories() {
    const cached = readCache();

    if (cached) {
      showRepositories(cached);
      return;
    }

    showLoading();

    try {
      const response = await fetch(endpoint, { headers: { Accept: "application/vnd.github+json" } });

      if (!response.ok) {
        throw new Error("GitHub responded with " + response.status);
      }

      const repositories = await response.json();
      writeCache(repositories);
      showRepositories(repositories);
    } catch (error) {
      hasLoaded = false;
      showMessage("The project list isn't available right now", "We couldn't reach GitHub to load the repositories. Try again in a moment, or browse the organization directly.");
    }
  }

  document.addEventListener("routechange", function (event) {
    if (event.detail.route === "projects" && !hasLoaded) {
      hasLoaded = true;
      loadRepositories();
    }
  });
})();
