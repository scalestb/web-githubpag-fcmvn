const $ = (selector) => document.querySelector(selector);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function safeLink(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function sourceAnchor(url, label, className) {
  const href = safeLink(url);
  if (!href) return null;
  const a = el('a', className, label);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('aria-label', `${label} (mở tab mới)`);
  return a;
}

function renderHot(items) {
  const grid = $('#hot-grid');
  grid.replaceChildren();
  if (!items.length) {
    grid.append(el('p', 'empty-state', 'Chưa có card nào. Thêm dữ liệu vào data/hot.json.'));
    return;
  }
  items.forEach((item, index) => {
    const article = el('article', 'hot-card');
    const art = el('div', 'hot-card-art');
    art.dataset.tone = ['green', 'peach', 'blue', 'sand'].includes(item.tone) ? item.tone : 'green';
    const mini = el('div', 'art-card-mini');
    mini.append(el('span', '', item.series || 'FCMVN'));
    mini.append(el('div', 'mini-ball', item.symbol || '⚽'));
    mini.append(el('strong', '', item.cardLabel || 'COLLECTOR'));
    art.append(mini, el('span', 'art-number', String(index + 1).padStart(2, '0')));
    const body = el('div', 'hot-card-body');
    const meta = el('div', 'hot-card-meta');
    meta.append(el('span', '', item.category || 'CARD'), el('span', '', item.date || ''));
    body.append(meta, el('h3', '', item.title || 'Chưa đặt tên'), el('p', '', item.description || ''));
    const footer = el('div', 'hot-card-footer');
    footer.append(el('span', 'tag', item.tag || 'SƯU TẦM'));
    const link = sourceAnchor(item.sourceUrl, '↗', 'outbound');
    if (link) footer.append(link);
    body.append(footer);
    article.append(art, body);
    grid.append(article);
  });
}

function renderBids(items) {
  const list = $('#bid-list');
  list.replaceChildren();
  if (!items.length) {
    list.append(el('p', 'empty-state', 'Chưa có bài bid nào. Thêm dữ liệu vào data/bids.json.'));
    return;
  }
  items.forEach((item) => {
    const article = el('article', 'bid-item');
    article.append(el('div', 'bid-icon', item.symbol || '★'));
    const copy = el('div', 'bid-text');
    copy.append(el('h3', '', item.title || 'Bài bid'), el('p', '', item.detail || ''));
    article.append(copy);
    const price = el('div', 'bid-price');
    price.append(el('small', '', item.priceLabel || 'GIÁ HIỆN TẠI'), document.createTextNode(item.price || 'Xem bài gốc'));
    article.append(price);
    const link = sourceAnchor(item.sourceUrl, '↗', 'bid-link');
    if (link) article.append(link);
    list.append(article);
  });
}

function renderCommunity(data) {
  const reportList = $('#report-list');
  const legitList = $('#legit-list');
  reportList.replaceChildren();
  legitList.replaceChildren();
  const reports = Array.isArray(data.reports) ? data.reports : [];
  const legit = Array.isArray(data.legit) ? data.legit : [];
  if (!reports.length) reportList.append(el('p', 'empty-state', 'Chưa có thông tin cảnh báo được xác minh.'));
  reports.forEach((item) => {
    const article = el('article', 'report-item');
    const top = el('div', 'report-top');
    top.append(el('span', 'report-status', item.status || 'CẦN KIỂM CHỨNG'), el('span', 'report-date', item.date || ''));
    article.append(top, el('h4', '', item.title || 'Thông tin cộng đồng'), el('p', '', item.description || ''));
    const account = el('div', 'report-account');
    account.append(document.createTextNode('Tài khoản liên quan: '));
    const link = sourceAnchor(item.accountUrl, item.account || 'Chưa có', '');
    account.append(link || document.createTextNode(item.account || 'Chưa có'));
    article.append(account);
    const source = sourceAnchor(item.sourceUrl, 'Xem nguồn và bằng chứng ↗', 'report-source');
    if (source) article.append(source);
    reportList.append(article);
  });
  if (!legit.length) legitList.append(el('p', 'empty-state', 'Chưa có tài khoản được đối chiếu.'));
  legit.forEach((item) => {
    const row = el('div', 'legit-item');
    row.append(el('span', 'legit-avatar', (item.name || '?').charAt(0).toUpperCase()));
    const copy = el('div');
    const name = sourceAnchor(item.accountUrl, item.name || 'Tài khoản', '');
    const strong = el('strong');
    strong.append(name || document.createTextNode(item.name || 'Tài khoản'));
    copy.append(strong, el('small', '', item.note || 'Đang đối chiếu'));
    row.append(copy, el('span', 'verify', '✓'));
    legitList.append(row);
  });
}

async function loadData() {
  const definitions = [
    { path: './data/hot.json', render: renderHot, fallback: '#hot-grid' },
    { path: './data/bids.json', render: renderBids, fallback: '#bid-list' },
    { path: './data/community.json', render: renderCommunity, fallback: '#report-list' },
  ];
  await Promise.all(definitions.map(async ({ path, render, fallback }) => {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      render(data);
    } catch (error) {
      $(fallback).replaceChildren(el('p', 'empty-state', 'Không tải được dữ liệu. Hãy mở trang qua máy chủ web hoặc thử tải lại.'));
      if (path.includes('community')) $('#legit-list').replaceChildren(el('p', 'empty-state', 'Không tải được dữ liệu.'));
      console.error(`Không tải được ${path}:`, error);
    }
  }));
}

