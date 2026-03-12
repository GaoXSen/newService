const els = {
  appName: document.querySelector("#appName"),
  iosScheme: document.querySelector("#iosScheme"),
  androidScheme: document.querySelector("#androidScheme"),
  iosStoreUrl: document.querySelector("#iosStoreUrl"),
  androidStoreUrl: document.querySelector("#androidStoreUrl"),
  webUrl: document.querySelector("#webUrl"),
  helpUrl: document.querySelector("#helpUrl"),
  contactUrl: document.querySelector("#contactUrl"),
  privacyUrl: document.querySelector("#privacyUrl"),
  launchButton: document.querySelector("#launchButton"),
  copyButton: document.querySelector("#copyButton"),
  sceneLaunchButton: document.querySelector("#sceneLaunchButton"),
  clockButton: document.querySelector("#clockButton"),
  ipButton: document.querySelector("#ipButton"),
  geoButton: document.querySelector("#geoButton"),
  speedButton: document.querySelector("#speedButton"),
  restartGameButton: document.querySelector("#restartGameButton"),
  deviceInfo: document.querySelector("#deviceInfo"),
  browserInfo: document.querySelector("#browserInfo"),
  statusBox: document.querySelector("#statusBox"),
  clockValue: document.querySelector("#clockValue"),
  ipValue: document.querySelector("#ipValue"),
  geoValue: document.querySelector("#geoValue"),
  speedValue: document.querySelector("#speedValue"),
  networkMeta: document.querySelector("#networkMeta"),
  gameBoard: document.querySelector("#gameBoard"),
  scoreValue: document.querySelector("#scoreValue"),
  gameMessage: document.querySelector("#gameMessage"),
};

const GAME_SIZE = 4;
let board = [];
let score = 0;
let touchStartX = 0;
let touchStartY = 0;

function getEnvironment() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isWeChat = /MicroMessenger/i.test(ua);
  const isWeibo = /Weibo/i.test(ua);
  const isQQ = /QQ\//i.test(ua);

  return {
    ua,
    isIOS,
    isAndroid,
    isWeChat,
    isWeibo,
    isQQ,
    label: isIOS ? "iPhone / iPad" : isAndroid ? "Android" : "Desktop / Other",
  };
}

function setStatus(message, type = "default") {
  els.statusBox.textContent = message;
  els.statusBox.className = "status-box";
  if (type !== "default") {
    els.statusBox.classList.add(type);
  }
}

function updateEnvironmentView(env) {
  const browserLabel = env.isWeChat
    ? "微信内打开，深链常被限制"
    : env.isWeibo
      ? "微博内打开，深链可能受限"
      : env.isQQ
        ? "QQ 内打开，深链可能受限"
        : "系统浏览器或普通 WebView";

  els.deviceInfo.textContent = env.label;
  els.browserInfo.textContent = browserLabel;
}

function getConfig() {
  return {
    appName: els.appName.value.trim() || "Demo App",
    iosScheme: els.iosScheme.value.trim(),
    androidScheme: els.androidScheme.value.trim(),
    iosStoreUrl: els.iosStoreUrl.value.trim(),
    androidStoreUrl: els.androidStoreUrl.value.trim(),
    webUrl: els.webUrl.value.trim(),
    helpUrl: els.helpUrl.value.trim(),
    contactUrl: els.contactUrl.value.trim(),
    privacyUrl: els.privacyUrl.value.trim(),
  };
}

function getLaunchUrl(config, env) {
  if (env.isIOS) {
    return config.iosScheme;
  }
  if (env.isAndroid) {
    return config.androidScheme;
  }
  return "";
}

function getFallbackUrl(config, env) {
  if (env.isIOS) {
    return config.iosStoreUrl;
  }
  if (env.isAndroid) {
    return config.androidStoreUrl;
  }
  return config.iosStoreUrl || config.androidStoreUrl;
}

function openUrl(url) {
  if (!url) {
    return false;
  }

  window.location.href = url;
  return true;
}

function openNamedLink(key) {
  const config = getConfig();
  const url = config[key];
  if (!url) {
    setStatus("当前入口还没有配置地址，请先填写对应链接。", "error");
    return;
  }

  setStatus(`正在打开 ${url}`);
  openUrl(url);
}

function updateClock() {
  const now = new Date();
  els.clockValue.textContent = now.toLocaleString("zh-CN", {
    hour12: false,
  });
}

