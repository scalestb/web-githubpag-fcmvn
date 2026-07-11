const seasonSelect = document.querySelector("#seasonSelect");
const searchInput = document.querySelector("#searchInput");
const stockOnly = document.querySelector("#stockOnly");
const clearFilters = document.querySelector("#clearFilters");
const cardList = document.querySelector("#cardList");
const cardTemplate = document.querySelector("#cardTemplate");
const resultSummary = document.querySelector("#resultSummary");
const emptyState = document.querySelector("#emptyState");

const DEFAULT_IMAGE = "assets/card-placeholder.svg";
const SHOPEE_URL = "https://shopee.vn/fcmvn_com";

const state = {
  seasons: [],
  cards: [],
  currentSeasonId: "",
  search: "",
  stockOnly: false
};

const rarityClasses = {
  BASE: "",
  "GOLDEN BALLERS": "gold",
  "FAN FAVOURITE": "blue",
  "TEAM CREST": "green",
  ICON: "red",
  CONTENDERS: "blue",
  "TOP KEEPERS": "green",
  "DEFENSIVE ROCKS": "green",
  "MIDFIELD MAESTROS": "blue",
  "GOAL MACHINES": "gold",
  "MASTER ROOKIES": "red",
  "OFFICIAL EMBLEM": "gold",
  "OFFICIAL MASCOT": "blue",
  "ETERNOS 22": "red"
};

function normalizeText(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function escapeHtml(value) {
  return (value ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatCardNumber(number) {
  return `#${String(number ?? "").padStart(3, "0")}`;
}

function getCardCode(card) {
  return card.code || formatCardNumber(card.number);
}

function getSeasonCardsUrl(season) {
  if (season.cardsUrl) {
    return season.cardsUrl;
  }

  return `data/cards/${season.id}.json`;
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Không đọc được ${url}`);
  }

  return response.json();
}

async function loadCardsForSeason(season) {
  const primaryUrl = getSeasonCardsUrl(season);

  try {
    return await fetchJson(primaryUrl);
  } catch (error) {
    const fallbackUrl = `cards/${season.id}.json`;

    if (primaryUrl === fallbackUrl) {
      throw error;
    }

    return fetchJson(fallbackUrl);
  }
}

function cardHasStock(card) {
  return Number(card.stock) > 0;
}

function getFilteredCards() {
  const query = normalizeText(state.search);

  return state.cards.filter((card) => {
    const searchable = normalizeText(`${card.number} ${getCardCode(card)} ${card.name} ${card.team} ${card.rarity}`);
    const matchesSearch = !query || searchable.includes(query);
    const matchesStock = !state.stockOnly || cardHasStock(card);

    return matchesSearch && matchesStock;
  });
}

function populateSeasons() {
  seasonSelect.innerHTML = state.seasons
    .map((season) => `<option value="${escapeHtml(season.id)}">${escapeHtml(season.name)}</option>`)
    .join("");

  state.currentSeasonId = state.seasons[0]?.id || "";
  seasonSelect.value = state.currentSeasonId;
}

function renderCards() {
  const cards = getFilteredCards();
  const totalStock = state.cards.reduce((sum, card) => sum + Number(card.stock || 0), 0);

  cardList.innerHTML = "";
  emptyState.hidden = cards.length > 0;
  resultSummary.textContent = `${cards.length}/${state.cards.length} thẻ • Tồn ${totalStock}`;

  cards.forEach((card) => {
    const node = cardTemplate.content.cloneNode(true);
    const item = node.querySelector(".card-item");
    const image = node.querySelector(".card-image");
    const rarityPill = node.querySelector(".rarity-pill");
    const rarityText = node.querySelector(".rarity-text");
    const status = node.querySelector(".card-status");
    const stock = node.querySelector(".stock-value");
    const movement = node.querySelector(".movement-value");
    const buyLink = node.querySelector(".buy-link");

    const inStock = cardHasStock(card);
    const imageUrl = card.imageUrl || DEFAULT_IMAGE;

    item.classList.add(inStock ? "has-stock" : "out-stock");
    image.src = imageUrl;
    image.alt = `${card.name || "Thẻ"} - ${getCardCode(card)}`;
    image.onerror = () => {
      image.onerror = null;
      image.src = DEFAULT_IMAGE;
    };

    node.querySelector(".card-code").textContent = getCardCode(card);
    node.querySelector(".card-name").textContent = card.name || "Chưa có tên";

    rarityPill.textContent = card.rarity || "Khác";
    rarityText.textContent = card.rarity || "Khác";
    if (rarityClasses[card.rarity]) {
      rarityPill.classList.add(rarityClasses[card.rarity]);
    }

    status.textContent = inStock ? "Có hàng" : "Hết hàng";
    status.classList.add(inStock ? "available" : "unavailable");
    stock.textContent = `Tồn ${Number(card.stock || 0)}`;
    movement.textContent = `Nhập ${card.totalInbound ?? 0} / Xuất ${card.totalOutbound ?? 0}`;

    buyLink.href = card.shopeeLink || SHOPEE_URL;
    buyLink.setAttribute("aria-label", `Mua ${card.name || "thẻ"} trên Shopee`);

    cardList.appendChild(node);
  });
}

function resetFilters() {
  state.search = "";
  state.stockOnly = false;
  searchInput.value = "";
  stockOnly.checked = false;
  renderCards();
}

function setLoading(message) {
  cardList.innerHTML = "";
  emptyState.hidden = true;
  resultSummary.textContent = message;
}

async function changeSeason(seasonId) {
  const season = state.seasons.find((item) => item.id === seasonId) || state.seasons[0];

  if (!season) {
    state.cards = [];
    renderCards();
    return;
  }

  state.currentSeasonId = season.id;
  seasonSelect.value = season.id;
  setLoading(`Đang tải ${season.name}`);

  try {
    state.cards = await loadCardsForSeason(season);
    renderCards();
  } catch (error) {
    state.cards = [];
    cardList.innerHTML = "";
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = "Không tải được danh sách thẻ";
    emptyState.querySelector("p").textContent = `Kiểm tra file data/cards/${season.id}.json.`;
    resultSummary.textContent = "Lỗi dữ liệu";
    console.error(error);
  }
}

function bindEvents() {
  seasonSelect.addEventListener("change", (event) => {
    changeSeason(event.target.value);
  });

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderCards();
  });

  stockOnly.addEventListener("change", (event) => {
    state.stockOnly = event.target.checked;
    renderCards();
  });

  clearFilters.addEventListener("click", resetFilters);
}

async function init() {
  bindEvents();
  setLoading("Đang tải mùa thẻ");

  try {
    state.seasons = await fetchJson("data/seasons.json");
    populateSeasons();
    await changeSeason(state.currentSeasonId);
  } catch (error) {
    cardList.innerHTML = "";
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = "Không tải được mùa thẻ";
    emptyState.querySelector("p").textContent = "Kiểm tra file data/seasons.json và chạy bằng static server.";
    resultSummary.textContent = "Lỗi dữ liệu";
    console.error(error);
  }
}

init();
