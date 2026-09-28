const numberFormatter = new Intl.NumberFormat("vi-VN");

function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

function qsa(selector, scope = document) {
  return [...scope.querySelectorAll(selector)];
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function initCurrentYear() {
  qsa("#currentYear").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });
}

function initMenu() {
  const menuToggle = qs("#menuToggle");
  const siteNav = qs("#siteNav");
  if (!menuToggle || !siteNav) return;

  function setMenu(open) {
    siteNav.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    const label = qs(".sr-only", menuToggle);
    if (label) label.textContent = open ? "Đóng menu" : "Mở menu";
  }

  menuToggle.addEventListener("click", () => {
    setMenu(!siteNav.classList.contains("is-open"));
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });
}

function initActiveNav() {
  const page = document.body.dataset.page;
  if (!page) return;
  qsa("[data-nav]").forEach((link) => {
    const active = link.dataset.nav === page;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
  });
}

function initRiskChecker() {
  const form = qs("#scamChecker");
  const result = qs("#riskResult");
  if (!form || !result) return;

  const title = qs("strong", result);
  const copy = qs("p", result);

  function setResult(level, heading, body) {
    result.className = `risk-result risk-result-${level}`;
    if (title) title.textContent = heading;
    if (copy) copy.textContent = body;
  }

  function updateRiskResult() {
    const checked = qsa("[data-risk]:checked", form);
    const score = checked.reduce((total, input) => total + Number(input.dataset.risk), 0);

    if (!checked.length) {
      setResult(
        "idle",
        "Chưa có dấu hiệu được chọn",
        "Vẫn nên đối chiếu danh tính, ảnh timestamp và lịch sử giao dịch trước khi chuyển khoản."
      );
    } else if (score <= 3) {
      setResult(
        "low",
        "Có dấu hiệu cần xác minh",
        "Xin thêm ảnh/video, kiểm tra feedback thật và ưu tiên hình thức thanh toán có bảo vệ người mua."
      );
    } else if (score <= 7) {
      setResult(
        "medium",
        "Rủi ro đáng kể, chưa nên chuyển tiền",
        "Dừng giao dịch cho đến khi mọi điểm bất thường được giải thích rõ và có thể kiểm chứng độc lập."
      );
    } else {
      setResult(
        "high",
        "Rủi ro cao, nên dừng giao dịch",
        "Không chuyển khoản. Lưu bằng chứng, nhờ quản trị viên hoặc middleman uy tín kiểm tra trước khi làm tiếp."
      );
    }
  }

  form.addEventListener("change", updateRiskResult);
  form.addEventListener("reset", () => window.setTimeout(updateRiskResult, 0));
}

function initStoryFilters() {
  const filters = qs("#storyFilters");
  const storyList = qs("#storyList");
  if (!filters || !storyList) return;

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;

    qsa("[data-filter]", filters).forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    qsa("[data-category]", storyList).forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
}

function getCardValue(card, ...keys) {
  const key = keys.find((candidate) => card[candidate] !== undefined && card[candidate] !== null);
  return key ? String(card[key]) : "";
}

function cardNumber(card) {
  return getCardValue(card, "card_number", "number") || "-";
}

function playerName(card) {
  return getCardValue(card, "player_name", "name") || "Chưa rõ cầu thủ";
}

function clubName(card) {
  return getCardValue(card, "club", "team") || "Không rõ CLB";
}

function cardType(card) {
  return getCardValue(card, "card_type", "rarity") || "Khác";
}

function parallelName(card) {
  return getCardValue(card, "parallel_type", "parallel") || "Base";
}

function isAutograph(card) {
  return card.is_autograph === true || normalize(cardType(card)).includes("auto");
}

function isNumbered(card) {
  return card.is_numbered === true || Number(card.serial_limit) > 0;
}

