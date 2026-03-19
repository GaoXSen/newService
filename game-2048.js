const els = {
  restartGameButton: document.querySelector("#restartGameButton"),
  gameBoard: document.querySelector("#gameBoard"),
  scoreValue: document.querySelector("#scoreValue"),
  gameMessage: document.querySelector("#gameMessage"),
};

const GAME_SIZE = 4;
let board = [];
let score = 0;
let touchStartX = 0;
let touchStartY = 0;

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

startGame();
els.restartGameButton.addEventListener("click", startGame);

document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => {
    runMove(button.getAttribute("data-move"));
  });
});

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

els.gameBoard.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  },
  { passive: true }
);

els.gameBoard.addEventListener(
  "touchend",
  (event) => {
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
  },
  { passive: true }
);
