/**
 * 3D Tic-Tac-Toe — UI/UX Layer
 * Dark theme: bg #0a0a1a, X = #00ffff (cyan), O = #ff00ff (magenta)
 */

(function () {
  "use strict";

  const COLORS = {
    bg: "#0a0a1a",
    x: "#00ffff",
    o: "#ff00ff",
    xDim: "rgba(0,255,255,0.3)",
    oDim: "rgba(255,0,255,0.3)",
    panelBg: "rgba(10,10,26,0.92)",
    text: "#e0e0ff",
    textDim: "rgba(224,224,255,0.6)",
    btnBg: "#1a1a3a",
    btnBorder: "#2a2a5a",
    btnBgHover: "#252555",
  };

  let state = {
    currentPlayer: "X",
    scores: { X: 0, O: 0 },
    draws: 0,
    gameOver: false,
    winner: null,
    winningCells: [],
    cellsFilled: 0,
    audioCtx: null,
  };

  let container, canvasWrap, overlay, turnDisplay, scoreDisplay;
  let banner, bannerText, resetBtn, drawMsg, instructions, instrToggle;
  let particleCanvas, particleCtx;
  let particles = [];
  let animFrame = null;
  let neonPhase = 0;
  let bannerOpacity = 0;
  let bannerTarget = 0;
  let winPulsePhase = 0;
  let drawMsgVisible = false;
  let drawMsgOpacity = 0;

  function getAudio() {
    if (!state.audioCtx) {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return state.audioCtx;
  }

  function playClick(player) {
    try {
      const ctx = getAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = player === "X" ? 660 : 440;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (_) {}
  }

  function playWinSound() {
    try {
      const ctx = getAudio();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch (_) {}
  }

  function playDrawSound() {
    try {
      const ctx = getAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = 220;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
  }

  function init(options) {
    opts = Object.assign(
      {
        container: "#game-container",
        canvas: "#game-canvas",
        onReset: null,
      },
      options || {}
    );

    container = document.querySelector(opts.container) || document.body;
    container.style.cssText = `
      background:${COLORS.bg};color:${COLORS.text};margin:0;padding:0;
      font-family:'Segoe UI',system-ui,sans-serif;width:100%;height:100vh;
      display:flex;flex-direction:column;align-items:center;overflow:hidden;
      user-select:none;-webkit-user-select:none;
    `;

    buildDOM();
    setupResize();
    requestAnimationFrame(loop);
    return api;
  }

  let opts = {};

  function buildDOM() {
    turnDisplay = $el("div", "ttt3d-turn");
    turnDisplay.style.cssText = `
      font-size:clamp(1.2rem,3vw,2.2rem);font-weight:900;
      letter-spacing:4px;text-transform:uppercase;
      padding:8px 0;width:100%;text-align:center;
      transition:color 0.3s;
    `;
    container.appendChild(turnDisplay);

    scoreDisplay = $el("div", "ttt3d-score");
    scoreDisplay.style.cssText = `
      display:flex;gap:24px;align-items:center;justify-content:center;
      font-size:clamp(0.8rem,1.6vw,1.1rem);padding:4px 0 8px;
    `;
    container.appendChild(scoreDisplay);

    canvasWrap = $el("div", "ttt3d-canvas-wrap");
    canvasWrap.style.cssText = `
      position:relative;flex:1;display:flex;align-items:center;
      justify-content:center;width:100%;min:0;overflow:hidden;
    `;

    const canvas = document.querySelector(opts.canvas);
    if (canvas) {
      canvas.style.cssText = `
        max-width:100%;max-height:100%;border-radius:8px;
        box-shadow:0 0 40px rgba(0,255,255,0.08);
      `;
      canvasWrap.appendChild(canvas);
    }

    particleCanvas = document.createElement("canvas");
    particleCanvas.id = "ttt3d-particles";
    particleCanvas.style.cssText = `
      position:absolute;top:0;left:0;width:100%;height:100%;
      pointer-events:none;z-index:5;
    `;
    canvasWrap.appendChild(particleCanvas);
    particleCtx = particleCanvas.getContext("2d");

    overlay = $el("div", "ttt3d-overlay");
    overlay.style.cssText = `
      position:absolute;top:0;left:0;width:100%;height:100%;
      display:flex;flex-direction:column;align-items:center;
      justify-content:center;pointer-events:none;z-index:10;
    `;

    banner = $el("div", "ttt3d-banner");
    banner.style.cssText = `
      font-size:clamp(1.6rem,5vw,4rem);font-weight:900;
      letter-spacing:6px;text-transform:uppercase;
      opacity:0;transform:scale(0.7);transition:none;
      text-shadow:0 0 30px currentColor,0 0 60px currentColor;
      pointer-events:auto;padding:12px 32px;border-radius:12px;
      text-align:center;line-height:1.2;
    `;
    bannerText = $el("span", "ttt3d-banner-text");
    banner.appendChild(bannerText);
    overlay.appendChild(banner);

    drawMsg = $el("div", "ttt3d-draw");
    drawMsg.style.cssText = `
      font-size:clamp(1.2rem,3.5vw,3rem);font-weight:900;
      letter-spacing:4px;color:${COLORS.textDim};
      opacity:0;transform:scale(0.8);
      text-shadow:0 0 20px rgba(224,224,255,0.3);
      margin-top:16px;
    `;
    drawMsg.textContent = "Draw!";
    overlay.appendChild(drawMsg);

    canvasWrap.appendChild(overlay);
    container.appendChild(canvasWrap);

    resetBtn = $el("button", "ttt3d-reset");
    resetBtn.textContent = "↻ NEW GAME";
    resetBtn.style.cssText = `
      position:absolute;bottom:16px;right:16px;z-index:15;
      background:linear-gradient(145deg,${COLORS.btnBg},#111130);
      color:${COLORS.text};border:1px solid ${COLORS.btnBorder};
      padding:10px 22px;border-radius:10px;font-size:0.85rem;
      font-weight:700;letter-spacing:2px;cursor:pointer;
      box-shadow:0 4px 15px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.05);
      transition:all 0.2s;font-family:inherit;
    `;
    resetBtn.addEventListener("mouseenter", () => {
      resetBtn.style.background = COLORS.btnBgHover;
      resetBtn.style.borderColor = COLORS.x;
      resetBtn.style.boxShadow = `0 4px 20px rgba(0,255,255,0.15),inset 0 1px 0 rgba(255,255,255,0.05)`;
    });
    resetBtn.addEventListener("mouseleave", () => {
      resetBtn.style.background = `linear-gradient(145deg,${COLORS.btnBg},#111130)`;
      resetBtn.style.borderColor = COLORS.btnBorder;
      resetBtn.style.boxShadow = `0 4px 15px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.05)`;
    });
    resetBtn.addEventListener("click", () => {
      if (state.audioCtx && state.audioCtx.state === "suspended") {
        state.audioCtx.resume();
      }
      api.reset();
      if (typeof opts.onReset === "function") opts.onReset();
    });
    canvasWrap.appendChild(resetBtn);

    instrToggle = $el("button", "ttt3d-instr-toggle");
    instrToggle.textContent = "? HELP";
    instrToggle.style.cssText = `
      position:absolute;bottom:16px;left:16px;z-index:15;
      background:${COLORS.panelBg};color:${COLORS.textDim};
      border:1px solid ${COLORS.btnBorder};padding:8px 18px;
      border-radius:10px;font-size:0.8rem;font-weight:600;
      letter-spacing:1px;cursor:pointer;backdrop-filter:blur(4px);
      transition:all 0.2s;font-family:inherit;
    `;
    instrToggle.addEventListener("mouseenter", () => {
      instrToggle.style.color = COLORS.text;
      instrToggle.style.borderColor = "rgba(0,255,255,0.3)";
    });
    instrToggle.addEventListener("mouseleave", () => {
      instrToggle.style.color = COLORS.textDim;
      instrToggle.style.borderColor = COLORS.btnBorder;
    });

    instructions = $el("div", "ttt3d-instructions");
    instructions.style.cssText = `
      position:absolute;bottom:56px;left:16px;z-index:14;
      background:${COLORS.panelBg};color:${COLORS.text};
      border:1px solid ${COLORS.btnBorder};padding:16px 20px;
      border-radius:12px;font-size:0.82rem;line-height:1.65;
      max-width:320px;backdrop-filter:blur(8px);
      opacity:0;transform:translateY(10px) scale(0.97);
      pointer-events:none;transition:all 0.25s;
      box-shadow:0 8px 30px rgba(0,0,0,0.5);
    `;
    instructions.innerHTML = `
      <strong style="font-size:0.95rem;color:${COLORS.x};letter-spacing:1px;">3D TIC-TAC-TOE</strong><br>
      Get 3 in a row to win.<br><br>
      <b>• Lines:</b> Rows, columns, diagonals<br>
      <b>• 3 layers:</b> Across layers too<br><br>
      <b>• Click</b> a cell to place<br>
      <b>• Diagonals</b> wrap between layers<br><br>
      <span style="color:${COLORS.textDim};font-size:0.75rem;">27 cells · 49 winning lines</span>
    `;
    let instrOpen = false;
    instrToggle.addEventListener("click", () => {
      instrOpen = !instrOpen;
      if (instrOpen) {
        instructions.style.opacity = "1";
        instructions.style.transform = "translateY(0) scale(1)";
        instructions.style.pointerEvents = "auto";
        instrToggle.style.color = COLORS.x;
        instrToggle.style.borderColor = COLORS.x;
      } else {
        instructions.style.opacity = "0";
        instructions.style.transform = "translateY(10px) scale(0.97)";
        instructions.style.pointerEvents = "none";
        instrToggle.style.color = COLORS.textDim;
        instrToggle.style.borderColor = COLORS.btnBorder;
      }
    });
    canvasWrap.appendChild(instructions);
    canvasWrap.appendChild(instrToggle);

    updateTurnDisplay();
    updateScoreDisplay();
  }

  function $el(tag, id) {
    const el = document.createElement(tag);
    el.id = id;
    return el;
  }

  function updateTurnDisplay() {
    const p = state.currentPlayer;
    const color = p === "X" ? COLORS.x : COLORS.o;
    turnDisplay.innerHTML = `<span style="color:${COLORS.textDim};font-weight:400;">Turn: </span><span id="ttt3d-turn-player">${p}</span>`;
    const span = turnDisplay.querySelector("#ttt3d-turn-player");
    span.style.color = color;
    span.style.textShadow = `0 0 12px ${color},0 0 24px ${color}`;
  }

  function updateScoreDisplay() {
    scoreDisplay.innerHTML = `
      <span style="color:${COLORS.x};text-shadow:0 0 8px ${COLORS.x};">
        X: <b>${state.scores.X}</b>
      </span>
      <span style="color:${COLORS.textDim};font-size:0.75rem;">
        Draws: ${state.draws}
      </span>
      <span style="color:${COLORS.o};text-shadow:0 0 8px ${COLORS.o};">
        O: <b>${state.scores.O}</b>
      </span>
    `;
  }

  function setupResize() {
    function resize() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const canvas = document.querySelector(opts.canvas);
      if (canvas) {
        const maxW = vw * 0.92;
        const maxH = vh * 0.72;
        const aspect = canvas.width / canvas.height || 1;
        let w = maxW;
        let h = w / aspect;
        if (h > maxH) { h = maxH; w = h * aspect; }
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
      }
      if (particleCanvas && canvasWrap) {
        const rect = canvasWrap.getBoundingClientRect();
        particleCanvas.width = rect.width;
        particleCanvas.height = rect.height;
      }
    }
    window.addEventListener("resize", resize);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(resize);
      ro.observe(canvasWrap);
    }
    resize();
  }

  function spawnParticles(color) {
    const cx = particleCanvas.width / 2;
    const cy = particleCanvas.height / 2;
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: color,
        life: 1.0,
        decay: 0.008 + Math.random() * 0.015,
        gravity: 0.02,
      });
    }
  }

  function updateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += p.gravity; p.vx *= 0.99;
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      particleCtx.globalAlpha = p.life;
      particleCtx.fillStyle = p.color;
      particleCtx.shadowColor = p.color;
      particleCtx.shadowBlur = 8;
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      particleCtx.fill();
    }
    particleCtx.globalAlpha = 1;
    particleCtx.shadowBlur = 0;
  }

  function showWinBanner(winner) {
    const color = winner === "X" ? COLORS.x : COLORS.o;
    bannerText.textContent = winner + " WINS!";
    bannerText.style.color = color;
    banner.style.color = color;
    bannerTarget = 1;
    playWinSound();
    spawnParticles(color);
  }

  function hideBanner() { bannerTarget = 0; }

  function showDrawMessage() {
    drawMsgVisible = true;
    drawMsg.style.transition = "opacity 0.4s, transform 0.4s";
    playDrawSound();
  }

  function hideDrawMessage() { drawMsgVisible = false; }

  function loop() {
    neonPhase += 0.03;
    winPulsePhase += 0.06;

    const turnSpan = turnDisplay.querySelector("#ttt3d-turn-player");
    if (turnSpan && !state.gameOver) {
      const p = state.currentPlayer;
      const color = p === "X" ? COLORS.x : COLORS.o;
      const pulse = 0.6 + 0.4 * Math.sin(neonPhase);
      turnSpan.style.textShadow = `0 0 ${8 + 8 * pulse}px ${color},0 0 ${16 + 16 * pulse}px ${color}`;
      turnSpan.style.opacity = String(0.75 + 0.25 * pulse);
    }

    if (bannerOpacity < bannerTarget) {
      bannerOpacity = Math.min(bannerOpacity + 0.035, bannerTarget);
    } else if (bannerOpacity > bannerTarget) {
      bannerOpacity = Math.max(bannerOpacity - 0.03, bannerTarget);
    }
    banner.style.opacity = String(bannerOpacity);
    banner.style.transform = `scale(${0.7 + 0.3 * bannerOpacity})`;

    if (drawMsgVisible && drawMsgOpacity < 1) {
      drawMsgOpacity = Math.min(drawMsgOpacity + 0.04, 1);
    } else if (!drawMsgVisible && drawMsgOpacity > 0) {
      drawMsgOpacity = Math.max(drawMsgOpacity - 0.04, 0);
    }
    drawMsg.style.opacity = String(drawMsgOpacity);
    drawMsg.style.transform = `scale(${0.8 + 0.2 * drawMsgOpacity})`;

    if (particles.length > 0) updateParticles();

    animFrame = requestAnimationFrame(loop);
  }

  const api = {
    init: init,
    onCellPlaced(player, layer, row, col) {
      state.currentPlayer = player === "X" ? "O" : "X";
      state.cellsFilled++;
      playClick(player);
      updateTurnDisplay();
    },
    onWin(winner, winningCells) {
      state.gameOver = true;
      state.winner = winner;
      state.winningCells = winningCells || [];
      state.scores[winner]++;
      updateScoreDisplay();
      showWinBanner(winner);
    },
    onDraw() {
      state.gameOver = true;
      state.winner = null;
      state.draws++;
      updateScoreDisplay();
      showDrawMessage();
    },
    reset() {
      state.currentPlayer = "X";
      state.gameOver = false;
      state.winner = null;
      state.winningCells = [];
      state.cellsFilled = 0;
      bannerOpacity = 0;
      bannerTarget = 0;
      banner.style.opacity = "0";
      banner.style.transform = "scale(0.7)";
      drawMsgVisible = false;
      drawMsgOpacity = 0;
      drawMsg.style.opacity = "0";
      particles = [];
      if (particleCtx) particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      updateTurnDisplay();
      updateScoreDisplay();
    },
    getState() { return { ...state }; },
    getWinningCells() { return state.winningCells; },
    getPulsePhase() { return winPulsePhase; },
    setScores(x, o) { state.scores.X = x; state.scores.O = o; updateScoreDisplay(); },
    destroy() {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (state.audioCtx) state.audioCtx.close();
      if (container) container.innerHTML = "";
    },
  };

  window.TTT3D_UI = api;
})();
