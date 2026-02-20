import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface GameObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Enemy extends GameObject {
  health: number;
}

interface Projectile extends GameObject {
  angle: number;
}

export default function TopDownShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('shooterHighScore') || '0');
    } catch {
      return 0;
    }
  });
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const gameStateRef = useRef({
    player: { x: 0, y: 0, radius: 15 },
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    keys: new Set<string>(),
    lastEnemySpawn: 0,
    enemySpawnInterval: 2000,
    mouseX: 0,
    mouseY: 0,
  });

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameStateRef.current = {
      player: { x: canvas.width / 2, y: canvas.height / 2, radius: 15 },
      enemies: [],
      projectiles: [],
      keys: new Set<string>(),
      lastEnemySpawn: Date.now(),
      enemySpawnInterval: 2000,
      mouseX: canvas.width / 2,
      mouseY: canvas.height / 2,
    };

    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  }, []);

  const endGame = useCallback(() => {
    setIsPlaying(false);
    setGameOver(true);
    
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('shooterHighScore', score.toString());
      } catch {
        // Ignore storage errors
      }
    }
  }, [score, highScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Input handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        gameStateRef.current.keys.add(e.key.toLowerCase());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameStateRef.current.mouseX = e.clientX - rect.left;
      gameStateRef.current.mouseY = e.clientY - rect.top;
    };

    const handleClick = () => {
      if (!isPlaying || gameOver) return;

      const { player, mouseX, mouseY, projectiles } = gameStateRef.current;
      const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
      const speed = 8;

      projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 5,
        angle,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    // Game loop
    let animationId: number;
    let lastTime = Date.now();

    const gameLoop = () => {
      if (!isPlaying || gameOver) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      const now = Date.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      const { player, enemies, projectiles, keys } = gameStateRef.current;

      // Clear canvas
      ctx.fillStyle = 'oklch(0.95 0.01 240)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = 'oklch(0.85 0.02 240 / 0.3)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Move player
      const speed = 4;
      if (keys.has('w') || keys.has('arrowup')) player.y -= speed;
      if (keys.has('s') || keys.has('arrowdown')) player.y += speed;
      if (keys.has('a') || keys.has('arrowleft')) player.x -= speed;
      if (keys.has('d') || keys.has('arrowright')) player.x += speed;

      // Keep player in bounds
      player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

      // Draw player
      ctx.fillStyle = 'oklch(0.6 0.2 240)';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'oklch(0.5 0.25 240)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw aim line
      ctx.strokeStyle = 'oklch(0.6 0.2 240 / 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(gameStateRef.current.mouseX, gameStateRef.current.mouseY);
      ctx.stroke();

      // Spawn enemies
      if (now - gameStateRef.current.lastEnemySpawn > gameStateRef.current.enemySpawnInterval) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
          case 0: // top
            x = Math.random() * canvas.width;
            y = -20;
            break;
          case 1: // right
            x = canvas.width + 20;
            y = Math.random() * canvas.height;
            break;
          case 2: // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 20;
            break;
          default: // left
            x = -20;
            y = Math.random() * canvas.height;
        }

        enemies.push({
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 12,
          health: 2,
        });

        gameStateRef.current.lastEnemySpawn = now;
        gameStateRef.current.enemySpawnInterval = Math.max(800, 2000 - score * 10);
      }

      // Update and draw enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const enemySpeed = 1.5;
        
        enemy.vx = (dx / dist) * enemySpeed;
        enemy.vy = (dy / dist) * enemySpeed;
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Draw enemy
        const healthPercent = enemy.health / 2;
        ctx.fillStyle = `oklch(0.5 0.2 ${20 + (1 - healthPercent) * 40})`;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `oklch(0.4 0.25 ${20 + (1 - healthPercent) * 40})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Check collision with player
        const playerDist = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        if (playerDist < player.radius + enemy.radius) {
          endGame();
          return;
        }
      }

      // Update and draw projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Remove if out of bounds
        if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
          projectiles.splice(i, 1);
          continue;
        }

        // Draw projectile
        ctx.fillStyle = 'oklch(0.7 0.25 180)';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();

        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
          const enemy = enemies[j];
          const dist = Math.sqrt((proj.x - enemy.x) ** 2 + (proj.y - enemy.y) ** 2);
          
          if (dist < proj.radius + enemy.radius) {
            enemy.health--;
            projectiles.splice(i, 1);
            
            if (enemy.health <= 0) {
              enemies.splice(j, 1);
              setScore((prev) => prev + 10);
            }
            break;
          }
        }
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, gameOver, endGame]);

  return (
    <div className="w-full h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-100/50 via-teal-100/50 to-orange-100/50 dark:from-blue-900/20 dark:via-teal-900/20 dark:to-orange-900/20 border-2 border-blue-200/50 dark:border-blue-800/50 relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
      />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 shadow-lg">
          <p className="text-sm font-bold text-muted-foreground">Score</p>
          <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            {score}
          </p>
        </div>
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 shadow-lg">
          <p className="text-sm font-bold text-muted-foreground">High Score</p>
          <p className="text-2xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            {highScore}
          </p>
        </div>
      </div>

      {/* Start/Game Over Screen */}
      {(!isPlaying || gameOver) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center space-y-4 p-8 bg-white/95 dark:bg-gray-900/95 rounded-3xl border-2 border-blue-200/50 dark:border-blue-800/50 shadow-2xl">
            {gameOver ? (
              <>
                <h3 className="text-3xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Game Over!
                </h3>
                <p className="text-xl font-bold">Final Score: {score}</p>
                {score === highScore && score > 0 && (
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    🎉 New High Score!
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Top-Down Shooter
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Use WASD or Arrow keys to move. Click to shoot. Survive as long as you can!
                </p>
              </>
            )}
            <Button
              onClick={startGame}
              className="h-12 px-8 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 pointer-events-auto"
            >
              {gameOver ? (
                <>
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Play Again
                </>
              ) : (
                'Start Game'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Controls hint */}
      {isPlaying && !gameOver && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 shadow-lg pointer-events-none">
          <p className="text-xs font-semibold text-muted-foreground">
            WASD: Move • Click: Shoot
          </p>
        </div>
      )}
    </div>
  );
}
