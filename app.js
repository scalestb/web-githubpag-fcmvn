const numberFormatter = new Intl.NumberFormat("vi-VN");
const checklistFile = "data/seasons/topps_flagship_premier_league_2026_27_checklist.json";

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
    .replace(/đ/g, "d")
    .trim();
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
  return getCardValue(card, "parallel_type", "parallel");
}

function isAutograph(card) {
  return card.is_autograph === true || normalize(cardType(card)).includes("auto");
}

function initBase() {
  qsa("#currentYear").forEach((node) => { node.textContent = new Date().getFullYear(); });

  const page = document.body.dataset.page;
  qsa("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  const toggle = qs("#menuToggle");
  const nav = qs("#siteNav");
  if (!toggle || !nav) return;

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
  }

  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });
}

function initStoryFilters() {
  const filters = qs("#storyFilters");
  const list = qs("#storyList");
  const count = qs("#storyCount");
  if (!filters || !list) return;

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;

    qsa("[data-filter]", filters).forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    let visible = 0;
    qsa("[data-category]", list).forEach((row) => {
      row.hidden = filter !== "all" && row.dataset.category !== filter;
      if (!row.hidden) visible += 1;
    });
    if (count) count.textContent = numberFormatter.format(visible) + " tình huống";
  });

  function openLinkedCase() {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const caseCard = document.getElementById(id);
    if (caseCard && caseCard.tagName === "DETAILS") caseCard.open = true;
  }
  window.addEventListener("hashchange", openLinkedCase);
  openLinkedCase();
}

function initChecklist() {
  const app = qs("#checklistApp");
  if (!app) return;

  const ui = {
    search: qs("#searchInput"),
    club: qs("#clubFilter"),
    filterList: qs("#listFilter"),
    summary: qs("#resultSummary"),
    clear: qs("#clearFilters"),
    list: qs("#cardList"),
    template: qs("#cardTemplate"),
    empty: qs("#emptyState"),
    pagination: qs("#pagination"),
    previous: qs("#prevPage"),
    next: qs("#nextPage"),
    pageInfo: qs("#pageInfo")
  };
  const state = { cards: [], query: "", club: "all", type: "all", page: 1, pageSize: 30 };

  function fillClubSelect(cards) {
    const fragment = document.createDocumentFragment();
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "Tất cả CLB";
    fragment.append(all);

    [...new Set(cards.map(clubName).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "vi"))
      .forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        fragment.append(option);
      });
    ui.club.replaceChildren(fragment);
  }

  function updateListCounts() {
    qsa("[data-count]", ui.filterList).forEach((node) => {
      const type = node.dataset.count;
      const count = type === "all"
        ? state.cards.length
        : state.cards.filter((card) => cardType(card) === type).length;
      node.textContent = numberFormatter.format(count);
    });
  }

  function setActiveList(type) {
    state.type = type;
    qsa("[data-list]", ui.filterList).forEach((button) => {
      const active = button.dataset.list === type;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function filteredCards() {
    const query = normalize(state.query);
    return state.cards.filter((card) => {
      const searchText = normalize([
        cardNumber(card), playerName(card), clubName(card),
        cardType(card), parallelName(card)
      ].join(" "));
      return (!query || searchText.includes(query))
        && (state.club === "all" || clubName(card) === state.club)
        && (state.type === "all" || cardType(card) === state.type);
    });
  }

  function renderCard(card) {
    const node = ui.template.content.firstElementChild.cloneNode(true);
    qs(".data-card-number", node).textContent = "#" + cardNumber(card);
    qs(".data-card-type", node).textContent = cardType(card).replace("_", " ");
    qs(".data-card-parallel", node).textContent = parallelName(card) ? "· " + parallelName(card) : "";
    qs(".data-card-player", node).textContent = playerName(card);
    qs(".data-card-club", node).textContent = clubName(card);
    qs(".badge-auto", node).textContent = isAutograph(card) ? "AUTO" : "";
    return node;
  }

  function render() {
    const results = filteredCards();
    const pageCount = Math.max(1, Math.ceil(results.length / state.pageSize));
    state.page = Math.min(state.page, pageCount);
    const start = (state.page - 1) * state.pageSize;
    const fragment = document.createDocumentFragment();
    results.slice(start, start + state.pageSize).forEach((card) => fragment.append(renderCard(card)));
    ui.list.replaceChildren(fragment);

    ui.summary.textContent = numberFormatter.format(results.length) + " / " + numberFormatter.format(state.cards.length) + " THẺ";
    ui.empty.hidden = results.length !== 0;
    ui.pagination.hidden = results.length <= state.pageSize;
    ui.pageInfo.textContent = "TRANG " + state.page + " / " + pageCount;
    ui.previous.disabled = state.page === 1;
    ui.next.disabled = state.page === pageCount;
  }

  function renderFromFirstPage() {
    state.page = 1;
    render();
  }

  let searchTimer;
  ui.search.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.query = ui.search.value;
      renderFromFirstPage();
    }, 120);
  });
  ui.club.addEventListener("change", () => {
    state.club = ui.club.value;
    renderFromFirstPage();
  });
  ui.filterList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-list]");
    if (!button) return;
    setActiveList(button.dataset.list);
    renderFromFirstPage();
  });
  ui.clear.addEventListener("click", () => {
    window.clearTimeout(searchTimer);
    state.query = "";
    state.club = "all";
    ui.search.value = "";
    ui.club.value = "all";
    setActiveList("all");
    renderFromFirstPage();
    ui.search.focus();
  });
  ui.previous.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      render();
      app.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  ui.next.addEventListener("click", () => {
    if (state.page < Math.ceil(filteredCards().length / state.pageSize)) {
      state.page += 1;
      render();
      app.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  fetch(checklistFile)
    .then((response) => {
      if (!response.ok) throw new Error("Không tải được checklist");
      return response.json();
    })
    .then((cards) => {
      if (!Array.isArray(cards)) throw new Error("Dữ liệu checklist không hợp lệ");
      state.cards = cards;
      fillClubSelect(cards);
      updateListCounts();
      render();
    })
    .catch((error) => {
      ui.summary.textContent = "KHÔNG TẢI ĐƯỢC DỮ LIỆU";
      ui.empty.hidden = false;
      qs("strong", ui.empty).textContent = "CHECKLIST CHƯA TẢI ĐƯỢC";
      qs("p", ui.empty).textContent = "Vui lòng tải lại trang.";
      console.error(error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  initBase();
  initStoryFilters();
  initChecklist();
});