const PIP_POSITIONS = {
  1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9],
};

function showDice(values) {
  const tray = $('#dice-tray');
  tray.replaceChildren();
  if (!values.length) {
    tray.append(el('div', 'empty-dice', '✦'));
    return;
  }
  values.forEach((value) => {
    const die = el('div', 'die');
    die.setAttribute('role', 'img');
    die.setAttribute('aria-label', `Xúc xắc: ${value}`);
    PIP_POSITIONS[value].forEach((position) => {
      const pip = el('span', 'pip');
      pip.style.gridArea = `${Math.ceil(position / 3)} / ${((position - 1) % 3) + 1}`;
      die.append(pip);
    });
    tray.append(die);
  });
}

function randomIndex(max) {
  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  const buffer = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

function participantNames() {
  return $('#participants').value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
}

function updateParticipantCount() {
  const count = participantNames().length;
  $('#participant-count').textContent = `${count} vé`;
}

function updateDiceMode() {
  const count = Number($('input[name="dice"]:checked').value);
  $('#manual-rounds').hidden = count > 0;
  $('#rounds').disabled = count > 0;
  $('#round-help').textContent = count ? 'Tổng điểm gieo sẽ quyết định số vòng quay (1–18 vòng).' : 'Chọn số vòng quay từ 1 đến 18.';
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runDraw(event) {
  event.preventDefault();
  const prize = $('#prize').value.trim();
  const names = participantNames();
  const diceCount = Number($('input[name="dice"]:checked').value);
  const manualRounds = Number($('#rounds').value);
  if (!prize) {
    $('#prize').setCustomValidity('Hãy nhập phần thưởng.');
    $('#prize').reportValidity();
    return;
  }
  if (names.length < 2) {
    $('#participants').setCustomValidity('Cần ít nhất 2 vé để quay.');
    $('#participants').reportValidity();
    return;
  }
  if (names.length > 1000) {
    $('#participants').setCustomValidity('Tối đa 1.000 vé mỗi lượt quay.');
    $('#participants').reportValidity();
    return;
  }
  if (!diceCount && (!Number.isInteger(manualRounds) || manualRounds < 1 || manualRounds > 18)) {
    $('#rounds').setCustomValidity('Chọn từ 1 đến 18 vòng.');
    $('#rounds').reportValidity();
    return;
  }
  const button = $('#draw-button');
  const stage = $('.razz-stage');
  button.disabled = true;
  stage.classList.remove('is-winner');
  stage.classList.add('is-spinning');
  $('#stage-overline').textContent = diceCount ? 'ĐANG GIEO XÚC XẮC' : 'CHUẨN BỊ QUAY';
  $('#stage-name').textContent = 'Sẵn sàng...';
  $('#stage-detail').textContent = `${names.length} vé tranh phần thưởng: ${prize}`;
  try {
    const dice = Array.from({ length: diceCount }, () => randomIndex(6) + 1);
    showDice(dice);
    const rounds = diceCount ? dice.reduce((sum, value) => sum + value, 0) : manualRounds;
    await delay(600);
    let winner = '';
    for (let round = 1; round <= rounds; round += 1) {
      winner = names[randomIndex(names.length)];
      $('#stage-overline').textContent = `VÒNG ${String(round).padStart(2, '0')} / ${String(rounds).padStart(2, '0')}`;
      $('#stage-name').textContent = winner;
      $('#round-progress').textContent = `${String(round).padStart(2, '0')} / ${String(rounds).padStart(2, '0')} VÒNG`;
      await delay(round === rounds ? 550 : 170);
    }
    stage.classList.remove('is-spinning');
    stage.classList.add('is-winner');
    $('#stage-overline').textContent = '✦ NGƯỜI TRÚNG RAZZ ✦';
    $('#stage-detail').textContent = `${winner} nhận: ${prize}. ${diceCount ? `Xúc xắc ra ${dice.join(' + ')} = ${rounds} vòng.` : `${rounds} vòng quay.`}`;
  } catch (error) {
    stage.classList.remove('is-spinning');
    $('#stage-overline').textContent = 'KHÔNG THỂ QUAY';
    $('#stage-name').textContent = 'Thử lại nhé';
    $('#stage-detail').textContent = 'Trình duyệt không hỗ trợ bộ tạo số ngẫu nhiên bảo mật.';
    console.error('Lỗi quay Razz:', error);
  } finally {
    button.disabled = false;
  }
}

$('#participants').addEventListener('input', () => {
  $('#participants').setCustomValidity('');
  updateParticipantCount();
});
$('#prize').addEventListener('input', () => $('#prize').setCustomValidity(''));
$('#rounds').addEventListener('input', () => $('#rounds').setCustomValidity(''));
document.querySelectorAll('input[name="dice"]').forEach((input) => input.addEventListener('change', updateDiceMode));
$('#razz-form').addEventListener('submit', runDraw);
updateParticipantCount();
updateDiceMode();
loadData();
