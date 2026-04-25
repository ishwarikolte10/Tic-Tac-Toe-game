// ================= DOM =================
const boardEl = document.getElementById("board");
const resetBtn = document.getElementById("resetBtn");

const pvpBtn = document.getElementById("pvpBtn");
const aiBtn = document.getElementById("aiBtn");

const turnXEl = document.getElementById("turnX");
const turnOEl = document.getElementById("turnO");

const xScoreEl = document.getElementById("xScore");
const oScoreEl = document.getElementById("oScore");

const popup = document.getElementById("popup");
const resultText = document.getElementById("resultText");
const winLine = document.getElementById("winLine");

// ================= STATE =================
const state = {
  board: Array(9).fill(""),
  currentPlayer: "X",
  gameActive: true,
  mode: "pvp",
  score: { X: 0, O: 0 },
  winPattern: null // ✅ important
};

// ================= WIN PATTERNS =================
const WIN_PATTERNS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// ================= INIT =================
init();

function init() {
  bindEvents();
  render();
}

// ================= EVENTS =================
function bindEvents() {
  resetBtn.addEventListener("click", resetGame);

  pvpBtn.addEventListener("click", () => setMode("pvp"));
  aiBtn.addEventListener("click", () => setMode("ai"));
}

// ================= MODE =================
function setMode(mode) {
  if (state.mode === mode) return;

  state.mode = mode;

  pvpBtn.classList.toggle("active", mode === "pvp");
  aiBtn.classList.toggle("active", mode === "ai");

  resetGame();
}

// ================= RENDER =================
function render() {
  boardEl.innerHTML = "";

  state.board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";

    if (cell) {
      div.innerText = cell;
      div.classList.add(cell.toLowerCase());
    }

    if (!cell && state.gameActive) {
      div.addEventListener("click", () => handleMove(i));
    }

    boardEl.appendChild(div);
  });

  // ✅ apply win visuals AFTER DOM ready
  if (state.winPattern) {
    highlightWinner(state.winPattern);
    drawWinLine(state.winPattern);
  }

  updateTurnUI();
  updateScoreUI();
}

// ================= MOVE =================
function handleMove(index) {
  if (!state.gameActive || state.board[index] !== "") return;

  state.board[index] = state.currentPlayer;

  const ended = checkGameEnd();

  render();

  if (ended) return;

  state.currentPlayer = state.currentPlayer === "X" ? "O" : "X";

  if (state.mode === "ai" && state.currentPlayer === "O") {
    setTimeout(aiMove, 400);
  }
}

// ================= GAME END =================
function checkGameEnd() {
  let winner = null;

  for (let pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;

    if (
      state.board[a] &&
      state.board[a] === state.board[b] &&
      state.board[a] === state.board[c]
    ) {
      winner = state.board[a];
      state.winPattern = pattern;
      break;
    }
  }

  if (winner) {
    state.gameActive = false;

    state.score[winner]++;
    updateScoreUI();

    showPopup(`Player ${winner} Wins 🎉`);
    return true;
  }

  if (state.board.every(cell => cell !== "")) {
    state.gameActive = false;
    showPopup("It's a Draw 🤝");
    return true;
  }

  return false;
}

// ================= AI =================
function aiMove() {
  let bestScore = -Infinity;
  let move = null;

  for (let i = 0; i < 9; i++) {
    if (state.board[i] === "") {
      state.board[i] = "O";

      let score = minimax(state.board, false);

      state.board[i] = "";

      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }

  if (move !== null) {
    state.board[move] = "O";

    const ended = checkGameEnd();
    render();

    if (!ended) {
      state.currentPlayer = "X";
    }
  }
}

// ================= MINIMAX =================
function minimax(board, isMax) {
  const result = evaluate(board);
  if (result !== null) return result;

  if (isMax) {
    let best = -Infinity;

    for (let i = 0; i < 9; i++) {
      if (board[i] === "") {
        board[i] = "O";
        best = Math.max(best, minimax(board, false));
        board[i] = "";
      }
    }

    return best;
  } else {
    let best = Infinity;

    for (let i = 0; i < 9; i++) {
      if (board[i] === "") {
        board[i] = "X";
        best = Math.min(best, minimax(board, true));
        board[i] = "";
      }
    }

    return best;
  }
}

function evaluate(board) {
  for (let [a, b, c] of WIN_PATTERNS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === "O" ? 1 : -1;
    }
  }

  if (!board.includes("")) return 0;

  return null;
}

// ================= UI =================
function updateTurnUI() {
  turnXEl.classList.toggle("active", state.currentPlayer === "X");
  turnOEl.classList.toggle("active", state.currentPlayer === "O");
}

function updateScoreUI() {
  xScoreEl.innerText = state.score.X;
  oScoreEl.innerText = state.score.O;
}

function showPopup(text) {
  resultText.innerText = text;
  popup.classList.remove("hidden");
}

// ================= WIN VISUAL =================
function highlightWinner(pattern) {
  const cells = document.querySelectorAll(".cell");
  pattern.forEach(i => cells[i].classList.add("winner"));
}

function drawWinLine(pattern) {
  const cells = document.querySelectorAll(".cell");

  const first = cells[pattern[0]];
  const last = cells[pattern[2]];

  const rect1 = first.getBoundingClientRect();
  const rect2 = last.getBoundingClientRect();
  const boardRect = boardEl.getBoundingClientRect();

  const x1 = rect1.left + rect1.width / 2 - boardRect.left;
  const y1 = rect1.top + rect1.height / 2 - boardRect.top;

  const x2 = rect2.left + rect2.width / 2 - boardRect.left;
  const y2 = rect2.top + rect2.height / 2 - boardRect.top;

  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

  winLine.style.width = `${length}px`;
  winLine.style.left = `${x1}px`;
  winLine.style.top = `${y1}px`;
  winLine.style.transform = `rotate(${angle}deg) scaleX(1)`;
}

// ================= RESET =================
function resetGame() {
  state.board = Array(9).fill("");
  state.currentPlayer = "X";
  state.gameActive = true;
  state.winPattern = null;

  popup.classList.add("hidden");
  winLine.style.transform = "scaleX(0)";

  render();
}