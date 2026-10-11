/**
 * JAVAID BASHIR — 100% WORKING NOKIA 3310 SNAKE GAME ENGINE
 * Features:
 *  - Authentic Nokia 3310 dot-matrix LCD simulation with scanlines
 *  - Dual visual themes: Classic Nokia LCD Green, VisionOS Cyber Neon, Amber 80s, GameBoy
 *  - Pure Web Audio API synthesized Nokia 8-bit sound effects (zero external files)
 *  - Keyboard (Arrows, WASD, Numpad 2,4,6,8), On-Screen Nokia Keypad, Touch Swipe
 *  - Timed bonus creature (Nokia Snake II bug) with countdown timer
 *  - Wrap-around (Borderless) and Classic Wall Collision modes
 *  - Speed Levels 1 to 9 with persistent High Scores in localStorage
 */

(function () {
  'use strict';

  // Game Constants & Configuration
  const COLS = 28;
  const ROWS = 20;

  // Speeds in milliseconds per tick (Level 1 to Level 9)
  const SPEED_PRESETS = {
    1: 175,
    2: 150,
    3: 130,
    4: 110,
    5: 90,   // Classic default
    6: 75,
    7: 62,
    8: 50,
    9: 40    // Turbo
  };

  // State
  let canvas, ctx;
  let cellWidth = 0;
  let cellHeight = 0;

  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };

  let food = null;
  let bonusBug = null;
  let bonusTimer = 0;
  let bonusMaxTime = 10; // seconds

  let score = 0;
  let highScore = 0;
  let foodEatenCount = 0;

  let isPlaying = false;
  let isPaused = false;
  let isGameOver = false;

  let currentLevel = 5;
  let wallMode = 'wrap'; // 'wrap' or 'walls'
  let currentTheme = 'retro-nokia'; // 'retro-nokia', 'cyber-neon', 'amber', 'gameboy'
  let isSoundEnabled = true;

  let lastTickTime = 0;
  let animationFrameId = null;

  /* ==========================================================================
     1. WEB AUDIO API SYNTHESIZER (NO EXTERNAL AUDIO FILES NEEDED)
     ========================================================================== */
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, durationMs, type = 'square', gainValue = 0.1) {
    if (!isSoundEnabled) return;
    try {
      const actx = getAudioContext();
      if (!actx) return;

      const osc = actx.createOscillator();
      const gain = actx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, actx.currentTime);

      gain.gain.setValueAtTime(gainValue, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(actx.destination);

      osc.start();
      osc.stop(actx.currentTime + durationMs / 1000);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  const SoundFX = {
    moveTick() {
      // Very soft Nokia step blip
      playTone(480, 15, 'square', 0.02);
    },
    eatFood() {
      // Nokia authentic 2-tone arpeggio
      playTone(1046, 35, 'square', 0.08);
      setTimeout(() => playTone(1568, 45, 'square', 0.08), 35);
    },
    eatBonus() {
      // Nokia bonus insect fanfare
      playTone(1318, 50, 'square', 0.1);
      setTimeout(() => playTone(1568, 50, 'square', 0.1), 50);
      setTimeout(() => playTone(2093, 80, 'square', 0.12), 100);
    },
    bonusSpawn() {
      // Bonus bug appear alert
      playTone(880, 40, 'square', 0.07);
      setTimeout(() => playTone(1174, 50, 'square', 0.07), 45);
    },
    gameOver() {
      // Classic Nokia 4-note descending Game Over jingle
      const notes = [493.88, 415.30, 369.99, 311.13]; // B4 -> G#4 -> F#4 -> D#4
      notes.forEach((freq, index) => {
        setTimeout(() => playTone(freq, 110, 'square', 0.12), index * 110);
      });
    },
    highScore() {
      // Cheerful Nokia celebration
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, index) => {
        setTimeout(() => playTone(freq, 80, 'square', 0.1), index * 80);
      });
    },
    buttonClick() {
      playTone(900, 10, 'square', 0.03);
    }
  };

  /* ==========================================================================
     2. DOM ELEMENTS & INITIALIZATION
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', initSnakeGame);

  function initSnakeGame() {
    canvas = document.getElementById('snake-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    loadPreferences();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    setupInputListeners();
    setupDashboardUI();
    setupFullscreenListeners();

    // Reset game state to start screen
    resetGame(false);
    render();
  }

  function loadPreferences() {
    try {
      const savedHighScore = localStorage.getItem('javaid_nokia_snake_highscore');
      if (savedHighScore) highScore = parseInt(savedHighScore, 10) || 0;

      const savedLevel = localStorage.getItem('javaid_nokia_snake_level');
      if (savedLevel) currentLevel = parseInt(savedLevel, 10) || 5;

      const savedWallMode = localStorage.getItem('javaid_nokia_snake_wallmode');
      if (savedWallMode) wallMode = savedWallMode;

      const savedTheme = localStorage.getItem('javaid_nokia_snake_theme');
      if (savedTheme) currentTheme = savedTheme;

      const savedSound = localStorage.getItem('javaid_nokia_snake_sound');
      if (savedSound !== null) isSoundEnabled = savedSound === 'true';
    } catch (e) {
      console.warn('LocalStorage unavailable');
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem('javaid_nokia_snake_highscore', highScore.toString());
      localStorage.setItem('javaid_nokia_snake_level', currentLevel.toString());
      localStorage.setItem('javaid_nokia_snake_wallmode', wallMode);
      localStorage.setItem('javaid_nokia_snake_theme', currentTheme);
      localStorage.setItem('javaid_nokia_snake_sound', isSoundEnabled.toString());
    } catch (e) {}
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    cellWidth = canvas.width / COLS;
    cellHeight = canvas.height / ROWS;

    if (!isPlaying) render();
  }

  /* ==========================================================================
     3. GAME LOOP & CORE LOGIC
     ========================================================================== */
  function startGame() {
    getAudioContext();
    SoundFX.buttonClick();

    resetGame(true);
    isPlaying = true;
    isPaused = false;
    isGameOver = false;

    hideOverlays();
    updateDashboard();

    lastTickTime = performance.now();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function resetGame(initLiveSnake = false) {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };

    score = 0;
    foodEatenCount = 0;
    bonusBug = null;
    bonusTimer = 0;

    if (initLiveSnake) {
      spawnFood();
    }
    updateDashboard();
  }

  function pauseGame() {
    if (!isPlaying || isGameOver) return;
    isPaused = !isPaused;
    SoundFX.buttonClick();

    const overlay = document.getElementById('pause-overlay');
    if (overlay) {
      overlay.classList.toggle('is-visible', isPaused);
    }
    updateDashboard();
  }

  function triggerGameOver() {
    isPlaying = false;
    isPaused = false;
    isGameOver = true;

    SoundFX.gameOver();

    if (score > highScore) {
      highScore = score;
      savePreferences();
      setTimeout(() => SoundFX.highScore(), 600);
    }

    const overlay = document.getElementById('gameover-overlay');
    const finalScoreEl = document.getElementById('gameover-final-score');
    const bestScoreEl = document.getElementById('gameover-best-score');

    if (finalScoreEl) finalScoreEl.textContent = score;
    if (bestScoreEl) bestScoreEl.textContent = highScore;
    if (overlay) overlay.classList.add('is-visible');

    updateDashboard();
  }

  function hideOverlays() {
    const overlays = document.querySelectorAll('.nokia-screen-overlay');
    overlays.forEach(el => el.classList.remove('is-visible'));
  }

  function gameLoop(currentTime) {
    if (!isPlaying) return;

    if (!isPaused && !isGameOver) {
      const tickInterval = SPEED_PRESETS[currentLevel] || 90;
      const delta = currentTime - lastTickTime;

      if (delta >= tickInterval) {
        lastTickTime = currentTime - (delta % tickInterval);
        step();
      }

      // Handle bonus creature countdown
      if (bonusBug) {
        bonusTimer -= delta / 1000;
        if (bonusTimer <= 0) {
          bonusBug = null;
        }
      }
    }

    render();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function step() {
    // Commit buffered direction
    dir = { ...nextDir };

    const head = snake[0];
    let newX = head.x + dir.x;
    let newY = head.y + dir.y;

    // Boundary Handling
    if (wallMode === 'wrap') {
      if (newX < 0) newX = COLS - 1;
      else if (newX >= COLS) newX = 0;

      if (newY < 0) newY = ROWS - 1;
      else if (newY >= ROWS) newY = 0;
    } else {
      // Wall collision mode
      if (newX < 0 || newX >= COLS || newY < 0 || newY >= ROWS) {
        triggerGameOver();
        return;
      }
    }

    // Self-Collision Check
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === newX && snake[i].y === newY) {
        triggerGameOver();
        return;
      }
    }

    const newHead = { x: newX, y: newY };
    snake.unshift(newHead);

    // Food Eaten Check
    if (food && newX === food.x && newY === food.y) {
      handleFoodEaten();
    } else if (bonusBug && newX === bonusBug.x && newY === bonusBug.y) {
      handleBonusEaten();
    } else {
      // Pop tail segment if no food eaten
      snake.pop();
    }

    SoundFX.moveTick();
  }

  function handleFoodEaten() {
    SoundFX.eatFood();
    foodEatenCount++;
    const points = 10 * currentLevel;
    score += points;

    if (score > highScore) {
      highScore = score;
      savePreferences();
    }

    // Spawn Bonus Creature every 5 regular foods
    if (foodEatenCount % 5 === 0 && !bonusBug) {
      spawnBonusBug();
    }

    spawnFood();
    updateDashboard();
  }

  function handleBonusEaten() {
    SoundFX.eatBonus();
    // Points based on remaining timer (50 to 150 pts)
    const bonusPoints = Math.round(50 + (bonusTimer / bonusMaxTime) * 100);
    score += bonusPoints;

    if (score > highScore) {
      highScore = score;
      savePreferences();
    }

    bonusBug = null;
    updateDashboard();
  }

  function spawnFood() {
    let emptyCells = [];
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        let isOccupied = snake.some(s => s.x === x && s.y === y);
        if (bonusBug && bonusBug.x === x && bonusBug.y === y) isOccupied = true;
        if (!isOccupied) emptyCells.push({ x, y });
      }
    }
    if (emptyCells.length === 0) return;
    food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  function spawnBonusBug() {
    let emptyCells = [];
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        let isOccupied = snake.some(s => s.x === x && s.y === y);
        if (food && food.x === x && food.y === y) isOccupied = true;
        if (!isOccupied) emptyCells.push({ x, y });
      }
    }
    if (emptyCells.length === 0) return;
    bonusBug = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    bonusTimer = bonusMaxTime;
    SoundFX.bonusSpawn();
  }

  /* ==========================================================================
     4. RENDERER (RETRO DOT-MATRIX vs CYBER NEON)
     ========================================================================== */
  function render() {
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    // Palette per Theme
    const palettes = {
      'retro-nokia': {
        bg: '#98bc72',
        snake: '#15240c',
        snakeEye: '#98bc72',
        food: '#15240c',
        bonus: '#0f1a08',
        wall: '#15240c',
        gridLine: 'rgba(21, 36, 12, 0.08)'
      },
      'cyber-neon': {
        bg: '#070913',
        snake: '#0055ff',
        snakeGlow: '#00f0ff',
        snakeEye: '#ffffff',
        food: '#ff0055',
        bonus: '#facc15',
        wall: '#00f0ff',
        gridLine: 'rgba(0, 85, 255, 0.12)'
      },
      'amber': {
        bg: '#f7a01d',
        snake: '#2b1702',
        snakeEye: '#f7a01d',
        food: '#2b1702',
        bonus: '#1c0e01',
        wall: '#2b1702',
        gridLine: 'rgba(43, 23, 2, 0.08)'
      },
      'gameboy': {
        bg: '#8b956d',
        snake: '#0f380f',
        snakeEye: '#8b956d',
        food: '#0f380f',
        bonus: '#071b07',
        wall: '#0f380f',
        gridLine: 'rgba(15, 56, 15, 0.08)'
      }
    };

    const palette = palettes[currentTheme] || palettes['retro-nokia'];

    // Clear Canvas
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, w, h);

    // Draw Subtle Matrix Grid Dots / Lines
    ctx.strokeStyle = palette.gridLine;
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellWidth, 0);
      ctx.lineTo(c * cellWidth, h);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellHeight);
      ctx.lineTo(w, r * cellHeight);
      ctx.stroke();
    }

    // Draw Border Walls if in Wall Collision Mode
    if (wallMode === 'walls' || wallMode === 'hard') {
      ctx.strokeStyle = palette.wall;
      ctx.lineWidth = Math.max(2, Math.round(cellWidth * 0.25));
      ctx.strokeRect(1, 1, w - 2, h - 2);
    }

    // Draw Snake Segments
    const isCyber = currentTheme === 'cyber-neon';
    if (isCyber) {
      ctx.shadowColor = palette.snakeGlow;
      ctx.shadowBlur = 8;
    } else {
      ctx.shadowBlur = 0;
    }

    snake.forEach((segment, index) => {
      const px = segment.x * cellWidth;
      const py = segment.y * cellHeight;
      const pad = 1.2;

      ctx.fillStyle = palette.snake;
      if (index === 0) {
        // Snake Head
        ctx.fillRect(px + pad, py + pad, cellWidth - pad * 2, cellHeight - pad * 2);

        // Snake Eyes
        ctx.fillStyle = palette.snakeEye;
        const eyeSize = Math.max(2, Math.round(cellWidth * 0.22));
        if (dir.x === 1) { // Right
          ctx.fillRect(px + cellWidth - eyeSize - 2, py + 3, eyeSize, eyeSize);
          ctx.fillRect(px + cellWidth - eyeSize - 2, py + cellHeight - eyeSize - 3, eyeSize, eyeSize);
        } else if (dir.x === -1) { // Left
          ctx.fillRect(px + 2, py + 3, eyeSize, eyeSize);
          ctx.fillRect(px + 2, py + cellHeight - eyeSize - 3, eyeSize, eyeSize);
        } else if (dir.y === -1) { // Up
          ctx.fillRect(px + 3, py + 2, eyeSize, eyeSize);
          ctx.fillRect(px + cellWidth - eyeSize - 3, py + 2, eyeSize, eyeSize);
        } else { // Down
          ctx.fillRect(px + 3, py + cellHeight - eyeSize - 2, eyeSize, eyeSize);
          ctx.fillRect(px + cellWidth - eyeSize - 3, py + cellHeight - eyeSize - 2, eyeSize, eyeSize);
        }
      } else {
        // Snake Body Segment
        ctx.fillRect(px + pad, py + pad, cellWidth - pad * 2, cellHeight - pad * 2);
      }
    });

    // Reset shadow for foods
    ctx.shadowBlur = 0;

    // Draw Regular Food (Nokia Pixel Apple/Bug)
    if (food) {
      const fx = food.x * cellWidth;
      const fy = food.y * cellHeight;

      if (isCyber) {
        ctx.shadowColor = palette.food;
        ctx.shadowBlur = 10;
        ctx.fillStyle = palette.food;
        ctx.beginPath();
        ctx.arc(fx + cellWidth / 2, fy + cellHeight / 2, cellWidth * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Authentic Nokia 4-dot diamond food
        ctx.fillStyle = palette.food;
        const inset = 2;
        ctx.fillRect(fx + inset + 1, fy + inset + 1, cellWidth - (inset + 1) * 2, cellHeight - (inset + 1) * 2);
      }
    }

    // Draw Timed Bonus Bug (Nokia Snake II Feature)
    if (bonusBug) {
      const bx = bonusBug.x * cellWidth;
      const by = bonusBug.y * cellHeight;

      // Blink effect when timer is under 3 seconds
      const isBlinking = bonusTimer < 3 && Math.floor(bonusTimer * 8) % 2 === 0;

      if (!isBlinking) {
        ctx.fillStyle = palette.bonus;
        if (isCyber) {
          ctx.shadowColor = palette.bonus;
          ctx.shadowBlur = 14;
        }

        // Draw iconic 5-dot cross insect shape
        const midX = bx + cellWidth / 2;
        const midY = by + cellHeight / 2;
        const r = cellWidth * 0.38;

        ctx.fillRect(midX - r, midY - r / 2, r * 2, r);
        ctx.fillRect(midX - r / 2, midY - r, r, r * 2);

        ctx.shadowBlur = 0;
      }

      // Draw Bonus Countdown Progress Bar at Screen Bottom
      const barHeight = 2.5;
      const progress = Math.max(0, bonusTimer / bonusMaxTime);
      ctx.fillStyle = palette.bonus;
      ctx.fillRect(0, h - barHeight, w * progress, barHeight);
    }
  }

  /* ==========================================================================
     5. CONTROLS & INPUT HANDLERS
     ========================================================================== */
  function setupInputListeners() {
    // Keyboard Listener
    window.addEventListener('keydown', (e) => {
      // Prevent default scrolling for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      handleKeyInput(e.code, e.key);
    });

    // Touch Swipe Gestures on Screen
    let touchStartX = 0;
    let touchStartY = 0;

    const screenBezel = document.querySelector('.nokia-screen-bezel');
    if (screenBezel) {
      screenBezel.addEventListener('touchstart', (e) => {
        if (!e.touches[0]) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      screenBezel.addEventListener('touchend', (e) => {
        if (!e.changedTouches[0]) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;

        if (Math.abs(dx) > 24 || Math.abs(dy) > 24) {
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal Swipe
            if (dx > 0) requestDirection(1, 0, 'btn-6');
            else requestDirection(-1, 0, 'btn-4');
          } else {
            // Vertical Swipe
            if (dy > 0) requestDirection(0, 1, 'btn-8');
            else requestDirection(0, -1, 'btn-2');
          }
        }
      }, { passive: true });
    }

    // Interactive Nokia On-Screen Keypad Buttons
    const nokiaButtons = document.querySelectorAll('.nokia-btn');
    nokiaButtons.forEach((btn) => {
      const action = btn.getAttribute('data-action');
      const dirX = parseInt(btn.getAttribute('data-dx'), 10);
      const dirY = parseInt(btn.getAttribute('data-dy'), 10);

      const trigger = (e) => {
        e.preventDefault();
        btn.classList.add('is-pressed');
        setTimeout(() => btn.classList.remove('is-pressed'), 120);

        if (!isNaN(dirX) && !isNaN(dirY)) {
          requestDirection(dirX, dirY, btn.id);
        } else if (action === 'start') {
          if (!isPlaying || isGameOver) startGame();
          else pauseGame();
        } else if (action === 'pause') {
          pauseGame();
        } else if (action === 'clear') {
          if (isGameOver || isPaused) startGame();
          else pauseGame();
        }
      };

      btn.addEventListener('mousedown', trigger);
      btn.addEventListener('touchstart', trigger, { passive: false });
    });
  }

  function handleKeyInput(code, key) {
    // UP
    if (code === 'ArrowUp' || code === 'KeyW' || key === '2' || code === 'Numpad8') {
      requestDirection(0, -1, 'btn-2');
    }
    // DOWN
    else if (code === 'ArrowDown' || code === 'KeyS' || key === '8' || code === 'Numpad2') {
      requestDirection(0, 1, 'btn-8');
    }
    // LEFT
    else if (code === 'ArrowLeft' || code === 'KeyA' || key === '4' || code === 'Numpad4') {
      requestDirection(-1, 0, 'btn-4');
    }
    // RIGHT
    else if (code === 'ArrowRight' || code === 'KeyD' || key === '6' || code === 'Numpad6') {
      requestDirection(1, 0, 'btn-6');
    }
    // PAUSE / START (Space, 5, P)
    else if (code === 'Space' || key === '5' || code === 'KeyP' || code === 'Numpad5') {
      animateButton('btn-5');
      if (!isPlaying || isGameOver) startGame();
      else pauseGame();
    }
    // RESTART (Enter, R, C)
    else if (code === 'Enter' || code === 'KeyR' || code === 'KeyC') {
      animateButton('btn-c');
      startGame();
    }
    // FULLSCREEN TOGGLE (F)
    else if (code === 'KeyF') {
      toggleFullscreen();
    }
  }

  function requestDirection(dx, dy, btnIdToAnimate) {
    if (!isPlaying) {
      startGame();
      return;
    }
    if (isPaused) {
      pauseGame();
    }

    // Disallow 180-degree reverse turn
    if (dx !== 0 && dir.x === -dx) return;
    if (dy !== 0 && dir.y === -dy) return;

    nextDir = { x: dx, y: dy };
    if (btnIdToAnimate) animateButton(btnIdToAnimate);
  }

  function animateButton(id) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.classList.add('is-pressed');
      setTimeout(() => btn.classList.remove('is-pressed'), 110);
    }
  }

  /* ==========================================================================
     6. DASHBOARD & SETTINGS UI
     ========================================================================== */
  function setupDashboardUI() {
    // Play / Restart Buttons
    const playBtn = document.getElementById('btn-play-game');
    const pauseBtn = document.getElementById('btn-pause-game');
    const restartBtn = document.getElementById('btn-restart-game');

    playBtn?.addEventListener('click', startGame);
    pauseBtn?.addEventListener('click', pauseGame);
    restartBtn?.addEventListener('click', startGame);

    // Overlay Start Buttons
    document.getElementById('overlay-start-btn')?.addEventListener('click', startGame);
    document.getElementById('overlay-resume-btn')?.addEventListener('click', pauseGame);
    document.getElementById('overlay-retry-btn')?.addEventListener('click', startGame);

    // Speed Preset Buttons
    const speedPills = document.querySelectorAll('.pill-speed');
    speedPills.forEach(pill => {
      pill.addEventListener('click', () => {
        speedPills.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        currentLevel = parseInt(pill.getAttribute('data-level'), 10) || 5;
        savePreferences();
        updateDashboard();
        SoundFX.buttonClick();
      });
    });

    // Wall Mode Pills
    const wallPills = document.querySelectorAll('.pill-wall');
    wallPills.forEach(pill => {
      pill.addEventListener('click', () => {
        wallPills.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        wallMode = pill.getAttribute('data-wall');
        savePreferences();
        updateDashboard();
        SoundFX.buttonClick();
        if (!isPlaying) render();
      });
    });

    // Theme Switcher Pills
    const themePills = document.querySelectorAll('.pill-theme');
    themePills.forEach(pill => {
      pill.addEventListener('click', () => {
        themePills.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        setTheme(pill.getAttribute('data-theme'));
        SoundFX.buttonClick();
      });
    });

    // Sound Toggle Button
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    soundToggleBtn?.addEventListener('click', () => {
      isSoundEnabled = !isSoundEnabled;
      savePreferences();
      updateDashboard();
      if (isSoundEnabled) SoundFX.buttonClick();
    });

    // Apply Loaded Preferences to UI
    applyPreferencesToUI();
  }

  function setTheme(themeName) {
    currentTheme = themeName;
    savePreferences();

    const deviceWrapper = document.getElementById('nokia-device-wrapper');
    if (deviceWrapper) {
      deviceWrapper.className = `nokia-device-wrapper snake-screen-monitor theme-${themeName}`;
    }
    if (!isPlaying) render();
  }

  function toggleFullscreen() {
    const target = document.getElementById('snake-fullscreen-target') || document.querySelector('.snake-stage-grid');
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
        SoundFX.buttonClick();
      });
    });

    const updateFsUI = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      const target = document.getElementById('snake-fullscreen-target') || document.querySelector('.snake-stage-grid');
      if (target) target.classList.toggle('is-fullscreen', isFs);

      fsBtns.forEach(btn => {
        btn.innerHTML = isFs
          ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg><span>Exit Fullscreen</span>'
          : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg><span>Fullscreen</span>';
      });

      setTimeout(resizeCanvas, 120);
    };

    document.addEventListener('fullscreenchange', updateFsUI);
    document.addEventListener('webkitfullscreenchange', updateFsUI);
  }

  function applyPreferencesToUI() {
    // Active Speed
    document.querySelectorAll('.pill-speed').forEach(pill => {
      const lvl = parseInt(pill.getAttribute('data-level'), 10);
      pill.classList.toggle('is-active', lvl === currentLevel);
    });

    // Active Wall
    document.querySelectorAll('.pill-wall').forEach(pill => {
      pill.classList.toggle('is-active', pill.getAttribute('data-wall') === wallMode);
    });

    // Active Theme
    document.querySelectorAll('.pill-theme').forEach(pill => {
      pill.classList.toggle('is-active', pill.getAttribute('data-theme') === currentTheme);
    });

    setTheme(currentTheme);
    updateDashboard();
  }

  function updateDashboard() {
    // Current Score
    const scoreVal = document.getElementById('stat-score');
    if (scoreVal) scoreVal.textContent = score;

    // High Score
    const bestVal = document.getElementById('stat-high-score');
    if (bestVal) bestVal.textContent = highScore;
    const startBest = document.getElementById('overlay-best-score');
    if (startBest) startBest.textContent = highScore;

    // Apples Eaten
    const applesVal = document.getElementById('stat-apples');
    if (applesVal) applesVal.textContent = foodEatenCount;

    // Snake Length
    const lengthVal = document.getElementById('stat-length');
    if (lengthVal) lengthVal.textContent = snake.length;

    // LCD Ribbon Stats
    const lcdScore = document.getElementById('lcd-live-score');
    if (lcdScore) lcdScore.textContent = score;

    const lcdHigh = document.getElementById('lcd-live-high');
    if (lcdHigh) lcdHigh.textContent = highScore;

    const lcdLevel = document.getElementById('lcd-live-level');
    if (lcdLevel) lcdLevel.textContent = `L${currentLevel}`;

    // Sound toggle state
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
      soundBtn.setAttribute('aria-pressed', isSoundEnabled.toString());
      soundBtn.innerHTML = isSoundEnabled ? '<span>🔊</span><span>Sound ON</span>' : '<span>🔇</span><span>Sound OFF</span>';
    }

    // Play/Pause button text
    const playBtn = document.getElementById('btn-play-game');
    if (playBtn) {
      playBtn.innerHTML = isPlaying && !isPaused
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg><span>Pause</span>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Play Snake</span>';
    }
  }

})();
