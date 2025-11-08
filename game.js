class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size (base size, will scale for mobile)
        this.baseWidth = 400;
        this.baseHeight = 600;
        this.setCanvasSize();
        
        // Handle window resize
        window.addEventListener('resize', () => this.setCanvasSize());

        // Game configuration
        this.config = {
            gravity: 0.3,
            flapPower: -5.5,
            gameSpeed: 2,
            pipeWidth: 60,
            pipeGap: 180,
            pipeSpacing: 250, // Fixed spacing between pipes
            groundHeight: 20,
            birdSize: 30
        };

        // Game state
        this.gameRunning = false;
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.animationFrameId = null;
        this.lastTime = 0;
        this.nextPipeX = this.canvas.width; // Track when to create next pipe

        // Bird properties (centered horizontally, only moves vertically)
        this.bird = {
            x: this.canvas.width / 2 - this.config.birdSize / 2,
            y: this.canvas.height / 2,
            width: this.config.birdSize,
            height: this.config.birdSize,
            velocity: 0,
            rotation: 0
        };

        // Pipe properties
        this.pipes = [];

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
        
        // Update bird position if game not running
        if (!this.gameRunning) {
            this.bird.x = this.canvas.width / 2 - this.config.birdSize / 2;
            this.bird.y = this.canvas.height / 2;
        } else {
            // Keep bird centered horizontally during game
            this.bird.x = this.canvas.width / 2 - this.config.birdSize / 2;
        }
        
        // Update next pipe position
        if (this.nextPipeX > this.canvas.width) {
            this.nextPipeX = this.canvas.width;
        }
        
        // Redraw
        this.draw();
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

        // Button listeners
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.startGame());
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
        this.gameRunning = true;
        this.score = 0;
        this.bird = {
            x: this.canvas.width / 2 - this.config.birdSize / 2,
            y: this.canvas.height / 2,
            width: this.config.birdSize,
            height: this.config.birdSize,
            velocity: 0,
            rotation: 0
        };
        this.pipes = [];
        this.nextPipeX = this.canvas.width;
        this.lastTime = performance.now();
        
        // Hide screens
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        // Cancel any existing animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Start the game loop
        this.gameLoop();
    }

    flap() {
        if (this.gameRunning) {
            this.bird.velocity = this.config.flapPower;
        }
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

        // Update bird physics
        this.bird.velocity += this.config.gravity;
        this.bird.y += this.bird.velocity * (deltaTime / 16.67); // Normalize to 60fps

        // Calculate bird rotation based on velocity (max 30 degrees)
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 30);

        // Create new pipes at fixed intervals
        if (this.nextPipeX <= this.canvas.width - this.config.pipeSpacing) {
            this.createPipe();
            this.nextPipeX = this.canvas.width;
        }

        // Update pipes
        const moveDistance = this.config.gameSpeed * (deltaTime / 16.67);
        this.pipes.forEach(pipe => {
            pipe.x -= moveDistance;
        });

        // Update next pipe position
        this.nextPipeX -= moveDistance;

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

        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pipes with caps
        this.ctx.fillStyle = '#228B22';
        this.pipes.forEach(pipe => {
            // Top pipe
            this.ctx.fillRect(pipe.x, 0, this.config.pipeWidth, pipe.topHeight);
            // Top pipe cap
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, this.config.pipeWidth + 10, 20);
            
            // Bottom pipe
            const bottomY = this.canvas.height - pipe.bottomHeight - this.config.groundHeight;
            this.ctx.fillRect(pipe.x, bottomY, this.config.pipeWidth, pipe.bottomHeight);
            // Bottom pipe cap
            this.ctx.fillRect(pipe.x - 5, bottomY, this.config.pipeWidth + 10, 20);
        });

        // Draw ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - this.config.groundHeight, this.canvas.width, this.config.groundHeight);
        
        // Ground grass line
        this.ctx.strokeStyle = '#6B8E23';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - this.config.groundHeight);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - this.config.groundHeight);
        this.ctx.stroke();

        // Draw bird with rotation
        this.ctx.save();
        this.ctx.translate(
            this.bird.x + this.bird.width / 2,
            this.bird.y + this.bird.height / 2
        );
        this.ctx.rotate((this.bird.rotation * Math.PI) / 180);
        
        // Bird body (yellow)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.bird.width / 2, this.bird.height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird wing
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.ellipse(-5, 0, 8, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird eye
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(5, -5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird beak
        this.ctx.fillStyle = '#FF6347';
        this.ctx.beginPath();
        this.ctx.moveTo(this.bird.width / 2 - 2, 0);
        this.ctx.lineTo(this.bird.width / 2 + 5, -3);
        this.ctx.lineTo(this.bird.width / 2 + 5, 3);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();

        // Draw score with better styling
        this.ctx.fillStyle = '#FFF';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 28px Arial';
        const scoreText = this.score.toString();
        this.ctx.strokeText(scoreText, this.canvas.width / 2 - this.ctx.measureText(scoreText).width / 2, 40);
        this.ctx.fillText(scoreText, this.canvas.width / 2 - this.ctx.measureText(scoreText).width / 2, 40);

        // Draw high score
        if (this.highScore > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.font = 'bold 16px Arial';
            const highScoreText = `Best: ${this.highScore}`;
            this.ctx.strokeText(highScoreText, this.canvas.width / 2 - this.ctx.measureText(highScoreText).width / 2, 70);
            this.ctx.fillText(highScoreText, this.canvas.width / 2 - this.ctx.measureText(highScoreText).width / 2, 70);
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
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

// Initialize game when the window loads
window.addEventListener('load', () => {
    const game = new FlappyBird();
    // Don't auto-start - let user click the button
});