async function fetchIp() {
  els.ipValue.textContent = "查询中...";
  try {
    const response = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    els.ipValue.textContent = data.ip || "未返回 IP";
    setStatus("公网 IP 查询成功。", "success");
  } catch (error) {
    els.ipValue.textContent = "查询失败";
    setStatus("公网 IP 查询失败，可能是网络、跨域或目标服务不可用。", "error");
  }
}

function fetchGeolocation() {
  if (!navigator.geolocation) {
    els.geoValue.textContent = "当前浏览器不支持";
    setStatus("当前浏览器不支持定位接口。", "error");
    return;
  }

  els.geoValue.textContent = "定位中...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      els.geoValue.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      setStatus(`定位成功，精度约 ${Math.round(accuracy)} 米。`, "success");
    },
    (error) => {
      els.geoValue.textContent = "定位失败";
      setStatus(`定位失败：${error.message}`, "error");
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    }
  );
}

function updateNetworkMeta() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) {
    els.networkMeta.textContent = "当前浏览器未提供 Network Information API。";
    return;
  }

  const parts = [];
  if (connection.effectiveType) {
    parts.push(`网络类型 ${connection.effectiveType}`);
  }
  if (typeof connection.downlink === "number") {
    parts.push(`下行 ${connection.downlink} Mbps`);
  }
  if (typeof connection.rtt === "number") {
    parts.push(`RTT ${connection.rtt} ms`);
  }
  els.networkMeta.textContent = parts.join("，") || "已检测到网络信息。";
}

