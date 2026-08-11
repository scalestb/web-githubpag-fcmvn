const channelList = document.querySelector("#channelList");
const channelTemplate = document.querySelector("#channelTemplate");
const seasonList = document.querySelector("#seasonList");
const seasonTemplate = document.querySelector("#seasonTemplate");
const seasonSelect = document.querySelector("#seasonSelect");
const searchInput = document.querySelector("#searchInput");
const clubFilter = document.querySelector("#clubFilter");
const cardTypeFilter = document.querySelector("#cardTypeFilter");
const parallelFilter = document.querySelector("#parallelFilter");
const featureFilter = document.querySelector("#featureFilter");
const clearFilters = document.querySelector("#clearFilters");
const cardList = document.querySelector("#cardList");
const cardTemplate = document.querySelector("#cardTemplate");
const resultSummary = document.querySelector("#resultSummary");
const emptyState = document.querySelector("#emptyState");
const pagination = document.querySelector("#pagination");
const prevPage = document.querySelector("#prevPage");
const nextPage = document.querySelector("#nextPage");
const pageInfo = document.querySelector("#pageInfo");
const pageSizeSelect = document.querySelector("#pageSizeSelect");
const activeSeasonName = document.querySelector("#activeSeasonName");
const totalItems = document.querySelector("#totalItems");
const numberedItems = document.querySelector("#numberedItems");
const autographItems = document.querySelector("#autographItems");
const clubsCount = document.querySelector("#clubsCount");

const SHOPEE_URL = "https://shopee.vn/fcmvn_com";
const numberFormatter = new Intl.NumberFormat("vi-VN");

const channels = [
  {
    name: "Cửa hàng Shopee",
    description: "Sản phẩm thẻ đang bán",
    url: SHOPEE_URL,
    icon: "S",
    tone: "shop"
  },
  {
    name: "Kênh TikTok",
    description: "Video mở hộp và cập nhật nhanh",
    url: "https://www.tiktok.com/@fcmvn_com",
    icon: "T",
    tone: "tiktok"
  },
  {
    name: "Kênh YouTube",
    description: "Nội dung checklist và review",
    url: "https://www.youtube.com/@fcmvn-com",
    icon: "Y",
    tone: "youtube"
  }
];

const state = {
  seasons: [],
  cards: [],
  currentSeasonId: "",
  search: "",
  club: "all",
  cardType: "all",
  parallel: "all",
  feature: "all",
  currentPage: 1,
  pageSize: 24
};

