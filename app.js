const seasonSelect = document.querySelector("#seasonSelect");
const raritySelect = document.querySelector("#raritySelect");
const searchInput = document.querySelector("#searchInput");
const stockOnly = document.querySelector("#stockOnly");
const clearFilters = document.querySelector("#clearFilters");
const cardGrid = document.querySelector("#cardGrid");
const cardTemplate = document.querySelector("#cardTemplate");
const resultSummary = document.querySelector("#resultSummary");
const emptyState = document.querySelector("#emptyState");
const seasonBadge = document.querySelector("#seasonBadge");

const state = {
  seasons: [],
  cards: [],
  currentSeason: "",
  search: "",
  rarity: "",
  stockOnly: false
};

const rarityClasses = {
  Base: "",
  Silver: "blue",
  Gold: "gold",
  "Gold Parallel": "gold",
  "Rainbow Foil": "blue",
  "Captain": "red",
  Legend: "red",
  "Top Scorer": "gold",
  "Rookie": "blue"
};

function normalizeText(value) {
  return value.toString().trim().toLowerCase();
}

function formatStock(amount) {
  return amount > 0 ? `${amount} thẻ` : "Hết hàng";
}

function populateSeasons() {
  seasonSelect.innerHTML = state.seasons
    .map((season) => `<option value="${season.id}">${season.name}</option>`)
    .join("");

  state.currentSeason = state.seasons[0]?.id || "";
  seasonSelect.value = state.currentSeason;
}

function populateRarities() {
  const rarities = [...new Set(
    state.cards
      .filter((card) => card.seasonId === state.currentSeason)
      .map((card) => card.rarity)
  )].sort();

  raritySelect.innerHTML = [
    '<option value="">Tất cả rarity</option>',
    ...rarities.map((rarity) => `<option value="${rarity}">${rarity}</option>`)
  ].join("");
}

function getCurrentSeasonName() {
  return state.seasons.find((season) => season.id === state.currentSeason)?.name || "";
}

function getFilteredCards() {
  const query = normalizeText(state.search);

  return state.cards.filter((card) => {
    const belongsToSeason = card.seasonId === state.currentSeason;
    const matchesRarity = !state.rarity || card.rarity === state.rarity;
    const matchesStock = !state.stockOnly || card.stock > 0;
    const searchable = normalizeText(`${card.code} ${card.name} ${card.team} ${card.rarity}`);
    const matchesSearch = !query || searchable.includes(query);

    return belongsToSeason && matchesRarity && matchesStock && matchesSearch;
  });
}

function renderCards() {
  const cards = getFilteredCards();
  const seasonName = getCurrentSeasonName();

  cardGrid.innerHTML = "";
  emptyState.hidden = cards.length > 0;
  resultSummary.textContent = `${cards.length} thẻ được tìm thấy`;
  seasonBadge.textContent = seasonName || "Chưa có mùa thẻ";

  cards.forEach((card) => {
    const node = cardTemplate.content.cloneNode(true);
    const cardItem = node.querySelector(".card-item");
    const image = node.querySelector(".card-image");
    const rarityPill = node.querySelector(".rarity-pill");
    const stockValue = node.querySelector(".stock-value");
    const buyLink = node.querySelector(".buy-link");

    cardItem.classList.add(card.stock > 0 ? "in-stock" : "out-of-stock");
    image.src = card.image;
    image.alt = `${card.name} - ${card.code}`;
    node.querySelector(".card-code").textContent = card.code;
    node.querySelector(".card-name").textContent = card.name;
    node.querySelector(".card-team").textContent = card.team;
    rarityPill.textContent = card.rarity;
    if (rarityClasses[card.rarity]) {
      rarityPill.classList.add(rarityClasses[card.rarity]);
    }
    stockValue.textContent = formatStock(card.stock);
    buyLink.href = card.shopeeUrl || "https://shopee.vn/fcmvn_com";
    buyLink.setAttribute("aria-label", `Mua ${card.name} trên Shopee`);

    if (card.stock === 0) {
      stockValue.classList.add("out");
    }

    cardGrid.appendChild(node);
  });
}

function resetFilters() {
  state.search = "";
  state.rarity = "";
  state.stockOnly = false;
  searchInput.value = "";
  raritySelect.value = "";
  stockOnly.checked = false;
  renderCards();
}

function bindEvents() {
  seasonSelect.addEventListener("change", (event) => {
    state.currentSeason = event.target.value;
    state.rarity = "";
    raritySelect.value = "";
    populateRarities();
    renderCards();
  });

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderCards();
  });

  raritySelect.addEventListener("change", (event) => {
    state.rarity = event.target.value;
    renderCards();
  });

  stockOnly.addEventListener("change", (event) => {
    state.stockOnly = event.target.checked;
    renderCards();
  });

  clearFilters.addEventListener("click", resetFilters);
}

async function loadData() {
  try {
    const [seasonsResponse, cardsResponse] = await Promise.all([
      fetch("data/seasons.json"),
      fetch("data/cards.json")
    ]);

    if (!seasonsResponse.ok || !cardsResponse.ok) {
      throw new Error("Không đọc được dữ liệu JSON.");
    }

    state.seasons = await seasonsResponse.json();
    state.cards = await cardsResponse.json();

    populateSeasons();
    populateRarities();
    bindEvents();
    renderCards();
  } catch (error) {
    cardGrid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = "Không tải được dữ liệu";
    emptyState.querySelector("p").textContent = "Hãy chạy trang qua GitHub Pages hoặc một local static server.";
    resultSummary.textContent = "Lỗi dữ liệu";
    seasonBadge.textContent = "JSON chưa sẵn sàng";
    console.error(error);
  }
}

loadData();
