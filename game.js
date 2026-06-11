/**
 * 3D Tic-Tac-Toe Game Logic
 * Board: board[layer][row][col] where each index is 0-2
 * Values: 0 = empty, 1 = player X, 2 = player O
 */

let board = createEmptyBoard();
let currentPlayer = 1;
let gameState = "playing";
let winner = null;

function createEmptyBoard() {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => Array(3).fill(0))
  );
}

function getWinningLines() {
  const lines = [];
  // 27 axis-aligned
  for (let l = 0; l < 3; l++) for (let r = 0; r < 3; r++) lines.push([[l, r, 0], [l, r, 1], [l, r, 2]]);
  for (let l = 0; l < 3; l++) for (let c = 0; c < 3; c++) lines.push([[l, 0, c], [l, 1, c], [l, 2, c]]);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) lines.push([[0, r, c], [1, r, c], [2, r, c]]);
  // 18 face diagonals
  for (let l = 0; l < 3; l++) { lines.push([[l,0,0],[l,1,1],[l,2,2]]); lines.push([[l,0,2],[l,1,1],[l,2,0]]); }
  for (let r = 0; r < 3; r++) { lines.push([[0,r,0],[1,r,1],[2,r,2]]); lines.push([[0,r,2],[1,r,1],[2,r,0]]); }
  for (let c = 0; c < 3; c++) { lines.push([[0,0,c],[1,1,c],[2,2,c]]); lines.push([[0,2,c],[1,1,c],[2,0,c]]); }
  // 4 space diagonals
  lines.push([[0,0,0],[1,1,1],[2,2,2]],[[0,0,2],[1,1,1],[2,2,0]]);
  lines.push([[0,2,0],[1,1,1],[2,0,2]],[[0,2,2],[1,1,1],[2,0,0]]);
  return lines;
}

const WINNING_LINES = getWinningLines();

function makeCellMove(layer, row, col) {
  if (gameState !== "playing") return false;
  if (layer < 0 || layer > 2 || row < 0 || row > 2 || col < 0 || col > 2) return false;
  if (board[layer][row][col] !== 0) return false;
  board[layer][row][col] = currentPlayer;
  if (checkWin()) { gameState = "win"; winner = currentPlayer; }
  else if (checkDraw()) { gameState = "draw"; }
  else { currentPlayer = currentPlayer === 1 ? 2 : 1; }
  return true;
}

function checkWin() {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const va = board[a[0]][a[1]][a[2]];
    const vb = board[b[0]][b[1]][b[2]];
    const vc = board[c[0]][c[1]][c[2]];
    if (va !== 0 && va === vb && vb === vc) return true;
  }
  return false;
}

function checkDraw() {
  for (let l = 0; l < 3; l++) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
    if (board[l][r][c] === 0) return false;
  return true;
}

function resetGame() {
  board = createEmptyBoard();
  currentPlayer = 1;
  gameState = "playing";
  winner = null;
}

function getCurrentPlayer() { return currentPlayer; }
function getWinner() { return winner; }
function getBoard() { return board.map(l => l.map(r => [...r])); }
function getGameState() { return gameState; }

if (typeof module !== 'undefined') {
  module.exports = { makeCellMove, checkWin, checkDraw, resetGame, getCurrentPlayer, getWinner, getBoard, getGameState, getWinningLines };
}
