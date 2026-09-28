const ui = {
  menuToggle: document.querySelector("#menuToggle"),
  siteNav: document.querySelector("#siteNav"),
  scamChecker: document.querySelector("#scamChecker"),
  riskResult: document.querySelector("#riskResult"),
  seasonSelect: document.querySelector("#seasonSelect"),
  searchInput: document.querySelector("#searchInput"),
  clubFilter: document.querySelector("#clubFilter"),
  cardTypeFilter: document.querySelector("#cardTypeFilter"),
  specialOnly: document.querySelector("#specialOnly"),
  activeSeasonName: document.querySelector("#activeSeasonName"),
  resultSummary: document.querySelector("#resultSummary"),
  clearFilters: document.querySelector("#clearFilters"),
  cardList: document.querySelector("#cardList"),
  cardTemplate: document.querySelector("#cardTemplate"),
  emptyState: document.querySelector("#emptyState"),
  pagination: document.querySelector("#pagination"),
  prevPage: document.querySelector("#prevPage"),
  nextPage: document.querySelector("#nextPage"),
  pageInfo: document.querySelector("#pageInfo"),
  currentYear: document.querySelector("#currentYear")
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

const numberFormatter = new Intl.NumberFormat("vi-VN");

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getCardValue(card, ...keys) {
  const key = keys.find((candidate) => card[candidate] !== undefined && card[candidate] !== null);
  return key ? String(card[key]) : "";
}

function cardNumber(card) { return getCardValue(card, "card_number", "number") || "—"; }
function playerName(card) { return getCardValue(card, "player_name", "name") || "Chưa rõ cầu thủ"; }
function clubName(card) { return getCardValue(card, "club", "team") || "Không rõ CLB"; }
function cardType(card) { return getCardValue(card, "card_type", "rarity") || "Khác"; }
function parallelName(card) { return getCardValue(card, "parallel_type", "parallel") || "Base"; }
function isAutograph(card) { return card.is_autograph === true || normalize(cardType(card)).includes("auto"); }
function isNumbered(card) { return card.is_numbered === true || Number(card.serial_limit) > 0; }

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

function setMenu(open) {
  ui.siteNav.classList.toggle("is-open", open);
  ui.menuToggle.setAttribute("aria-expanded", String(open));
  ui.menuToggle.querySelector(".sr-only").textContent = open ? "Đóng menu" : "Mở menu";
}

ui.menuToggle.addEventListener("click", () => setMenu(!ui.siteNav.classList.contains("is-open")));
ui.siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

function updateRiskResult() {
  const checked = [...ui.scamChecker.querySelectorAll("[data-risk]:checked")];
  const score = checked.reduce((total, input) => total + Number(input.dataset.risk), 0);
  const title = ui.riskResult.querySelector("strong");
  const copy = ui.riskResult.querySelector("p");

  ui.riskResult.className = "risk-result";
  if (!checked.length) {
    ui.riskResult.classList.add("risk-result--idle");
    title.textContent = "Chưa có dấu hiệu được chọn";
    copy.textContent = "Đối chiếu danh tính và giữ lại toàn bộ bằng chứng giao dịch.";
  } else if (score <= 3) {
    ui.riskResult.classList.add("risk-result--low");
    title.textContent = "Có dấu hiệu cần xác minh";
    copy.textContent = "Xin ảnh kèm tên + ngày, kiểm tra feedback thật và ưu tiên thanh toán có bảo vệ.";
  } else if (score <= 7) {
    ui.riskResult.classList.add("risk-result--medium");
    title.textContent = "Rủi ro đáng kể — chưa nên chuyển tiền";
    copy.textContent = "Dừng giao dịch cho đến khi mọi điểm bất thường được giải thích và kiểm chứng độc lập.";
  } else {
    ui.riskResult.classList.add("risk-result--high");
    title.textContent = "Rủi ro cao — nên dừng giao dịch";
    copy.textContent = "Không chuyển khoản. Lưu bằng chứng, cảnh báo quản trị viên cộng đồng nếu có dấu hiệu lừa đảo.";
  }
}

ui.scamChecker.addEventListener("change", updateRiskResult);
ui.scamChecker.addEventListener("reset", () => window.setTimeout(updateRiskResult, 0));

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
      cardNumber(card), playerName(card), clubName(card), cardType(card), parallelName(card), card.serial_limit
    ].join(" "));
    return (!query || haystack.includes(query))
      && (state.club === "all" || clubName(card) === state.club)
      && (state.cardType === "all" || cardType(card) === state.cardType)
      && (!state.specialOnly || isNumbered(card) || isAutograph(card));
  });
}

function renderCard(card) {
  const node = ui.cardTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".data-card__number").textContent = `#${cardNumber(card)}`;
  node.querySelector(".data-card__type").textContent = cardType(card);
  node.querySelector(".data-card__parallel").textContent = `· ${parallelName(card)}`;
  node.querySelector(".data-card__player").textContent = playerName(card);
  node.querySelector(".data-card__club").textContent = clubName(card);
  node.querySelector(".badge--serial").textContent = isNumbered(card)
    ? (Number(card.serial_limit) > 0 ? `/${numberFormatter.format(card.serial_limit)}` : "Serial")
    : "";
  node.querySelector(".badge--auto").textContent = isAutograph(card) ? "Autograph" : "";
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
  ui.resultSummary.textContent = "Đang đọc dữ liệu…";
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
    ui.emptyState.querySelector("strong").textContent = "Checklist chưa tải được.";
    ui.emptyState.querySelector("p").textContent = "Hãy tải lại trang hoặc thử dòng sản phẩm khác.";
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
    ui.seasonSelect.innerHTML = "<option>Không tải được danh sách</option>";
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
ui.clubFilter.addEventListener("change", () => { state.club = ui.clubFilter.value; resetPageAndRender(); });
ui.cardTypeFilter.addEventListener("change", () => { state.cardType = ui.cardTypeFilter.value; resetPageAndRender(); });
ui.specialOnly.addEventListener("change", () => { state.specialOnly = ui.specialOnly.checked; resetPageAndRender(); });
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
  if (state.page > 1) { state.page -= 1; renderResults(); document.querySelector("#checklistApp").scrollIntoView({ behavior: "smooth", block: "start" }); }
});
ui.nextPage.addEventListener("click", () => {
  const pageCount = Math.ceil(filteredCards().length / state.pageSize);
  if (state.page < pageCount) { state.page += 1; renderResults(); document.querySelector("#checklistApp").scrollIntoView({ behavior: "smooth", block: "start" }); }
});

ui.currentYear.textContent = new Date().getFullYear();
initializeChecklist();
