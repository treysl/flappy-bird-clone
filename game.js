class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 400;
        this.canvas.height = 600;

        // Game state
        this.gameRunning = false;
        this.score = 0;

        // Bird properties
        this.bird = {
            x: 180,
            y: 200,
            width: 30,
            height: 30,
            velocity: 0
        };

        // Pipe properties
        this.pipes = [];
        this.pipeWidth = 50;
        this.pipeGap = 200; // Increased gap for easier navigation
        this.pipeHeight = 400;

        // Game properties
        this.gravity = 0.2;
        this.flapPower = -6;
        this.gameSpeed = 0.5;
        this.birdXCenter = this.canvas.width / 2;

        // Event listeners
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameRunning) {
                this.flap();
            }
        });
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.startGame());

        this.draw();
    }

    startGame() {
        console.log('Starting game...');
        this.gameRunning = true;
        this.score = 0;
        this.bird = {
            x: 180,
            y: 200,
            width: 30,
            height: 30,
            velocity: 0
        };
        this.pipes = [];
        
        // Make sure screens are hidden
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        // Start the game loop
        if (!this.animationFrameId) {
            this.gameLoop();
        }
        
        console.log('Bird initialized at:', this.bird);
    }

    flap() {
        if (this.gameRunning) {
            this.bird.velocity = this.flapPower;
        }
    }

    createPipe() {
        const pipeHeight = Math.random() * (this.canvas.height - this.pipeGap - 100) + 50;
        this.pipes.push({
            x: this.canvas.width,
            topHeight: pipeHeight,
            bottomHeight: this.canvas.height - pipeHeight - this.pipeGap
        });
    }

    update() {
        // Update bird position
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;

        // Create new pipes
        if (Math.random() < 0.01) {
            this.createPipe();
        }

        // Update pipes
        this.pipes.forEach(pipe => {
            pipe.x -= this.gameSpeed;
        });

        // Remove off-screen pipes
        this.pipes = this.pipes.filter(pipe => pipe.x > -this.pipeWidth);

        // Check collisions
        if (this.checkCollision()) {
            this.gameOver();
        }

        // Update score
        this.pipes.forEach(pipe => {
            if (pipe.x + this.pipeWidth < this.bird.x && !pipe.scored) {
                this.score++;
                pipe.scored = true;
            }
        });

        // Reset bird position if it goes off-screen
        if (this.bird.x < 0) {
            this.bird.x = this.canvas.width;
            this.bird.y = 200; // Reset to starting height
            this.bird.velocity = 0;
            this.score = 0;
            this.pipes = [];
        }
    }

    checkCollision() {
        // Check ground collision
        if (this.bird.y + this.bird.height > this.canvas.height) {
            return true;
        }

        // Check pipe collision
        for (const pipe of this.pipes) {
            if (this.bird.x + this.bird.width > pipe.x &&
                this.bird.x < pipe.x + this.pipeWidth &&
                ((this.bird.y < pipe.topHeight) ||
                 (this.bird.y + this.bird.height > pipe.topHeight + this.pipeGap))) {
                return true;
            }
        }

        return false;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw bird with better visibility
        this.ctx.fillStyle = '#FF0000';  // Bright red for better visibility
        this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);
        // Add eye to make the bird more visible
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x + 20, this.bird.y + 10, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Debug: Draw bird's position
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Bird: ${Math.round(this.bird.x)},${Math.round(this.bird.y)}`, 10, 50);

        // Draw pipes
        this.ctx.fillStyle = '#228B22';
        this.pipes.forEach(pipe => {
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            this.ctx.fillRect(pipe.x, pipe.topHeight + this.pipeGap, this.pipeWidth, pipe.bottomHeight);
        });

        // Draw ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);

        // Draw score
        this.ctx.fillStyle = '#000';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    }

    gameLoop() {
        if (this.gameRunning) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    gameOver() {
        this.gameRunning = false;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
    }
}

// Initialize game when the window loads
window.onload = function() {
    const game = new FlappyBird();
    // Start the game loop
    game.startGame();
};
