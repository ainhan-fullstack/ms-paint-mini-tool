// --- Element Selectors ---
const canvas = document.getElementById('drawing-board');
const toolbar = document.getElementById('toolbar');
const ctx = canvas.getContext('2d');
const cursor = document.querySelector('i#cursor');
const buttons = document.querySelectorAll('#toolbar button');

// --- Canvas Setup ---
const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;
canvas.width = window.innerWidth - canvasOffsetX;
canvas.height = window.innerHeight - canvasOffsetY;

// --- Drawing State Variables ---
let isPainting = false;
let lineWidth = 5;
let startX;
let startY;
let canvasSnapshot;
let currentStyle = 'brush';
let color = '#ffffff';

// --- Snapshot (Undo/Redo) Variables ---
let snapshotList = [];
let currentSnapshotIndex = -1;

// --- Snapshot Functions ---
function saveSnapshot() {
  const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
  snapshotList.push(snap);
}

function undoAction() {
  currentSnapshotIndex -= 1;
  if (currentSnapshotIndex >= 0) {
    ctx.putImageData(snapshotList[currentSnapshotIndex], 0, 0);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function redoAction() {
  if (currentSnapshotIndex + 1 < snapshotList.length) {
    currentSnapshotIndex += 1;
    ctx.putImageData(snapshotList[currentSnapshotIndex], 0, 0);
  }
}

// --- Shape Drawing Helper Functions ---
function drawRectangle(e) {
  const width = e.clientX - canvasOffsetX - startX;
  const height = e.clientY - canvasOffsetY - startY;
  ctx.putImageData(canvasSnapshot, 0, 0);
  ctx.beginPath();
  ctx.rect(startX, startY, width, height);
  ctx.stroke();
}

function drawSquare(e) {
  const width = e.clientX - canvasOffsetX - startX;
  const height = e.clientY - canvasOffsetY - startY;
  const size = Math.max(Math.abs(width), Math.abs(height));
  ctx.putImageData(canvasSnapshot, 0, 0);
  ctx.beginPath();
  ctx.rect(startX, startY, size * Math.sign(width), size * Math.sign(height));
  ctx.stroke();
}

function drawCircle(e) {
  const width = e.clientX - canvasOffsetX - startX;
  const height = e.clientY - canvasOffsetY - startY;
  const radius = Math.sqrt(width * width + height * height);
  ctx.putImageData(canvasSnapshot, 0, 0);
  ctx.beginPath();
  ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
  ctx.stroke();
}

function drawBrush(e) {
  ctx.lineCap = 'round';
  ctx.lineTo(e.clientX - canvasOffsetX, e.clientY);
  ctx.stroke();
}

function drawEraser(e) {
  ctx.lineWidth = 50;
  ctx.lineCap = 'square';
  ctx.strokeStyle = 'white';
  ctx.lineTo(e.clientX - canvasOffsetX, e.clientY);
  ctx.stroke();
  ctx.strokeStyle = color;
}

// --- Event Handlers ---

toolbar.addEventListener('click', (e) => {
  cursor.classList.remove('show');
  document.querySelector('div.drawing-board').classList.remove('cursor-cross');

  const targetId = e.target.id;

  switch (targetId) {
    case 'clear':
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      snapshotList = [];
      currentSnapshotIndex = 0;
      break;
    case 'brush':
      currentStyle = 'brush';
      break;
    case 'rectangle':
      document.querySelector('div.drawing-board').classList.add('cursor-cross');
      currentStyle = 'rectangle';
      break;
    case 'square':
      document.querySelector('div.drawing-board').classList.add('cursor-cross');
      currentStyle = 'square';
      break;
    case 'circle':
      document.querySelector('div.drawing-board').classList.add('cursor-cross');
      currentStyle = 'circle';
      break;
    case 'undo':
      undoAction();
      break;
    case 'redo':
      redoAction();
      break;
    case 'eraser':
      currentStyle = 'eraser';
      cursor.classList.add('show');
      break;
    default:
      break;
  }
});

// Handle toolbar input changes (color and line width)
toolbar.addEventListener('change', (e) => {
  if (e.target.id === 'stroke') {
    color = e.target.value;
    ctx.strokeStyle = color;
  }
  if (e.target.id === 'lineWidth') {
    lineWidth = e.target.value;
  }
});

// Update cursor position on canvas and perform drawing actions
function draw(e) {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';

  if (!isPainting) return;

  snapshotList = snapshotList.slice(0, currentSnapshotIndex + 1);
  ctx.lineWidth = lineWidth;

  if (currentStyle === 'eraser') {
    drawEraser(e);
  } else if (currentStyle === 'brush') {
    drawBrush(e);
  } else if (currentStyle === 'rectangle') {
    ctx.lineCap = 'square';
    drawRectangle(e);
  } else if (currentStyle === 'square') {
    ctx.lineCap = 'square';
    drawSquare(e);
  } else if (currentStyle === 'circle') {
    ctx.lineCap = 'round';
    drawCircle(e);
  }
}

// Handle canvas mousedown to start painting
canvas.addEventListener('mousedown', (e) => {
  isPainting = true;
  startX = e.clientX - canvasOffsetX;
  startY = e.clientY - canvasOffsetY;
  canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
});

// Handle canvas mouseup to finish painting and save snapshot
canvas.addEventListener('mouseup', (e) => {
  isPainting = false;
  ctx.stroke();
  ctx.beginPath();
  saveSnapshot();
  currentSnapshotIndex++;
});

// Keyboard shortcuts for undo and redo (Cmd/Ctrl+Z / Cmd/Ctrl+Y)
window.addEventListener('keydown', (e) => {
  const isCmd = e.metaKey || e.ctrlKey;
  if (!isCmd) return;

  if (e.key === 'z') {
    e.preventDefault();
    e.shiftKey ? redoAction() : undoAction();
  }
  if (e.key === 'y') {
    e.preventDefault();
    redoAction();
  }
});

// Toggle selected state for toolbar buttons
buttons.forEach(button => {
  button.addEventListener('click', () => {
    buttons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
  });
});

canvas.addEventListener('mousemove', draw);