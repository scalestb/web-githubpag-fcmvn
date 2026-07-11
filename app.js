const seasonSelect = document.querySelector("#seasonSelect");
const raritySelect = document.querySelector("#raritySelect");
const searchInput = document.querySelector("#searchInput");
const stockOnly = document.querySelector("#stockOnly");
const ownedOnlyLabel = document.querySelector("#ownedOnlyLabel");
const clearFilters = document.querySelector("#clearFilters");
const cardGrid = document.querySelector("#cardGrid");
const cardTemplate = document.querySelector("#cardTemplate");
const resultSummary = document.querySelector("#resultSummary");
const emptyState = document.querySelector("#emptyState");
const seasonBadge = document.querySelector("#seasonBadge");
const viewButtons = document.querySelectorAll(".view-button");

const viewModes = ["grid", "list", "compact"];

function getSavedViewMode() {
  try {
    const viewMode = localStorage.getItem("cardViewMode");
    return viewModes.includes(viewMode) ? viewMode : "grid";
  } catch (error) {
    return "grid";
  }
}

const state = {
  seasons: [],
  cards: [],
  currentSeason: "",
  search: "",
  rarity: "",
  ownedOnly: false,
  hasSeasonFilter: false,
  viewMode: getSavedViewMode()
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

function formatStock(amount) {
  return Number(amount) > 0 ? `${amount} thẻ` : "Hết hàng";
}

function formatCardNumber(number) {
  return `#${String(number).padStart(3, "0")}`;
}

function getCardCode(card) {
  return card.code || formatCardNumber(card.number);
}

function getImageCandidates(card) {
  const explicitImage = card.imageUrl || card.image;
  const localCandidates = card.number
    ? ["png", "jpg", "jpeg", "webp"].map((extension) => {
        const baseName = String(card.number).padStart(3, "0");
        return `assets/cards/${baseName}.${extension}`;
      })
    : [];

  if (explicitImage) {
    return [explicitImage, ...localCandidates];
  }

  return localCandidates;
}

function cardMatchesToggle(card) {
  if (!state.ownedOnly) {
    return true;
  }

  return state.hasSeasonFilter ? Number(card.stock) > 0 : card.hasCard;
}

function cardIsAvailable(card) {
  return state.hasSeasonFilter ? Number(card.stock) > 0 : card.hasCard;
}

function applyImageFallback(image, card) {
  const candidates = getImageCandidates(card);
  let index = 0;

  if (candidates.length === 0) {
    image.closest(".card-image-wrap")?.classList.add("missing-image");
    return;
  }

  image.onerror = () => {
    index += 1;

    if (index < candidates.length) {
      image.src = candidates[index];
      return;
    }

    image.onerror = null;
    image.removeAttribute("src");
    image.closest(".card-image-wrap")?.classList.add("missing-image");
  };

  image.src = candidates[0];
}

function populateSeasons() {
  seasonSelect.disabled = !state.hasSeasonFilter;

  if (!state.hasSeasonFilter) {
    const label = state.seasons[0]?.name || "Tất cả thẻ";
    seasonSelect.innerHTML = `<option value="">${label}</option>`;
    state.currentSeason = "";
    seasonSelect.value = "";
    return;
  }

  seasonSelect.innerHTML = state.seasons
    .map((season) => `<option value="${season.id}">${season.name}</option>`)
    .join("");

  state.currentSeason = state.seasons[0]?.id || "";
  seasonSelect.value = state.currentSeason;
}

function populateRarities() {
  const rarities = [...new Set(
    state.cards
      .filter((card) => !state.hasSeasonFilter || card.seasonId === state.currentSeason)
      .map((card) => card.rarity)
  )].sort();

  raritySelect.innerHTML = [
    '<option value="">Tất cả rarity</option>',
    ...rarities.map((rarity) => `<option value="${rarity}">${rarity}</option>`)
  ].join("");
}

function getCurrentSeasonName() {
  if (!state.hasSeasonFilter) {
    return state.seasons[0]?.name || "Checklist thẻ";
  }

  return state.seasons.find((season) => season.id === state.currentSeason)?.name || "";
}

function getFilteredCards() {
  const query = normalizeText(state.search);

  return state.cards.filter((card) => {
    const belongsToSeason = !state.hasSeasonFilter || card.seasonId === state.currentSeason;
    const matchesRarity = !state.rarity || card.rarity === state.rarity;
    const matchesOwnership = cardMatchesToggle(card);
    const searchable = normalizeText(`${card.number} ${getCardCode(card)} ${card.name} ${card.team} ${card.rarity}`);
    const matchesSearch = !query || searchable.includes(query);

    return belongsToSeason && matchesRarity && matchesOwnership && matchesSearch;
  });
}

function setViewMode(viewMode, shouldPersist = true) {
  const nextViewMode = viewModes.includes(viewMode) ? viewMode : "grid";
  state.viewMode = nextViewMode;

  cardGrid.classList.remove(...viewModes.map((mode) => `is-${mode}`));
  cardGrid.classList.add(`is-${nextViewMode}`);

  viewButtons.forEach((button) => {
    const isActive = button.dataset.view === nextViewMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (shouldPersist) {
    try {
      localStorage.setItem("cardViewMode", nextViewMode);
    } catch (error) {
      // Ignore private browsing storage errors.
    }
  }
}

function renderCards() {
  const cards = getFilteredCards();
  const seasonName = getCurrentSeasonName();

  cardGrid.innerHTML = "";
  emptyState.hidden = cards.length > 0;
  resultSummary.textContent = `${cards.length} thẻ được tìm thấy`;
  seasonBadge.textContent = seasonName || "Chưa có dữ liệu thẻ";

  cards.forEach((card) => {
    const node = cardTemplate.content.cloneNode(true);
    const cardItem = node.querySelector(".card-item");
    const image = node.querySelector(".card-image");
    const rarityPill = node.querySelector(".rarity-pill");
    const cardStatus = node.querySelector(".card-status");
    const stockValue = node.querySelector(".stock-value");
    const movementValue = node.querySelector(".movement-value");
    const buyLink = node.querySelector(".buy-link");

    const isAvailable = cardIsAvailable(card);

    cardItem.classList.add(isAvailable ? "has-card" : "missing-card");
    applyImageFallback(image, card);
    image.alt = `${card.name} - ${getCardCode(card)}`;
    node.querySelector(".card-code").textContent = getCardCode(card);
    node.querySelector(".card-name").textContent = card.name;

    cardStatus.textContent = isAvailable ? "Có thẻ" : "Chưa có thẻ";
    cardStatus.classList.add(isAvailable ? "available" : "unavailable");

    rarityPill.textContent = card.rarity;
    if (rarityClasses[card.rarity]) {
      rarityPill.classList.add(rarityClasses[card.rarity]);
    }

    stockValue.textContent = formatStock(card.stock);
    if (Number(card.stock) === 0) {
      stockValue.classList.add("out");
    }

    movementValue.textContent = `Nhập ${card.totalInbound ?? 0} / Xuất ${card.totalOutbound ?? 0}`;
    buyLink.href = card.shopeeLink || "https://shopee.vn/fcmvn_com";
    buyLink.setAttribute("aria-label", `Mua ${card.name} trên Shopee`);

    cardGrid.appendChild(node);
  });
}

function resetFilters() {
  state.search = "";
  state.rarity = "";
  state.ownedOnly = false;
  searchInput.value = "";
  raritySelect.value = "";
  stockOnly.checked = false;
  renderCards();
}

function bindEvents() {
  seasonSelect.addEventListener("change", (event) => {
    if (!state.hasSeasonFilter) {
      return;
    }

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
    state.ownedOnly = event.target.checked;
    renderCards();
  });

  clearFilters.addEventListener("click", resetFilters);

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setViewMode(button.dataset.view);
    });
  });
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
    state.hasSeasonFilter = state.cards.some((card) => card.seasonId);

    if (ownedOnlyLabel) {
      ownedOnlyLabel.textContent = state.hasSeasonFilter ? "Chỉ còn hàng" : "Chỉ có thẻ";
    }

    populateSeasons();
    populateRarities();
    bindEvents();
    setViewMode(state.viewMode, false);
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