async function quickSpeedTest() {
  els.speedValue.textContent = "测速中...";
  const probeUrl = `./app.js?probe=${Date.now()}`;
  const startedAt = performance.now();

  try {
    const response = await fetch(probeUrl, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    await response.text();
    const duration = Math.round(performance.now() - startedAt);
    els.speedValue.textContent = `${duration} ms`;
    setStatus("站点快速测速完成。", "success");
  } catch (error) {
    els.speedValue.textContent = "测速失败";
    setStatus("测速失败，可能是当前网络环境阻断了资源请求。", "error");
  }
}

function createEmptyBoard() {
  return Array.from({ length: GAME_SIZE }, () => Array(GAME_SIZE).fill(0));
}

function getEmptyCells() {
  const cells = [];
  for (let row = 0; row < GAME_SIZE; row += 1) {
    for (let col = 0; col < GAME_SIZE; col += 1) {
      if (board[row][col] === 0) {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

function addRandomTile() {
  const emptyCells = getEmptyCells();
  if (!emptyCells.length) {
    return;
  }

  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[row][col] = Math.random() < 0.9 ? 2 : 4;
}

function renderBoard() {
  els.gameBoard.innerHTML = "";

  board.flat().forEach((value) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.value = String(value);
    tile.textContent = value === 0 ? "" : String(value);
    els.gameBoard.appendChild(tile);
  });

  els.scoreValue.textContent = String(score);
}

function startGame() {
  board = createEmptyBoard();
  score = 0;
  addRandomTile();
  addRandomTile();
  renderBoard();
  els.gameMessage.textContent = "合并相同数字，目标是尽量打到 2048。";
}

function slideAndMerge(line) {
  const compacted = line.filter((value) => value !== 0);
  const merged = [];

  for (let index = 0; index < compacted.length; index += 1) {
    const current = compacted[index];
    if (compacted[index + 1] === current) {
      const nextValue = current * 2;
      merged.push(nextValue);
      score += nextValue;
      index += 1;
    } else {
      merged.push(current);
    }
  }

  while (merged.length < GAME_SIZE) {
    merged.push(0);
  }

  return merged;
}

function rotateBoardClockwise(matrix) {
  return matrix[0].map((_, colIndex) =>
    matrix.map((row) => row[colIndex]).reverse()
  );
}

function rotateBoardTimes(matrix, times) {
  let rotated = matrix.map((row) => [...row]);
  for (let count = 0; count < times; count += 1) {
    rotated = rotateBoardClockwise(rotated);
  }
  return rotated;
}

function moveLeft() {
  const before = JSON.stringify(board);
  board = board.map((row) => slideAndMerge(row));
  return JSON.stringify(board) !== before;
}

function canMove() {
  if (getEmptyCells().length > 0) {
    return true;
  }

  for (let row = 0; row < GAME_SIZE; row += 1) {
    for (let col = 0; col < GAME_SIZE; col += 1) {
      const current = board[row][col];
      const right = col + 1 < GAME_SIZE ? board[row][col + 1] : null;
      const down = row + 1 < GAME_SIZE ? board[row + 1][col] : null;
      if (current === right || current === down) {
        return true;
      }
    }
  }

  return false;
}

function has2048() {
  return board.some((row) => row.some((value) => value >= 2048));
}

function runMove(direction) {
  const rotationMap = {
    left: 0,
    up: 3,
    right: 2,
    down: 1,
  };

  const rotation = rotationMap[direction];
  if (typeof rotation !== "number") {
    return;
  }

  board = rotateBoardTimes(board, rotation);
  const changed = moveLeft();
  board = rotateBoardTimes(board, (4 - rotation) % 4);

  if (!changed) {
    return;
  }

  addRandomTile();
  renderBoard();

  if (has2048()) {
    els.gameMessage.textContent = "已经打到 2048 了，可以继续往上冲。";
    return;
  }

  if (!canMove()) {
    els.gameMessage.textContent = "没有可移动的格子了，点“重新开始”再来一局。";
    return;
  }

  els.gameMessage.textContent = "继续合并，尽量做出更大的数字。";
}

function launchApp() {
  const env = getEnvironment();
  const config = getConfig();
  const launchUrl = getLaunchUrl(config, env);
  const fallbackUrl = getFallbackUrl(config, env);

  if (!env.isIOS && !env.isAndroid) {
    setStatus("当前不是手机环境。请用 iPhone 或 Android 浏览器打开这个页面。", "error");
    return;
  }

  if (env.isWeChat || env.isWeibo || env.isQQ) {
    setStatus("当前在内置浏览器中，深链通常会被拦截。建议点击右上角后，选择在系统浏览器打开。", "error");
    return;
  }

  if (!launchUrl) {
    setStatus("当前平台没有可用的拉起地址，请先填写对应平台的深链。", "error");
    return;
  }

  setStatus(`正在尝试打开 ${config.appName}... 如果没有成功，将自动跳转到下载页。`);

  const start = Date.now();
  const timer = window.setTimeout(() => {
    const elapsed = Date.now() - start;
    if (document.hidden || document.visibilityState === "hidden") {
      setStatus(`${config.appName} 已被系统接管，页面进入后台。`, "success");
      return;
    }

    if (fallbackUrl) {
      setStatus(`未检测到 ${config.appName} 成功拉起，${elapsed}ms 后跳转到下载页。`, "error");
      window.location.href = fallbackUrl;
      return;
    }

    setStatus(`未检测到 ${config.appName} 成功拉起，也没有配置回退地址。`, "error");
  }, 1600);

  const clearTimer = () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", clearTimer);
  };

  const handleVisibilityChange = () => {
    if (document.hidden || document.visibilityState === "hidden") {
      clearTimer();
      setStatus(`${config.appName} 已被系统接管，页面进入后台。`, "success");
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", clearTimer, { once: true });

  openUrl(launchUrl);
}

async function copyConfig() {
  const config = getConfig();
  const content = JSON.stringify(config, null, 2);

  try {
    await navigator.clipboard.writeText(content);
    setStatus("当前配置已复制，可以直接发给前端接入真实深链。", "success");
  } catch (error) {
    setStatus("复制失败。当前浏览器可能不支持剪贴板接口。", "error");
  }
}

updateEnvironmentView(getEnvironment());
updateClock();
updateNetworkMeta();
startGame();
els.launchButton.addEventListener("click", launchApp);
els.sceneLaunchButton.addEventListener("click", launchApp);
els.copyButton.addEventListener("click", copyConfig);
els.clockButton.addEventListener("click", updateClock);
els.ipButton.addEventListener("click", fetchIp);
els.geoButton.addEventListener("click", fetchGeolocation);
els.speedButton.addEventListener("click", quickSpeedTest);
els.restartGameButton.addEventListener("click", startGame);

document.querySelectorAll("[data-link-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.getAttribute("data-link-target");
    openNamedLink(target);
  });
});

document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => {
    runMove(button.getAttribute("data-move"));
  });
});

const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
if (connection && typeof connection.addEventListener === "function") {
  connection.addEventListener("change", updateNetworkMeta);
}

document.addEventListener("keydown", (event) => {
  const directionMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };
  const direction = directionMap[event.key];
  if (!direction) {
    return;
  }

  event.preventDefault();
  runMove(direction);
});

els.gameBoard.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

els.gameBoard.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const threshold = 24;

  if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
    return;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    runMove(deltaX > 0 ? "right" : "left");
    return;
  }

  runMove(deltaY > 0 ? "down" : "up");
}, { passive: true });