function normalizeText(value) {
  return (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function escapeHtml(value) {
  return (value ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatCount(value) {
  return numberFormatter.format(Number(value || 0));
}

function getSeasonName(season) {
  return season?.name || season?.title || season?.id || "Checklist";
}

function getChecklistUrl(season) {
  const source = season?.checklist_file || season?.checklistFile || season?.cardsUrl || season?.file;

  if (!source) {
    return `data/seasons/${season.id}.json`;
  }

  if (source.includes("/")) {
    return source;
  }

  return `data/seasons/${source}`;
}

function getCardNumber(card) {
  return (card.card_number ?? card.number ?? "").toString();
}

function getPlayerName(card) {
  return card.player_name || card.name || "Chưa có tên";
}

function getClub(card) {
  return card.club || card.team || "Không rõ CLB";
}

function getCardType(card) {
  return card.card_type || card.rarity || "Khác";
}

function getParallelType(card) {
  return card.parallel_type || "Base";
}

function isNumbered(card) {
  return card.is_numbered === true || Number(card.serial_limit) > 0;
}

function isAutograph(card) {
  return card.is_autograph === true;
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Không đọc được ${url}`);
  }

  return response.json();
}

function getChecklistStats(cards = state.cards) {
  return {
    total: cards.length,
    numbered: cards.filter(isNumbered).length,
    autograph: cards.filter(isAutograph).length,
    clubs: new Set(cards.map(getClub).filter(Boolean)).size
  };
}

function getFilteredCards() {
  const query = normalizeText(state.search);

  return state.cards.filter((card) => {
    const searchable = normalizeText(
      [
        getCardNumber(card),
        getPlayerName(card),
        getClub(card),
        getCardType(card),
        getParallelType(card),
        card.serial_limit,
        isNumbered(card) ? "numbered serial" : "",
        isAutograph(card) ? "autograph auto" : ""
      ].join(" ")
    );

    const matchesSearch = !query || searchable.includes(query);
    const matchesClub = state.club === "all" || getClub(card) === state.club;
    const matchesType = state.cardType === "all" || getCardType(card) === state.cardType;
    const matchesParallel = state.parallel === "all" || getParallelType(card) === state.parallel;
    const matchesFeature =
      state.feature === "all" ||
      (state.feature === "numbered" && isNumbered(card)) ||
      (state.feature === "autograph" && isAutograph(card)) ||
      (state.feature === "standard" && !isNumbered(card) && !isAutograph(card));

    return matchesSearch && matchesClub && matchesType && matchesParallel && matchesFeature;
  });
}

function getPageCount(total) {
  return Math.max(1, Math.ceil(total / state.pageSize));
}

function resetPage() {
  state.currentPage = 1;
}

function renderChannels() {
  channelList.innerHTML = "";

  channels.forEach((channel) => {
    const node = channelTemplate.content.cloneNode(true);
    const link = node.querySelector(".channel-card");

    link.href = channel.url;
    link.classList.add(channel.tone);
    link.setAttribute("aria-label", channel.name);
    node.querySelector(".channel-icon").textContent = channel.icon;
    node.querySelector(".channel-name").textContent = channel.name;
    node.querySelector(".channel-desc").textContent = channel.description;

    channelList.appendChild(node);
  });
}

function renderSeasonButtons() {
  seasonList.innerHTML = "";

  state.seasons.forEach((season) => {
    const node = seasonTemplate.content.cloneNode(true);
    const button = node.querySelector(".season-button");
    const isActive = season.id === state.currentSeasonId;

    button.dataset.seasonId = season.id;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    node.querySelector(".season-name").textContent = getSeasonName(season);
    node.querySelector(".season-brand").textContent = [season.brand, season.season].filter(Boolean).join(" • ");
    node.querySelector(".season-count").textContent = `${formatCount(season.total_items)} item`;

    seasonList.appendChild(node);
  });
}

function populateSeasons() {
  seasonSelect.innerHTML = state.seasons
    .map((season) => `<option value="${escapeHtml(season.id)}">${escapeHtml(getSeasonName(season))}</option>`)
    .join("");

  state.currentSeasonId = state.seasons[0]?.id || "";
  seasonSelect.value = state.currentSeasonId;
  renderSeasonButtons();
}

function populateSelect(select, values, defaultLabel, currentValue) {
  select.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = defaultLabel;
  select.appendChild(defaultOption);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  select.value = values.includes(currentValue) ? currentValue : "all";
}

function sortValues(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function populateFilters() {
  const clubs = sortValues(state.cards.map(getClub));
  const cardTypes = sortValues(state.cards.map(getCardType));
  const parallels = sortValues(state.cards.map(getParallelType));

  state.club = clubs.includes(state.club) ? state.club : "all";
  state.cardType = cardTypes.includes(state.cardType) ? state.cardType : "all";
  state.parallel = parallels.includes(state.parallel) ? state.parallel : "all";

  populateSelect(clubFilter, clubs, "Tất cả CLB", state.club);
  populateSelect(cardTypeFilter, cardTypes, "Tất cả type", state.cardType);
  populateSelect(parallelFilter, parallels, "Tất cả parallel", state.parallel);
  featureFilter.value = state.feature;
}

function updateStats() {
  const stats = getChecklistStats();

  totalItems.textContent = formatCount(stats.total);
  numberedItems.textContent = formatCount(stats.numbered);
  autographItems.textContent = formatCount(stats.autograph);
  clubsCount.textContent = formatCount(stats.clubs);
}

function updatePagination(total) {
  const pageCount = getPageCount(total);
  state.currentPage = Math.min(Math.max(1, state.currentPage), pageCount);

  pagination.hidden = total === 0;
  pageInfo.textContent = `Trang ${state.currentPage}/${pageCount}`;
  prevPage.disabled = state.currentPage <= 1;
  nextPage.disabled = state.currentPage >= pageCount;
  pageSizeSelect.value = String(state.pageSize);
}

function renderCards() {
  const cards = getFilteredCards();
  const stats = getChecklistStats();
  const pageCount = getPageCount(cards.length);

  state.currentPage = Math.min(Math.max(1, state.currentPage), pageCount);

  const startIndex = (state.currentPage - 1) * state.pageSize;
  const pageCards = cards.slice(startIndex, startIndex + state.pageSize);
  const rangeStart = cards.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + state.pageSize, cards.length);

  cardList.innerHTML = "";
  emptyState.hidden = cards.length > 0;
  resultSummary.textContent = `${formatCount(rangeStart)}-${formatCount(rangeEnd)}/${formatCount(cards.length)} item phù hợp trong ${formatCount(stats.total)} item`;

  updateStats();
  updatePagination(cards.length);
  renderSeasonButtons();

  pageCards.forEach((card) => {
    const node = cardTemplate.content.cloneNode(true);
    const item = node.querySelector(".card-item");
    const cardType = getCardType(card);
    const parallelType = getParallelType(card);
    const serialLimit = card.serial_limit ? `/${card.serial_limit}` : "";
    const numbered = isNumbered(card);
    const autograph = isAutograph(card);

    item.classList.toggle("is-numbered", numbered);
    item.classList.toggle("is-autograph", autograph);
    node.querySelector(".card-number").textContent = `#${getCardNumber(card)}`;
    node.querySelector(".player-name").textContent = getPlayerName(card);
    node.querySelector(".club-name").textContent = getClub(card);
    node.querySelector(".card-type").textContent = cardType;
    node.querySelector(".parallel-pill").textContent = parallelType;
    node.querySelector(".serial-badge").textContent = numbered ? `Serial ${serialLimit}` : "Không serial";
    node.querySelector(".serial-badge").classList.toggle("is-active", numbered);
    node.querySelector(".auto-badge").textContent = autograph ? "Autograph" : "Không auto";
    node.querySelector(".auto-badge").classList.toggle("is-active", autograph);

    cardList.appendChild(node);
  });
}

function resetFilters() {
  state.search = "";
  state.club = "all";
  state.cardType = "all";
  state.parallel = "all";
  state.feature = "all";
  searchInput.value = "";
  clubFilter.value = "all";
  cardTypeFilter.value = "all";
  parallelFilter.value = "all";
  featureFilter.value = "all";
  resetPage();
  renderCards();
}

function resetSeasonFilters() {
  state.club = "all";
  state.cardType = "all";
  state.parallel = "all";
  state.feature = "all";
  featureFilter.value = "all";
}

function setLoading(message) {
  cardList.innerHTML = "";
  emptyState.hidden = true;
  pagination.hidden = true;
  resultSummary.textContent = message;
  activeSeasonName.textContent = message;
}

async function changeSeason(seasonId, shouldScroll = false) {
  const season = state.seasons.find((item) => item.id === seasonId) || state.seasons[0];

  if (!season) {
    state.cards = [];
    renderCards();
    return;
  }

  state.currentSeasonId = season.id;
  seasonSelect.value = season.id;
  activeSeasonName.textContent = getSeasonName(season);
  resetSeasonFilters();
  resetPage();
  renderSeasonButtons();
  setLoading(`Đang tải ${getSeasonName(season)}`);

  try {
    state.cards = await fetchJson(getChecklistUrl(season));
    activeSeasonName.textContent = getSeasonName(season);
    populateFilters();
    renderCards();

    if (shouldScroll) {
      document.querySelector("#checklistApp").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    state.cards = [];
    cardList.innerHTML = "";
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = "Không tải được checklist";
    emptyState.querySelector("p").textContent = `Kiểm tra file ${getChecklistUrl(season)}.`;
    resultSummary.textContent = "Lỗi dữ liệu";
    activeSeasonName.textContent = "Không tải được dữ liệu";
    updateStats();
    console.error(error);
  }
}

function bindEvents() {
  seasonSelect.addEventListener("change", (event) => {
    changeSeason(event.target.value);
  });

  seasonList.addEventListener("click", (event) => {
    const button = event.target.closest(".season-button");

    if (!button) {
      return;
    }

    changeSeason(button.dataset.seasonId, true);
  });

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    resetPage();
    renderCards();
  });

  clubFilter.addEventListener("change", (event) => {
    state.club = event.target.value;
    resetPage();
    renderCards();
  });

  cardTypeFilter.addEventListener("change", (event) => {
    state.cardType = event.target.value;
    resetPage();
    renderCards();
  });

  parallelFilter.addEventListener("change", (event) => {
    state.parallel = event.target.value;
    resetPage();
    renderCards();
  });

  featureFilter.addEventListener("change", (event) => {
    state.feature = event.target.value;
    resetPage();
    renderCards();
  });

  clearFilters.addEventListener("click", resetFilters);

  prevPage.addEventListener("click", () => {
    state.currentPage -= 1;
    renderCards();
    document.querySelector("#checklistApp").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  nextPage.addEventListener("click", () => {
    state.currentPage += 1;
    renderCards();
    document.querySelector("#checklistApp").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  pageSizeSelect.addEventListener("change", (event) => {
    state.pageSize = Number(event.target.value) || 24;
    resetPage();
    renderCards();
  });
}

async function init() {
  renderChannels();
  bindEvents();
  setLoading("Đang tải danh sách checklist");

  try {
    state.seasons = await fetchJson("data/list.json");
    populateSeasons();
    await changeSeason(state.currentSeasonId);
  } catch (error) {
    cardList.innerHTML = "";
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = "Không tải được danh sách checklist";
    emptyState.querySelector("p").textContent = "Kiểm tra file data/list.json và chạy bằng static server.";
    resultSummary.textContent = "Lỗi dữ liệu";
    activeSeasonName.textContent = "Không tải được dữ liệu";
    console.error(error);
  }
}

init();
