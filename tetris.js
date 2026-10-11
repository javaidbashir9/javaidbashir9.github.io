/**
 * JAVAID BASHIR — CYBER GLASS TETRIS ARCADE ENGINE
 * High-performance, responsive HTML5 Canvas Tetris:
 *  - 10x20 Standard Tetris Matrix with SRS wall-kick rotations
 *  - 7-Bag Randomizer (fair tetromino generation)
 *  - Holographic Ghost Piece projection
 *  - Hold Piece mechanism (swaps once per turn)
 *  - Multi-line clear flash & exploding glass particle physics
 *  - Polyphonic Web Audio synthesized sound FX (chords, arpeggios, whooshes)
 *  - Dynamic visual themes (Aurora Neon, Cyber Ruby, Emerald Glow, Sunset Gold)
 *  - High-DPI crisp rendering on all screens & mobile touch controls
 */

(function () {
  'use strict';

  // Game Grid Dimensions
  const COLS = 10;
  const ROWS = 20;

  // Tetromino Shapes & Color Palettes
  const TETROMINOES = {
    I: {
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      color: {
        main: '#00f0ff',
        light: '#a5f3fc',
        dark: '#0891b2',
        border: '#00f0ff',
        ghost: 'rgba(0, 240, 255, 0.45)'
      }
    },
    O: {
      shape: [
        [1, 1],
        [1, 1]
      ],
      color: {
        main: '#ffd600',
        light: '#fef08a',
        dark: '#ca8a04',
        border: '#ffd600',
        ghost: 'rgba(255, 214, 0, 0.45)'
      }
    },
    T: {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],
      color: {
        main: '#c084fc',
        light: '#e9d5ff',
        dark: '#9333ea',
        border: '#c084fc',
        ghost: 'rgba(192, 132, 252, 0.45)'
      }
    },
    S: {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ],
      color: {
        main: '#10b981',
        light: '#a7f3d0',
        dark: '#059669',
        border: '#10b981',
        ghost: 'rgba(16, 185, 129, 0.45)'
      }
    },
    Z: {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ],
      color: {
        main: '#ef4444',
        light: '#fecaca',
        dark: '#dc2626',
        border: '#ef4444',
        ghost: 'rgba(239, 68, 68, 0.45)'
      }
    },
    J: {
      shape: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],
      color: {
        main: '#3b82f6',
        light: '#bfdbfe',
        dark: '#1d4ed8',
        border: '#3b82f6',
        ghost: 'rgba(59, 130, 246, 0.45)'
      }
    },
    L: {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
      ],
      color: {
        main: '#f97316',
        light: '#fed7aa',
        dark: '#ea580c',
        border: '#f97316',
        ghost: 'rgba(249, 115, 22, 0.45)'
      }
    }
  };

  const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  // Synthesized Web Audio Controller
  let audioCtx = null;
  let isSoundEnabled = true;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, durationMs, type = 'sine', volume = 0.12) {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {}
  }

  const SoundFX = {
    move() {
      playTone(480, 25, 'triangle', 0.08);
    },
    rotate() {
      playTone(620, 35, 'sine', 0.1);
      setTimeout(() => playTone(820, 30, 'sine', 0.08), 15);
    },
    drop() {
      playTone(160, 45, 'triangle', 0.16);
    },
    hold() {
      playTone(340, 40, 'sine', 0.1);
      setTimeout(() => playTone(540, 40, 'sine', 0.1), 30);
    },
    clearLine() {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        setTimeout(() => playTone(f, 90, 'triangle', 0.15), i * 50);
      });
    },
    tetris() {
      // Celebratory 5-note arpeggio chord
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
        setTimeout(() => playTone(f, 130, 'triangle', 0.18), i * 55);
      });
    },
    levelUp() {
      [440, 554, 659, 880].forEach((f, i) => {
        setTimeout(() => playTone(f, 110, 'sine', 0.16), i * 60);
      });
    },
    gameOver() {
      [360, 310, 260, 200].forEach((f, i) => {
        setTimeout(() => playTone(f, 160, 'sawtooth', 0.15), i * 90);
      });
    },
    click() {
      playTone(850, 10, 'sine', 0.05);
    }
  };

  // Game State Variables
  let canvas, ctx;
  let holdCanvas, holdCtx;
  let nextCanvas, nextCtx;

  let grid = [];
  let currentPiece = null;
  let pieceBag = [];
  let nextPieceType = null;
  let heldPieceType = null;
  let canHold = true;

  let score = 0;
  let highScore = 0;
  let level = 1;
  let linesCleared = 0;

  let isPlaying = false;
  let isPaused = false;
  let isGameOver = false;

  let dropTimer = 0;
  let dropInterval = 800; // ms
  let lastTime = 0;
  let animationFrameId = null;

  let particles = [];
  let clearingLines = []; // Animation of lines currently flashing & dissolving
  let currentTheme = 'aurora-neon';

  /* ==========================================================================
     INITIALIZATION & PREFERENCES
     ========================================================================== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTetrisGame);
  } else {
    initTetrisGame();
  }

  function initTetrisGame() {
    canvas = document.getElementById('tetris-canvas');
    holdCanvas = document.getElementById('hold-canvas');
    nextCanvas = document.getElementById('next-canvas');

    if (!canvas || !holdCanvas || !nextCanvas) return;

    ctx = canvas.getContext('2d');
    holdCtx = holdCanvas.getContext('2d');
    nextCtx = nextCanvas.getContext('2d');

    grid = createEmptyGrid();
    loadPreferences();
    resetGame();
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);

    setupInputListeners();
    setupDashboardUI();
    setupFullscreenListeners();

    render();
  }

  function loadPreferences() {
    try {
      const savedScore = localStorage.getItem('javaid_tetris_highscore');
      if (savedScore) highScore = parseInt(savedScore, 10) || 0;

      const savedTheme = localStorage.getItem('javaid_tetris_theme');
      if (savedTheme) currentTheme = savedTheme;

      const savedSound = localStorage.getItem('javaid_tetris_sound');
      if (savedSound !== null) isSoundEnabled = savedSound === 'true';
    } catch (e) {}
  }

  function savePreferences() {
    try {
      localStorage.setItem('javaid_tetris_highscore', highScore.toString());
      localStorage.setItem('javaid_tetris_theme', currentTheme);
      localStorage.setItem('javaid_tetris_sound', isSoundEnabled.toString());
    } catch (e) {}
  }

  function resizeCanvases() {
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.round(rect.width * dpr) || 300;
    canvas.height = Math.round(rect.height * dpr) || 600;

    if (holdCanvas) {
      const hRect = holdCanvas.getBoundingClientRect();
      holdCanvas.width = Math.round(hRect.width * dpr) || 80;
      holdCanvas.height = Math.round(hRect.height * dpr) || 80;
    }

    if (nextCanvas) {
      const nRect = nextCanvas.getBoundingClientRect();
      nextCanvas.width = Math.round(nRect.width * dpr) || 80;
      nextCanvas.height = Math.round(nRect.height * dpr) || 80;
    }

    renderSidePreviews();
    if (!isPlaying) render();
  }

  /* ==========================================================================
     CORE TETRIS ENGINE & 7-BAG GENERATOR
     ========================================================================== */
  function createEmptyGrid() {
    const g = [];
    for (let r = 0; r < ROWS; r++) {
      g[r] = new Array(COLS).fill(null);
    }
    return g;
  }

  function getNextPieceFromBag() {
    if (pieceBag.length === 0) {
      pieceBag = [...PIECE_TYPES];
      // Fisher-Yates Shuffle
      for (let i = pieceBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieceBag[i], pieceBag[j]] = [pieceBag[j], pieceBag[i]];
      }
    }
    return pieceBag.pop();
  }

  function spawnPiece(type = null) {
    const pieceType = type || nextPieceType || getNextPieceFromBag();
    nextPieceType = getNextPieceFromBag();

    const t = TETROMINOES[pieceType];
    const shape = t.shape.map(row => [...row]);

    const piece = {
      type: pieceType,
      shape: shape,
      color: t.color,
      x: Math.floor((COLS - shape[0].length) / 2),
      y: 0
    };

    // Check immediately for top-out collision (Game Over)
    if (isColliding(piece, piece.x, piece.y, piece.shape)) {
      triggerGameOver();
      return null;
    }

    canHold = true;
    renderSidePreviews();
    return piece;
  }

  function resetGame() {
    grid = createEmptyGrid();
    pieceBag = [];
    particles = [];
    clearingLines = [];
    heldPieceType = null;
    canHold = true;

    score = 0;
    linesCleared = 0;
    level = 1;
    dropInterval = 800;

    nextPieceType = getNextPieceFromBag();
    currentPiece = null;

    updateDashboard();
    renderSidePreviews();
  }

  function startGame() {
    getAudioContext();
    SoundFX.click();
    resetGame();

    isPlaying = true;
    isPaused = false;
    isGameOver = false;

    hideOverlays();
    currentPiece = spawnPiece();
    lastTime = performance.now();
    dropTimer = 0;

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (!isPlaying || isGameOver) return;
    isPaused = !isPaused;
    SoundFX.click();

    const overlay = document.getElementById('tetris-pause-overlay');
    if (overlay) overlay.classList.toggle('is-visible', isPaused);
    updateDashboard();
  }

  function triggerGameOver() {
    isGameOver = true;
    isPlaying = false;
    SoundFX.gameOver();

    if (score > highScore) {
      highScore = score;
      savePreferences();
    }

    const overlay = document.getElementById('tetris-gameover-overlay');
    const finalScoreEl = document.getElementById('tetris-final-score');
    const recordEl = document.getElementById('tetris-gameover-record');

    if (finalScoreEl) finalScoreEl.textContent = score.toString();
    if (recordEl) recordEl.textContent = `Lines: ${linesCleared} • Level: ${level} • Best: ${highScore}`;
    if (overlay) overlay.classList.add('is-visible');

    updateDashboard();
  }

  function hideOverlays() {
    document.querySelectorAll('.tetris-screen-overlay').forEach(el => el.classList.remove('is-visible'));
  }

  /* ==========================================================================
     COLLISION & ROTATION LOGIC (SRS WALL KICKS)
     ========================================================================== */
  function isColliding(piece, px, py, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const gx = px + c;
          const gy = py + r;

          // Wall and floor bounds check
          if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
          // Grid block collision (ignore above top ceiling)
          if (gy >= 0 && grid[gy][gx] !== null) return true;
        }
      }
    }
    return false;
  }

  function rotateMatrix(matrix) {
    const N = matrix.length;
    const result = [];
    for (let r = 0; r < N; r++) {
      result[r] = [];
      for (let c = 0; c < N; c++) {
        result[r][c] = matrix[N - 1 - c][r];
      }
    }
    return result;
  }

  function rotateCurrentPiece() {
    if (!currentPiece || !isPlaying || isPaused || isGameOver) return;

    const rotatedShape = rotateMatrix(currentPiece.shape);

    // Wall-kick offsets test: center, left 1, right 1, left 2, right 2, up 1
    const kicks = [0, -1, 1, -2, 2, 0];
    const kickY = [0, 0, 0, 0, 0, -1];

    for (let i = 0; i < kicks.length; i++) {
      const testX = currentPiece.x + kicks[i];
      const testY = currentPiece.y + kickY[i];

      if (!isColliding(currentPiece, testX, testY, rotatedShape)) {
        currentPiece.x = testX;
        currentPiece.y = testY;
        currentPiece.shape = rotatedShape;
        SoundFX.rotate();
        return;
      }
    }
  }

  function moveLeft() {
    if (!currentPiece || !isPlaying || isPaused || isGameOver) return;
    if (!isColliding(currentPiece, currentPiece.x - 1, currentPiece.y, currentPiece.shape)) {
      currentPiece.x--;
      SoundFX.move();
    }
  }

  function moveRight() {
    if (!currentPiece || !isPlaying || isPaused || isGameOver) return;
    if (!isColliding(currentPiece, currentPiece.x + 1, currentPiece.y, currentPiece.shape)) {
      currentPiece.x++;
      SoundFX.move();
    }
  }

  function softDrop() {
    if (!currentPiece || !isPlaying || isPaused || isGameOver) return;
    if (!isColliding(currentPiece, currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
      currentPiece.y++;
      score += 1;
      updateDashboard();
    } else {
      lockPiece();
    }
  }

  function hardDrop() {
    if (!currentPiece || !isPlaying || isPaused || isGameOver) return;

    let dropDist = 0;
    while (!isColliding(currentPiece, currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
      currentPiece.y++;
      dropDist++;
    }

    score += dropDist * 2;
    SoundFX.drop();
    spawnDropParticles(currentPiece);
    lockPiece();
  }

  function holdPiece() {
    if (!currentPiece || !isPlaying || isPaused || isGameOver || !canHold) return;

    SoundFX.hold();
    const currentType = currentPiece.type;

    if (heldPieceType === null) {
      heldPieceType = currentType;
      currentPiece = spawnPiece();
    } else {
      const swapType = heldPieceType;
      heldPieceType = currentType;
      currentPiece = spawnPiece(swapType);
    }

    canHold = false;
    renderSidePreviews();
  }

  function getGhostY() {
    if (!currentPiece) return 0;
    let gy = currentPiece.y;
    while (!isColliding(currentPiece, currentPiece.x, gy + 1, currentPiece.shape)) {
      gy++;
    }
    return gy;
  }

  /* ==========================================================================
     LOCKING PIECE & LINE CLEARING MECHANICS
     ========================================================================== */
  function lockPiece() {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          const gy = currentPiece.y + r;
          const gx = currentPiece.x + c;
          if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
            grid[gy][gx] = currentPiece.color;
          }
        }
      }
    }

    checkLineClears();
  }

  function checkLineClears() {
    const fullRows = [];

    for (let r = 0; r < ROWS; r++) {
      if (grid[r].every(cell => cell !== null)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length === 0) {
      currentPiece = spawnPiece();
      return;
    }

    // Trigger Line Clear Effects
    clearingLines = fullRows;

    // Spawn sparkling glass shards
    fullRows.forEach(rowIdx => {
      for (let c = 0; c < COLS; c++) {
        const color = grid[rowIdx][c] || currentPiece.color;
        spawnLineClearParticles(c, rowIdx, color);
      }
    });

    // Scoring Multipliers
    const cleared = fullRows.length;
    let gained = 0;
    let bannerTitle = '';

    if (cleared === 1) {
      gained = 100 * level;
      bannerTitle = `+${gained} SINGLE`;
      SoundFX.clearLine();
    } else if (cleared === 2) {
      gained = 300 * level;
      bannerTitle = `+${gained} DOUBLE`;
      SoundFX.clearLine();
    } else if (cleared === 3) {
      gained = 500 * level;
      bannerTitle = `+${gained} TRIPLE`;
      SoundFX.clearLine();
    } else if (cleared === 4) {
      gained = 800 * level;
      bannerTitle = `+${gained} TETRIS! 💥`;
      SoundFX.tetris();
    }

    score += gained;
    linesCleared += cleared;

    // Level Progression (Every 10 lines)
    const newLevel = Math.floor(linesCleared / 10) + 1;
    if (newLevel > level) {
      level = newLevel;
      dropInterval = Math.max(90, 800 - (level - 1) * 65);
      SoundFX.levelUp();
    }

    if (score > highScore) {
      highScore = score;
      savePreferences();
    }

    showFloatingBanner(bannerTitle);
    updateDashboard();

    // Remove rows after short flash animation
    setTimeout(() => {
      fullRows.forEach(rowIdx => {
        grid.splice(rowIdx, 1);
        grid.unshift(new Array(COLS).fill(null));
      });
      clearingLines = [];
      currentPiece = spawnPiece();
    }, 160);
  }

  function showFloatingBanner(text) {
    const banner = document.getElementById('tetris-floating-banner');
    if (!banner) return;
    banner.textContent = text;
    banner.classList.add('is-active');
    setTimeout(() => banner.classList.remove('is-active'), 850);
  }

  /* ==========================================================================
     PARTICLE PHYSICS ENGINE
     ========================================================================== */
  function spawnLineClearParticles(col, row, color) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: col + Math.random(),
        y: row + Math.random(),
        vx: (Math.random() - 0.5) * 5,
        vy: -Math.random() * 4 - 1,
        size: Math.random() * 5 + 3,
        color: color.main,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  function spawnDropParticles(piece) {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const gx = piece.x + c;
          const gy = piece.y + r;
          for (let i = 0; i < 3; i++) {
            particles.push({
              x: gx + Math.random(),
              y: gy + 1,
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 2,
              size: Math.random() * 4 + 2,
              color: piece.color.main,
              alpha: 0.8,
              decay: 0.04
            });
          }
        }
      }
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * 0.08;
      p.y += p.vy * 0.08;
      p.vy += 0.2; // gravity
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  /* ==========================================================================
     GAME LOOP & HIGH-DPI CANVAS RENDERER
     ========================================================================== */
  function gameLoop(timestamp) {
    if (!isPlaying) return;

    if (!isPaused && !isGameOver) {
      const delta = timestamp - lastTime;
      lastTime = timestamp;
      dropTimer += delta;

      if (dropTimer >= dropInterval) {
        dropTimer = 0;
        softDrop();
      }

      updateParticles();
    } else {
      lastTime = timestamp;
    }

    render();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function render() {
    if (!ctx || !canvas || !grid || !grid.length) return;

    const w = canvas.width;
    const h = canvas.height;
    const blockSize = Math.floor(Math.min(w / COLS, h / ROWS));
    const offsetX = Math.floor((w - blockSize * COLS) / 2);
    const offsetY = Math.floor((h - blockSize * ROWS) / 2);

    ctx.clearRect(0, 0, w, h);

    // 1. Grid Background & subtle dots
    drawGridBackground(w, h, offsetX, offsetY, blockSize);

    // 2. Locked Blocks in Grid
    for (let r = 0; r < ROWS; r++) {
      const isClearing = clearingLines.includes(r);
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c];
        if (cell) {
          const x = offsetX + c * blockSize;
          const y = offsetY + r * blockSize;
          if (isClearing) {
            drawFlashBlock(x, y, blockSize);
          } else {
            drawGlassBlock(x, y, blockSize, cell);
          }
        }
      }
    }

    // 3. Ghost Piece Projection
    if (currentPiece && !isGameOver && !isPaused) {
      const ghostY = getGhostY();
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            const gx = currentPiece.x + c;
            const gy = ghostY + r;
            if (gy >= 0) {
              const x = offsetX + gx * blockSize;
              const y = offsetY + gy * blockSize;
              drawGhostBlock(x, y, blockSize, currentPiece.color);
            }
          }
        }
      }
    }

    // 4. Current Active Falling Piece
    if (currentPiece && !isGameOver) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            const gx = currentPiece.x + c;
            const gy = currentPiece.y + r;
            if (gy >= 0) {
              const x = offsetX + gx * blockSize;
              const y = offsetY + gy * blockSize;
              drawGlassBlock(x, y, blockSize, currentPiece.color);
            }
          }
        }
      }
    }

    // 5. Exploding Glass Particles
    particles.forEach(p => {
      const px = offsetX + p.x * blockSize;
      const py = offsetY + p.y * blockSize;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(px, py, p.size, p.size);
      ctx.restore();
    });
  }

  function drawGridBackground(w, h, ox, oy, bs) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 14, 26, 0.9)';
    ctx.fillRect(ox, oy, COLS * bs, ROWS * bs);

    // Subtle matrix lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(ox + c * bs, oy);
      ctx.lineTo(ox + c * bs, oy + ROWS * bs);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + r * bs);
      ctx.lineTo(ox + COLS * bs, oy + r * bs);
      ctx.stroke();
    }

    // Outer border glow
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ox, oy, COLS * bs, ROWS * bs);
    ctx.restore();
  }

  function drawGlassBlock(x, y, size, color) {
    const pad = Math.max(1, Math.round(size * 0.06));
    const bx = x + pad;
    const by = y + pad;
    const bs = size - pad * 2;
    const rad = Math.max(2, Math.round(bs * 0.18));

    ctx.save();

    // 1. Frosted Glass Gradient Fill
    const grad = ctx.createLinearGradient(bx, by, bx + bs, by + bs);
    grad.addColorStop(0, color.light || color.main);
    grad.addColorStop(0.35, color.main);
    grad.addColorStop(1, color.dark || color.main);
    ctx.fillStyle = grad;

    drawRoundedRect(ctx, bx, by, bs, bs, rad);
    ctx.fill();

    // 2. Neon Luminescent Border
    ctx.strokeStyle = color.border || color.main;
    ctx.lineWidth = Math.max(1, bs * 0.09);
    ctx.shadowColor = color.main;
    ctx.shadowBlur = 6;
    ctx.stroke();

    // 3. Specular Glass Shine Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(bx + bs * 0.32, by + bs * 0.26, bs * 0.22, bs * 0.12, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawGhostBlock(x, y, size, color) {
    const pad = Math.max(1, Math.round(size * 0.06));
    const bx = x + pad;
    const by = y + pad;
    const bs = size - pad * 2;
    const rad = Math.max(2, Math.round(bs * 0.18));

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    drawRoundedRect(ctx, bx, by, bs, bs, rad);
    ctx.fill();

    ctx.strokeStyle = color.ghost;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.restore();
  }

  function drawFlashBlock(x, y, size) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.restore();
  }

  function drawRoundedRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  /* ==========================================================================
     SIDE PREVIEWS (NEXT QUEUE & HOLD POD)
     ========================================================================== */
  function renderSidePreviews() {
    renderPieceOnCanvas(holdCtx, holdCanvas, heldPieceType);
    renderPieceOnCanvas(nextCtx, nextCanvas, nextPieceType);
  }

  function renderPieceOnCanvas(targetCtx, targetCanvas, type) {
    if (!targetCtx || !targetCanvas) return;

    const w = targetCanvas.width;
    const h = targetCanvas.height;
    targetCtx.clearRect(0, 0, w, h);

    if (!type) return;

    const piece = TETROMINOES[type];
    const shape = piece.shape;
    const rows = shape.length;
    const cols = shape[0].length;

    const bs = Math.floor(Math.min(w / (cols + 1.2), h / (rows + 1.2)));
    const ox = Math.floor((w - cols * bs) / 2);
    const oy = Math.floor((h - rows * bs) / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c]) {
          const x = ox + c * bs;
          const y = oy + r * bs;
          drawGlassBlockDirect(targetCtx, x, y, bs, piece.color);
        }
      }
    }
  }

  function drawGlassBlockDirect(c, x, y, size, color) {
    const pad = Math.max(1, Math.round(size * 0.08));
    const bx = x + pad;
    const by = y + pad;
    const bs = size - pad * 2;
    const rad = Math.max(2, Math.round(bs * 0.2));

    c.save();
    const grad = c.createLinearGradient(bx, by, bx + bs, by + bs);
    grad.addColorStop(0, color.light || color.main);
    grad.addColorStop(0.35, color.main);
    grad.addColorStop(1, color.dark || color.main);
    c.fillStyle = grad;

    drawRoundedRect(c, bx, by, bs, bs, rad);
    c.fill();

    c.strokeStyle = color.border || color.main;
    c.lineWidth = Math.max(1, bs * 0.09);
    c.stroke();
    c.restore();
  }

  /* ==========================================================================
     INPUT LISTENERS (KEYBOARD & TOUCH)
     ========================================================================== */
  function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }

      handleKeyInput(code);
    });

    // Mobile Keypad Buttons
    bindTouchButton('mkey-left', moveLeft);
    bindTouchButton('mkey-right', moveRight);
    bindTouchButton('mkey-rotate', rotateCurrentPiece);
    bindTouchButton('mkey-down', softDrop);
    bindTouchButton('mkey-drop', hardDrop);
    bindTouchButton('mkey-hold', holdPiece);

    // Canvas Swipe Gestures
    setupTouchGestures();
  }

  function bindTouchButton(id, callback) {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.classList.add('is-active');
      setTimeout(() => btn.classList.remove('is-active'), 100);

      if (!isPlaying || isGameOver) startGame();
      else callback();
    });
  }

  function handleKeyInput(code) {
    if (!isPlaying) {
      if (code === 'Space' || code === 'Enter') startGame();
      return;
    }

    if (code === 'ArrowLeft' || code === 'KeyA') moveLeft();
    else if (code === 'ArrowRight' || code === 'KeyD') moveRight();
    else if (code === 'ArrowUp' || code === 'KeyW') rotateCurrentPiece();
    else if (code === 'ArrowDown' || code === 'KeyS') softDrop();
    else if (code === 'Space') hardDrop();
    else if (code === 'KeyC' || code === 'ShiftLeft' || code === 'ShiftRight') holdPiece();
    else if (code === 'KeyP') pauseGame();
    else if (code === 'KeyR') startGame();
    else if (code === 'KeyF') toggleFullscreen();
  }

  function setupTouchGestures() {
    if (!canvas) return;

    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', (e) => {
      if (!e.touches[0]) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      if (!e.changedTouches[0]) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      if (!isPlaying || isGameOver) {
        startGame();
        return;
      }

      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) moveRight();
          else moveLeft();
        } else {
          if (dy > 0) softDrop();
          else hardDrop();
        }
      } else {
        rotateCurrentPiece(); // Tap rotates
      }
    }, { passive: true });
  }

  /* ==========================================================================
     DASHBOARD UI & SETTINGS
     ========================================================================== */
  function setupDashboardUI() {
    document.getElementById('btn-play-tetris')?.addEventListener('click', () => {
      if (!isPlaying || isGameOver) startGame();
      else pauseGame();
    });
    document.getElementById('btn-restart-tetris')?.addEventListener('click', startGame);

    // Overlays
    document.getElementById('overlay-tetris-start-btn')?.addEventListener('click', startGame);
    document.getElementById('overlay-tetris-resume-btn')?.addEventListener('click', pauseGame);
    document.getElementById('overlay-tetris-retry-btn')?.addEventListener('click', startGame);

    // Theme Switcher
    document.querySelectorAll('.pill-theme').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.pill-theme').forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        setTheme(pill.getAttribute('data-theme'));
        SoundFX.click();
      });
    });

    // Sound Toggle
    const soundToggleBtn = document.getElementById('sound-toggle-tetris-btn');
    soundToggleBtn?.addEventListener('click', () => {
      isSoundEnabled = !isSoundEnabled;
      savePreferences();
      updateDashboard();
      if (isSoundEnabled) SoundFX.click();
    });

    applyPreferencesToUI();
  }

  function setTheme(themeName) {
    currentTheme = themeName;
    savePreferences();

    const deviceWrapper = document.getElementById('tetris-device-wrapper');
    if (deviceWrapper) {
      deviceWrapper.className = `tetris-device-wrapper tetris-screen-monitor theme-${themeName}`;
    }
    if (!isPlaying) render();
  }

  function applyPreferencesToUI() {
    document.querySelectorAll('.pill-theme').forEach(pill => {
      pill.classList.toggle('is-active', pill.getAttribute('data-theme') === currentTheme);
    });

    setTheme(currentTheme);
    updateDashboard();
  }

  function updateDashboard() {
    const scoreVal = document.getElementById('stat-tetris-score');
    if (scoreVal) scoreVal.textContent = score.toString();

    const highScoreVal = document.getElementById('stat-tetris-highscore');
    if (highScoreVal) highScoreVal.textContent = highScore.toString();

    const levelVal = document.getElementById('stat-tetris-level');
    if (levelVal) levelVal.textContent = level.toString();

    const linesVal = document.getElementById('stat-tetris-lines');
    if (linesVal) linesVal.textContent = linesCleared.toString();

    const lcdScore = document.getElementById('lcd-tetris-score');
    if (lcdScore) lcdScore.textContent = score.toString();

    const lcdLevel = document.getElementById('lcd-tetris-level');
    if (lcdLevel) lcdLevel.textContent = level.toString();

    const lcdLines = document.getElementById('lcd-tetris-lines');
    if (lcdLines) lcdLines.textContent = linesCleared.toString();

    const soundBtn = document.getElementById('sound-toggle-tetris-btn');
    if (soundBtn) {
      soundBtn.setAttribute('aria-pressed', isSoundEnabled.toString());
      soundBtn.innerHTML = isSoundEnabled ? '<span>🔊</span><span>Sound ON</span>' : '<span>🔇</span><span>Sound OFF</span>';
    }

    const playBtn = document.getElementById('btn-play-tetris');
    if (playBtn) {
      playBtn.innerHTML = isPlaying && !isPaused
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg><span>Pause</span>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Play Match</span>';
    }
  }

  /* ==========================================================================
     FULLSCREEN CONTROLLER
     ========================================================================== */
  function toggleFullscreen() {
    const target = document.getElementById('tetris-fullscreen-target') || document.querySelector('.tetris-stage-grid');
    if (!target) return;

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(err => console.warn(err));
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  function setupFullscreenListeners() {
    const fsBtns = document.querySelectorAll('.btn-toggle-fullscreen');
    fsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleFullscreen();
        SoundFX.click();
      });
    });

    const updateFsUI = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      const target = document.getElementById('tetris-fullscreen-target') || document.querySelector('.tetris-stage-grid');
      if (target) target.classList.toggle('is-fullscreen', isFs);

      fsBtns.forEach(btn => {
        btn.innerHTML = isFs
          ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg><span>Exit Fullscreen</span>'
          : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg><span>Fullscreen</span>';
      });

      setTimeout(resizeCanvases, 120);
    };

    document.addEventListener('fullscreenchange', updateFsUI);
    document.addEventListener('webkitfullscreenchange', updateFsUI);
  }

})();
