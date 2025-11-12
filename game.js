// Make class globally accessible
class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Pixel art style - disable smoothing for crisp pixels
        this.ctx.imageSmoothingEnabled = false;
        
        // Wing animation state
        this.wingAnimationFrame = 0;
        
        // Pattern cache for performance
        this.patterns = {};
        
        // Game configuration (must be defined before setCanvasSize)
        this.config = {
            gravity: 0.3,
            flapPower: -7.5, // Increased flap power for better control
            gameSpeed: 2,
            pipeWidth: 60,
            pipeGap: 180,
            pipeSpacing: 250, // Fixed spacing between pipes
            groundHeight: 20,
            birdSize: 30
        };
        
        // Initialize pipes array early (needed for draw method)
        this.pipes = [];
        
        // Game state (initialize early)
        this.gameRunning = false;
        this.gameStarted = false; // Track if player has made first flap
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.animationFrameId = null;
        this.lastTime = 0;
        
        // Set canvas size (base size, will scale for mobile)
        this.baseWidth = 400;
        this.baseHeight = 600;
        
        // Initialize bird early (needed for draw method)
        // Will be repositioned after canvas size is set
        this.bird = {
            x: 0,
            y: 0,
            width: this.config.birdSize,
            height: this.config.birdSize,
            velocity: 0,
            rotation: 0,
            wingAngle: 0 // Wing animation angle
        };
        
        // Set canvas size (this will call draw, so bird must exist)
        this.setCanvasSize();
        
        // Now position bird correctly after canvas size is known
        this.bird.x = this.canvas.width / 2 - this.config.birdSize / 2;
        this.bird.y = this.canvas.height / 2;
        
        // Handle window resize
        window.addEventListener('resize', () => this.setCanvasSize());

        // Setup event listeners
        this.setupEventListeners();
        
        // Initial draw
        this.draw();
    }

    setCanvasSize() {
        // Check if mobile
        const isMobile = window.innerWidth <= 450;
        
        if (isMobile) {
            // Use full viewport on mobile
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        } else {
            // Use fixed size on desktop
            this.canvas.width = this.baseWidth;
            this.canvas.height = this.baseHeight;
        }
        
        // Update bird position if game not running and config exists
        if (!this.gameRunning && this.config && this.bird) {
            this.bird.x = this.canvas.width / 2 - this.config.birdSize / 2;
            this.bird.y = this.canvas.height / 2;
        } else if (this.gameRunning && this.config && this.bird) {
            // Keep bird centered horizontally during game
            this.bird.x = this.canvas.width / 2 - this.config.birdSize / 2;
        }
        
        // Re-enable pixel art mode after canvas resize
        if (this.ctx) {
            this.ctx.imageSmoothingEnabled = false;
        }
        
        // Redraw only if context exists
        if (this.ctx) {
            this.draw();
        }
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameRunning) {
                    this.flap();
                } else if (document.getElementById('startScreen').classList.contains('hidden') === false) {
                    this.startGame();
                } else if (document.getElementById('gameOverScreen').classList.contains('hidden') === false) {
                    this.startGame();
                }
            }
        });

        // Mouse/touch controls
        this.canvas.addEventListener('click', () => {
            if (this.gameRunning) {
                this.flap();
            } else if (document.getElementById('startScreen').classList.contains('hidden') === false) {
                this.startGame();
            } else if (document.getElementById('gameOverScreen').classList.contains('hidden') === false) {
                this.startGame();
            }
        });

        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameRunning) {
                this.flap();
            } else if (document.getElementById('startScreen').classList.contains('hidden') === false) {
                this.startGame();
            } else if (document.getElementById('gameOverScreen').classList.contains('hidden') === false) {
                this.startGame();
            }
        });

        // Button listeners - use arrow function to preserve 'this' context
        const startButton = document.getElementById('startButton');
        const restartButton = document.getElementById('restartButton');
        
        if (startButton) {
            console.log('Start button found, attaching listener');
            startButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Start button clicked!');
                this.startGame();
            });
            // Also add mousedown as backup
            startButton.addEventListener('mousedown', (e) => {
                e.preventDefault();
                console.log('Start button mousedown!');
                this.startGame();
            });
        } else {
            console.error('Start button not found!');
        }
        
        if (restartButton) {
            console.log('Restart button found, attaching listener');
            restartButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Restart button clicked!');
                this.startGame();
            });
        } else {
            console.error('Restart button not found!');
        }
    }

    loadHighScore() {
        try {
            return parseInt(localStorage.getItem('flappyBirdHighScore') || '0', 10);
        } catch (e) {
            return 0;
        }
    }

    saveHighScore() {
        try {
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('flappyBirdHighScore', this.highScore.toString());
            }
        } catch (e) {
            // Ignore localStorage errors
        }
    }

    startGame() {
        console.log('startGame() called');
        try {
            this.gameRunning = true;
            this.gameStarted = false; // Reset - game starts on first flap
            this.score = 0;
            this.bird = {
                x: this.canvas.width / 2 - this.config.birdSize / 2,
                y: this.canvas.height / 2,
                width: this.config.birdSize,
                height: this.config.birdSize,
                velocity: 0,
                rotation: 0,
                wingAngle: 0
            };
            this.wingAnimationFrame = 0;
            this.pipes = [];
            this.lastTime = performance.now();
            
            // Don't create first pipe until game actually starts (first flap)
            
            // Hide screens
            const startScreen = document.getElementById('startScreen');
            const gameOverScreen = document.getElementById('gameOverScreen');
            
            console.log('Hiding screens...');
            if (startScreen) {
                console.log('Start screen found, hiding it');
                startScreen.classList.add('hidden');
                // Force hide with inline style as backup
                startScreen.style.display = 'none';
            } else {
                console.error('Start screen not found!');
            }
            if (gameOverScreen) {
                gameOverScreen.classList.add('hidden');
                gameOverScreen.style.display = 'none';
            }
            
            // Cancel any existing animation frame
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            
            console.log('Starting game loop...');
            // Start the game loop
            this.gameLoop();
            console.log('Game started successfully!');
        } catch (error) {
            console.error('Error starting game:', error);
            console.error(error.stack);
            this.gameRunning = false;
        }
    }

    flap() {
        if (this.gameRunning) {
            // Start the game on first flap
            if (!this.gameStarted) {
                this.gameStarted = true;
                console.log('Game started with first flap!');
                // Create first pipe when game actually starts
                this.createPipe();
            }
            this.bird.velocity = this.config.flapPower;
        }
    }

    // Pattern generator functions
    createPattern(type, width, height, color1, color2) {
        const cacheKey = `${type}_${width}_${height}_${color1}_${color2}`;
        if (this.patterns[cacheKey]) {
            return this.patterns[cacheKey];
        }
        
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = width;
        patternCanvas.height = height;
        const patternCtx = patternCanvas.getContext('2d');
        patternCtx.imageSmoothingEnabled = false;
        
        if (type === 'stripes') {
            // Vertical stripes pattern
            patternCtx.fillStyle = color1;
            patternCtx.fillRect(0, 0, width, height);
            patternCtx.fillStyle = color2;
            for (let x = 0; x < width; x += 8) {
                patternCtx.fillRect(x, 0, 4, height);
            }
        } else if (type === 'bricks') {
            // Brick pattern
            patternCtx.fillStyle = color1;
            patternCtx.fillRect(0, 0, width, height);
            patternCtx.fillStyle = color2;
            const brickHeight = 12;
            const brickWidth = 20;
            for (let y = 0; y < height; y += brickHeight) {
                const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
                for (let x = -offset; x < width; x += brickWidth) {
                    patternCtx.fillRect(Math.round(x), Math.round(y), brickWidth - 2, brickHeight - 2);
                }
            }
        } else if (type === 'wood') {
            // Wood grain pattern
            patternCtx.fillStyle = color1;
            patternCtx.fillRect(0, 0, width, height);
            patternCtx.strokeStyle = color2;
            patternCtx.lineWidth = 1;
            for (let y = 0; y < height; y += 3) {
                patternCtx.beginPath();
                const wave = Math.sin(y * 0.1) * 2;
                patternCtx.moveTo(0, y);
                for (let x = 0; x < width; x += 5) {
                    patternCtx.lineTo(x, y + Math.sin(x * 0.2 + y * 0.1) * 1);
                }
                patternCtx.stroke();
            }
        }
        
        const pattern = this.ctx.createPattern(patternCanvas, 'repeat');
        this.patterns[cacheKey] = pattern;
        return pattern;
    }

    createPipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.config.pipeGap - this.config.groundHeight - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomHeight: this.canvas.height - topHeight - this.config.pipeGap - this.config.groundHeight,
            scored: false
        });
    }

    update(deltaTime) {
        if (!this.gameRunning) return;
        
        // Update wing animation frame (always animate, even when stationary)
        this.wingAnimationFrame += deltaTime / 16.67; // Normalize to 60fps
        // Calculate wing angle using sine wave for smooth flapping
        this.bird.wingAngle = Math.sin(this.wingAnimationFrame * 0.3) * 25; // 25 degree max angle

        // Only apply physics and move pipes after game has started (first flap)
        if (this.gameStarted) {
            // Update bird physics
            this.bird.velocity += this.config.gravity;
            this.bird.y += this.bird.velocity * (deltaTime / 16.67); // Normalize to 60fps

            // Calculate bird rotation based on velocity (max 30 degrees)
            this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 30);

            // Update pipes
            const moveDistance = this.config.gameSpeed * (deltaTime / 16.67);
            this.pipes.forEach(pipe => {
                pipe.x -= moveDistance;
            });
        } else {
            // Bird stays stationary until first flap
            this.bird.velocity = 0;
            this.bird.rotation = 0;
        }

        // Only create/update pipes after game has started
        if (this.gameStarted) {
            // Create new pipes at fixed intervals
            // Check if we need to create a new pipe
            const lastPipeX = this.pipes.length > 0 
                ? Math.max(...this.pipes.map(p => p.x)) 
                : -this.config.pipeSpacing;
            
            // Create a new pipe when the last pipe (or start) is pipeSpacing away from the right edge
            if (lastPipeX <= this.canvas.width - this.config.pipeSpacing) {
                this.createPipe();
            }

            // Remove off-screen pipes
            this.pipes = this.pipes.filter(pipe => pipe.x > -this.config.pipeWidth);

            // Update score
            this.pipes.forEach(pipe => {
                if (pipe.x + this.config.pipeWidth < this.bird.x && !pipe.scored) {
                    this.score++;
                    pipe.scored = true;
                }
            });

            // Check collisions
            if (this.checkCollision()) {
                this.gameOver();
            }
        }
    }

    checkCollision() {
        // Check ceiling collision
        if (this.bird.y < 0) {
            return true;
        }

        // Check ground collision
        if (this.bird.y + this.bird.height > this.canvas.height - this.config.groundHeight) {
            return true;
        }

        // Check pipe collisions
        for (const pipe of this.pipes) {
            const birdRight = this.bird.x + this.bird.width;
            const birdLeft = this.bird.x;
            const pipeRight = pipe.x + this.config.pipeWidth;
            const pipeLeft = pipe.x;

            // Check if bird is within pipe's horizontal bounds
            if (birdRight > pipeLeft && birdLeft < pipeRight) {
                // Check if bird hits top pipe
                if (this.bird.y < pipe.topHeight) {
                    return true;
                }
                // Check if bird hits bottom pipe
                const bottomPipeTop = pipe.topHeight + this.config.pipeGap;
                if (this.bird.y + this.bird.height > bottomPipeTop) {
                    return true;
                }
            }
        }

        return false;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background with subtle pattern (pixel art style - darker sky)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#5B9BD5'); // Pixel art blue
        gradient.addColorStop(1, '#B0D4E6'); // Lighter blue
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pipes with patterns (pixel art style)
        if (this.pipes && Array.isArray(this.pipes)) {
            this.pipes.forEach(pipe => {
                // Use integer coordinates for pixel art
                const pipeX = Math.round(pipe.x);
                const pipeW = Math.round(this.config.pipeWidth);
                
                // Create brick pattern for pipes
                const pipePattern = this.createPattern('bricks', pipeW, pipe.topHeight, '#2D5016', '#3A6B1F');
                
                // Top pipe
                this.ctx.fillStyle = pipePattern;
                this.ctx.fillRect(pipeX, 0, pipeW, Math.round(pipe.topHeight));
                
                // Top pipe cap (darker green)
                this.ctx.fillStyle = '#1A3D0A';
                this.ctx.fillRect(Math.round(pipeX - 5), Math.round(pipe.topHeight - 20), pipeW + 10, 20);
                
                // Bottom pipe
                const bottomY = Math.round(this.canvas.height - pipe.bottomHeight - this.config.groundHeight);
                this.ctx.fillStyle = pipePattern;
                this.ctx.fillRect(pipeX, bottomY, pipeW, Math.round(pipe.bottomHeight));
                
                // Bottom pipe cap
                this.ctx.fillStyle = '#1A3D0A';
                this.ctx.fillRect(Math.round(pipeX - 5), bottomY, pipeW + 10, 20);
            });
        }

        // Draw ground with wood grain pattern (pixel art style)
        const groundY = Math.round(this.canvas.height - this.config.groundHeight);
        const woodPattern = this.createPattern('wood', this.canvas.width, this.config.groundHeight, '#6B4423', '#8B5A3C');
        this.ctx.fillStyle = woodPattern;
        this.ctx.fillRect(0, groundY, this.canvas.width, this.config.groundHeight);
        
        // Ground grass line (pixel art style - thicker)
        this.ctx.strokeStyle = '#4A5D23';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY);
        this.ctx.lineTo(this.canvas.width, groundY);
        this.ctx.stroke();

        // Draw bird with rotation and animated wing (pixel art style)
        if (this.bird && this.bird.x !== undefined && this.bird.y !== undefined) {
            this.ctx.save();
            const birdCenterX = Math.round(this.bird.x + this.bird.width / 2);
            const birdCenterY = Math.round(this.bird.y + this.bird.height / 2);
            this.ctx.translate(birdCenterX, birdCenterY);
            this.ctx.rotate((this.bird.rotation * Math.PI) / 180);
        
            // Bird body (pixel art yellow - more saturated)
            this.ctx.fillStyle = '#FFC800';
            this.ctx.fillRect(
                Math.round(-this.bird.width / 2), 
                Math.round(-this.bird.height / 2), 
                this.bird.width, 
                this.bird.height
            );
            
            // Bird body outline for pixel art style
            this.ctx.strokeStyle = '#E6B800';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                Math.round(-this.bird.width / 2), 
                Math.round(-this.bird.height / 2), 
                this.bird.width, 
                this.bird.height
            );
        
            // Animated bird wing (rotates based on wingAngle)
            this.ctx.save();
            this.ctx.rotate((this.bird.wingAngle * Math.PI) / 180);
            this.ctx.fillStyle = '#FF8C00';
            // Draw wing as rectangle for pixel art style
            this.ctx.fillRect(
                Math.round(-this.bird.width / 2 - 8), 
                Math.round(-6), 
                10, 
                12
            );
            // Wing outline
            this.ctx.strokeStyle = '#E67A00';
            this.ctx.strokeRect(
                Math.round(-this.bird.width / 2 - 8), 
                Math.round(-6), 
                10, 
                12
            );
            this.ctx.restore();
        
            // Bird eye (pixel art style - square-ish)
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(
                Math.round(this.bird.width / 2 - 8), 
                Math.round(-this.bird.height / 2 + 2), 
                4, 
                4
            );
            
            // Eye highlight
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillRect(
                Math.round(this.bird.width / 2 - 7), 
                Math.round(-this.bird.height / 2 + 3), 
                2, 
                2
            );
        
            // Bird beak (pixel art style - triangular)
            this.ctx.fillStyle = '#FF4500';
            this.ctx.beginPath();
            this.ctx.moveTo(Math.round(this.bird.width / 2), 0);
            this.ctx.lineTo(Math.round(this.bird.width / 2 + 6), -2);
            this.ctx.lineTo(Math.round(this.bird.width / 2 + 6), 2);
            this.ctx.closePath();
            this.ctx.fill();
        
            this.ctx.restore();
        }

        // Draw score with pixel art styling
        this.ctx.fillStyle = '#FFF';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.font = 'bold 28px monospace'; // Monospace for pixel art feel
        const scoreText = this.score.toString();
        const scoreX = Math.round(this.canvas.width / 2 - this.ctx.measureText(scoreText).width / 2);
        this.ctx.strokeText(scoreText, scoreX, 40);
        this.ctx.fillText(scoreText, scoreX, 40);

        // Draw high score (pixel art style)
        if (this.highScore > 0) {
            this.ctx.fillStyle = '#FFC800';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.font = 'bold 16px monospace';
            const highScoreText = `Best: ${this.highScore}`;
            const highScoreX = Math.round(this.canvas.width / 2 - this.ctx.measureText(highScoreText).width / 2);
            this.ctx.strokeText(highScoreText, highScoreX, 70);
            this.ctx.fillText(highScoreText, highScoreX, 70);
        }
    }

    gameLoop(currentTime = 0) {
        if (!this.gameRunning && this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            return;
        }

        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Cap delta time to prevent large jumps
        const cappedDelta = Math.min(deltaTime, 100);

        if (this.gameRunning) {
            this.update(cappedDelta);
        }
        
        this.draw();
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    gameOver() {
        this.gameRunning = false;
        this.saveHighScore();
        
        // Update high score display
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore;
        }
        
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
            gameOverScreen.style.display = ''; // Clear inline display style
        }
        document.getElementById('finalScore').textContent = this.score;
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

// Make FlappyBird class globally accessible
window.FlappyBird = FlappyBird;

// Initialize game when the window loads
let game;
let gameInitialized = false;

function initializeGame() {
    if (gameInitialized) {
        console.log('Game already initialized, skipping...');
        return;
    }
    
    console.log('Initializing game...');
    try {
        game = new FlappyBird();
        // Make game accessible globally for debugging
        window.flappyBirdGame = game;
        gameInitialized = true;
        console.log('Game initialized successfully!', game);
        // Don't auto-start - let user click the button
    } catch (error) {
        console.error('Error initializing game:', error);
        console.error(error.stack);
    }
}

// Try DOMContentLoaded first (faster)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    // DOM already loaded
    initializeGame();
}

// Also listen for window load as backup
window.addEventListener('load', () => {
    if (!gameInitialized) {
        console.log('Window loaded, game not initialized yet, initializing now...');
        initializeGame();
    }
});