function getSeasonFile(season) {
  const file = season.checklist_file || season.checklistFile || season.file;
  if (!file) return `data/seasons/${season.id}.json`;
  return file.includes("/") ? file : `data/seasons/${file}`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Không đọc được ${url}`);
  return response.json();
}

function initChecklist() {
  const app = qs("#checklistApp");
  if (!app) return;

  const ui = {
    seasonSelect: qs("#seasonSelect"),
    searchInput: qs("#searchInput"),
    clubFilter: qs("#clubFilter"),
    cardTypeFilter: qs("#cardTypeFilter"),
    specialOnly: qs("#specialOnly"),
    activeSeasonName: qs("#activeSeasonName"),
    resultSummary: qs("#resultSummary"),
    clearFilters: qs("#clearFilters"),
    cardList: qs("#cardList"),
    cardTemplate: qs("#cardTemplate"),
    emptyState: qs("#emptyState"),
    pagination: qs("#pagination"),
    prevPage: qs("#prevPage"),
    nextPage: qs("#nextPage"),
    pageInfo: qs("#pageInfo")
  };

  const state = {
    seasons: [],
    cards: [],
    seasonId: "",
    query: "",
    club: "all",
    cardType: "all",
    specialOnly: false,
    page: 1,
    pageSize: 36,
    requestId: 0
  };

  function populateSelect(select, values, initialLabel) {
    const fragment = document.createDocumentFragment();
    const first = document.createElement("option");
    first.value = "all";
    first.textContent = initialLabel;
    fragment.append(first);

    [...new Set(values.filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "vi"))
      .forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        fragment.append(option);
      });

    select.replaceChildren(fragment);
  }

  function populateFilters() {
    populateSelect(ui.clubFilter, state.cards.map(clubName), "Tất cả CLB");
    populateSelect(ui.cardTypeFilter, state.cards.map(cardType), "Tất cả loại");
    state.club = "all";
    state.cardType = "all";
  }

  function filteredCards() {
    const query = normalize(state.query);
    return state.cards.filter((card) => {
      const haystack = normalize([
        cardNumber(card),
        playerName(card),
        clubName(card),
        cardType(card),
        parallelName(card),
        card.serial_limit
      ].join(" "));

      return (!query || haystack.includes(query))
        && (state.club === "all" || clubName(card) === state.club)
        && (state.cardType === "all" || cardType(card) === state.cardType)
        && (!state.specialOnly || isNumbered(card) || isAutograph(card));
    });
  }

  function renderCard(card) {
    const node = ui.cardTemplate.content.firstElementChild.cloneNode(true);
    qs(".data-card-number", node).textContent = `#${cardNumber(card)}`;
    qs(".data-card-type", node).textContent = cardType(card);
    qs(".data-card-parallel", node).textContent = `· ${parallelName(card)}`;
    qs(".data-card-player", node).textContent = playerName(card);
    qs(".data-card-club", node).textContent = clubName(card);
    qs(".badge-serial", node).textContent = isNumbered(card)
      ? (Number(card.serial_limit) > 0 ? `/${numberFormatter.format(card.serial_limit)}` : "Serial")
      : "";
    qs(".badge-auto", node).textContent = isAutograph(card) ? "Autograph" : "";
    return node;
  }

  function renderResults() {
    const results = filteredCards();
    const pageCount = Math.max(1, Math.ceil(results.length / state.pageSize));
    state.page = Math.min(state.page, pageCount);
    const start = (state.page - 1) * state.pageSize;
    const pageCards = results.slice(start, start + state.pageSize);
    const fragment = document.createDocumentFragment();

    pageCards.forEach((card) => fragment.append(renderCard(card)));
    ui.cardList.replaceChildren(fragment);

    ui.resultSummary.textContent = `${numberFormatter.format(results.length)} / ${numberFormatter.format(state.cards.length)} item`;
    ui.emptyState.hidden = results.length !== 0;
    ui.pagination.hidden = results.length <= state.pageSize;
    ui.pageInfo.textContent = `Trang ${state.page} / ${pageCount}`;
    ui.prevPage.disabled = state.page === 1;
    ui.nextPage.disabled = state.page === pageCount;
  }

  function resetPageAndRender() {
    state.page = 1;
    renderResults();
  }

  async function loadSeason(seasonId) {
    const season = state.seasons.find((item) => item.id === seasonId);
    if (!season) return;
    const requestId = ++state.requestId;
    state.seasonId = seasonId;
    ui.activeSeasonName.textContent = season.name || season.title || season.id;
    ui.resultSummary.textContent = "Đang đọc dữ liệu...";
    ui.cardList.replaceChildren();

    try {
      const cards = await fetchJson(getSeasonFile(season));
      if (requestId !== state.requestId) return;
      state.cards = Array.isArray(cards) ? cards : (cards.cards || cards.items || []);
      state.query = "";
      state.specialOnly = false;
      ui.searchInput.value = "";
      ui.specialOnly.checked = false;
      populateFilters();
      resetPageAndRender();
    } catch (error) {
      if (requestId !== state.requestId) return;
      state.cards = [];
      ui.resultSummary.textContent = "Không thể tải checklist";
      ui.emptyState.hidden = false;
      qs("strong", ui.emptyState).textContent = "Checklist chưa tải được.";
      qs("p", ui.emptyState).textContent = "Hãy tải lại trang hoặc thử dòng sản phẩm khác.";
      console.error(error);
    }
  }

  async function initializeChecklist() {
    try {
      const seasons = await fetchJson("data/list.json");
      state.seasons = Array.isArray(seasons) ? seasons : [];
      const fragment = document.createDocumentFragment();

      state.seasons.forEach((season) => {
        const option = document.createElement("option");
        option.value = season.id;
        option.textContent = season.name || season.title || season.id;
        fragment.append(option);
      });

      ui.seasonSelect.replaceChildren(fragment);
      if (state.seasons.length) await loadSeason(state.seasons[0].id);
    } catch (error) {
      const option = document.createElement("option");
      option.textContent = "Không tải được danh sách";
      ui.seasonSelect.replaceChildren(option);
      ui.resultSummary.textContent = "Không thể tải dữ liệu";
      ui.activeSeasonName.textContent = "Checklist tạm thời chưa khả dụng";
      console.error(error);
    }
  }

  let searchTimer;
  ui.searchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.query = ui.searchInput.value;
      resetPageAndRender();
    }, 120);
  });

  ui.seasonSelect.addEventListener("change", () => loadSeason(ui.seasonSelect.value));
  ui.clubFilter.addEventListener("change", () => {
    state.club = ui.clubFilter.value;
    resetPageAndRender();
  });
  ui.cardTypeFilter.addEventListener("change", () => {
    state.cardType = ui.cardTypeFilter.value;
    resetPageAndRender();
  });
  ui.specialOnly.addEventListener("change", () => {
    state.specialOnly = ui.specialOnly.checked;
    resetPageAndRender();
  });
  ui.clearFilters.addEventListener("click", () => {
    state.query = "";
    state.club = "all";
    state.cardType = "all";
    state.specialOnly = false;
    ui.searchInput.value = "";
    ui.clubFilter.value = "all";
    ui.cardTypeFilter.value = "all";
    ui.specialOnly.checked = false;
    resetPageAndRender();
    ui.searchInput.focus();
  });
  ui.prevPage.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      renderResults();
      app.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  ui.nextPage.addEventListener("click", () => {
    const pageCount = Math.ceil(filteredCards().length / state.pageSize);
    if (state.page < pageCount) {
      state.page += 1;
      renderResults();
      app.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  initializeChecklist();
}

document.addEventListener("DOMContentLoaded", () => {
  initCurrentYear();
  initMenu();
  initActiveNav();
  initRiskChecker();
  initStoryFilters();
  initChecklist();
});
