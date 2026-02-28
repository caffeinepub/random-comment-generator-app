import React, { useEffect, useRef, useCallback } from 'react';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer: boolean;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  shootTimer: number;
}

interface GameState {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  score: number;
  gameOver: boolean;
  running: boolean;
  keys: Set<string>;
  mouseX: number;
  mouseY: number;
  spawnTimer: number;
  animFrame: number;
  lastTime: number;
}

const CANVAS_W = 340;
const CANVAS_H = 400;

export default function TopDownShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);

  const initState = useCallback((): GameState => ({
    player: { x: CANVAS_W / 2 - 12, y: CANVAS_H - 60, width: 24, height: 24, speed: 180, health: 3 },
    bullets: [],
    enemies: [],
    score: 0,
    gameOver: false,
    running: true,
    keys: new Set(),
    mouseX: CANVAS_W / 2,
    mouseY: CANVAS_H / 2,
    spawnTimer: 0,
    animFrame: 0,
    lastTime: 0,
  }), []);

  const spawnEnemy = useCallback((state: GameState) => {
    const x = Math.random() * (CANVAS_W - 24);
    state.enemies.push({
      x,
      y: -24,
      width: 24,
      height: 24,
      speed: 60 + Math.random() * 40 + state.score * 0.5,
      health: 1,
      shootTimer: 1 + Math.random() * 2,
    });
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const state = stateRef.current;
    if (!state || !state.running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = Math.min((timestamp - (state.lastTime || timestamp)) / 1000, 0.05);
    state.lastTime = timestamp;

    // Move player
    const p = state.player;
    if (state.keys.has('ArrowLeft') || state.keys.has('a') || state.keys.has('A')) p.x -= p.speed * dt;
    if (state.keys.has('ArrowRight') || state.keys.has('d') || state.keys.has('D')) p.x += p.speed * dt;
    if (state.keys.has('ArrowUp') || state.keys.has('w') || state.keys.has('W')) p.y -= p.speed * dt;
    if (state.keys.has('ArrowDown') || state.keys.has('s') || state.keys.has('S')) p.y += p.speed * dt;
    p.x = Math.max(0, Math.min(CANVAS_W - p.width, p.x));
    p.y = Math.max(0, Math.min(CANVAS_H - p.height, p.y));

    // Spawn enemies
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnEnemy(state);
      state.spawnTimer = Math.max(0.5, 2 - state.score * 0.02);
    }

    // Move bullets
    state.bullets = state.bullets.filter(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      return b.x > -10 && b.x < CANVAS_W + 10 && b.y > -10 && b.y < CANVAS_H + 10;
    });

    // Move enemies & shoot
    for (const e of state.enemies) {
      const dx = p.x + p.width / 2 - (e.x + e.width / 2);
      const dy = p.y + p.height / 2 - (e.y + e.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;

      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        const speed = 120;
        state.bullets.push({ x: e.x + e.width / 2, y: e.y + e.height / 2, vx: (dx / dist) * speed, vy: (dy / dist) * speed, fromPlayer: false });
        e.shootTimer = 1.5 + Math.random();
      }
    }

    // Collision: player bullets vs enemies
    const toRemoveBullets = new Set<number>();
    const toRemoveEnemies = new Set<number>();
    for (let bi = 0; bi < state.bullets.length; bi++) {
      const b = state.bullets[bi];
      if (!b.fromPlayer) continue;
      for (let ei = 0; ei < state.enemies.length; ei++) {
        const e = state.enemies[ei];
        if (b.x > e.x && b.x < e.x + e.width && b.y > e.y && b.y < e.y + e.height) {
          e.health--;
          toRemoveBullets.add(bi);
          if (e.health <= 0) {
            toRemoveEnemies.add(ei);
            state.score++;
          }
        }
      }
    }
    state.bullets = state.bullets.filter((_, i) => !toRemoveBullets.has(i));
    state.enemies = state.enemies.filter((_, i) => !toRemoveEnemies.has(i));

    // Collision: enemy bullets vs player
    for (const b of state.bullets) {
      if (b.fromPlayer) continue;
      if (b.x > p.x && b.x < p.x + p.width && b.y > p.y && b.y < p.y + p.height) {
        p.health--;
        b.vy = 9999; // remove bullet
        if (p.health <= 0) {
          state.gameOver = true;
          state.running = false;
        }
      }
    }

    // Collision: enemies touching player
    for (const e of state.enemies) {
      if (e.x < p.x + p.width && e.x + e.width > p.x && e.y < p.y + p.height && e.y + e.height > p.y) {
        state.gameOver = true;
        state.running = false;
      }
    }

    // Draw
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid
    ctx.strokeStyle = 'rgba(0,200,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
    for (let y = 0; y < CANVAS_H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

    // Player
    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
    grad.addColorStop(0, '#00e5ff');
    grad.addColorStop(1, '#0066cc');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 10);
    ctx.lineTo(0, 5);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Health
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < p.health ? '#ff4444' : '#333';
      ctx.beginPath();
      ctx.arc(10 + i * 16, 14, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enemies
    for (const e of state.enemies) {
      ctx.save();
      ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
      const eg = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
      eg.addColorStop(0, '#ff6600');
      eg.addColorStop(1, '#cc0000');
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Bullets
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.fromPlayer ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = b.fromPlayer ? '#00ffcc' : '#ff4444';
      ctx.fill();
    }

    // Score
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${state.score}`, CANVAS_W - 10, 20);
    ctx.textAlign = 'left';

    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 20);
      ctx.fillStyle = '#00e5ff';
      ctx.font = '18px monospace';
      ctx.fillText(`Score: ${state.score}`, CANVAS_W / 2, CANVAS_H / 2 + 15);
      ctx.fillStyle = '#aaa';
      ctx.font = '13px monospace';
      ctx.fillText('Click to restart', CANVAS_W / 2, CANVAS_H / 2 + 45);
      ctx.textAlign = 'left';
      return;
    }

    state.animFrame = requestAnimationFrame(gameLoop);
  }, [spawnEnemy]);

  const startGame = useCallback(() => {
    const state = initState();
    stateRef.current = state;
    state.animFrame = requestAnimationFrame(gameLoop);
  }, [initState, gameLoop]);

  useEffect(() => {
    startGame();
    return () => {
      if (stateRef.current) {
        cancelAnimationFrame(stateRef.current.animFrame);
        stateRef.current.running = false;
      }
    };
  }, [startGame]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    stateRef.current?.keys.add(e.key);
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    stateRef.current?.keys.delete(e.key);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !stateRef.current) return;
    stateRef.current.mouseX = e.clientX - rect.left;
    stateRef.current.mouseY = e.clientY - rect.top;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = stateRef.current;
    if (!state) return;
    if (state.gameOver) {
      cancelAnimationFrame(state.animFrame);
      startGame();
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const p = state.player;
    const dx = mx - (p.x + p.width / 2);
    const dy = my - (p.y + p.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 350;
    state.bullets.push({ x: p.x + p.width / 2, y: p.y + p.height / 2, vx: (dx / dist) * speed, vy: (dy / dist) * speed, fromPlayer: true });
  }, [startGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="w-full rounded-lg cursor-crosshair border border-white/10"
      style={{ maxHeight: 400, objectFit: 'contain' }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      tabIndex={0}
    />
  );
}
