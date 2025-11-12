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
        
        // Difficulty modes configuration
        this.difficultyModes = {
            easy: {
                gravity: 0.2,
                gameSpeed: 2
            },
            regular: {
                gravity: 0.3,
                gameSpeed: 2
            },
            insane: {
                gravity: 0.3,
                gameSpeed: 4
            }
        };
        
        // Current difficulty (default to regular)
        this.difficulty = 'regular';
        
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
        
        // Initialize coins array
        this.coins = [];
        
        // Coin images cache
        this.coinImages = {};
        this.coinSprites = {
            'MonedaP': { value: 2, frames: 5, frameWidth: 0, frameHeight: 0, loaded: false },
            'MonedaR': { value: 5, frames: 5, frameWidth: 0, frameHeight: 0, loaded: false },
            'MonedaD': { value: 10, frames: 5, frameWidth: 0, frameHeight: 0, loaded: false }
        };
        
        // Load coin images
        this.loadCoinImages();
        
        // Background layers for parallax scrolling
        this.backgroundLayers = [];
        this.backgroundScrollPositions = [];
        this.loadBackgroundImages();
        
        // Game state (initialize early)
        this.gameRunning = false;
        this.gameStarted = false; // Track if player has made first flap
        this.score = 0;
        this.coinsCollected = 0; // Total coin value collected
        this.pipeCount = 0; // Track number of pipes created for difficulty-based coin spawning
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
                }
                // Don't auto-start from start screen - user must select difficulty
            }
        });

        // Mouse/touch controls - only flap during game
        this.canvas.addEventListener('click', () => {
            if (this.gameRunning) {
                this.flap();
            }
            // Don't auto-start from start screen - user must select difficulty
        });

        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameRunning) {
                this.flap();
            }
            // Don't auto-start from start screen - user must select difficulty
        });

        // Difficulty button listeners
        const easyButton = document.getElementById('easyButton');
        const regularButton = document.getElementById('regularButton');
        const insaneButton = document.getElementById('insaneButton');
        
        if (easyButton) {
            easyButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Easy button clicked!');
                this.startGame('easy');
            });
        } else {
            console.error('Easy button not found!');
        }
        
        if (regularButton) {
            regularButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Regular button clicked!');
                this.startGame('regular');
            });
        } else {
            console.error('Regular button not found!');
        }
        
        if (insaneButton) {
            insaneButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Insane button clicked!');
                this.startGame('insane');
            });
        } else {
            console.error('Insane button not found!');
        }
        
        // Restart button - uses last selected difficulty
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            console.log('Restart button found, attaching listener');
            restartButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Restart button clicked! Using difficulty:', this.difficulty);
                // Use the last selected difficulty
                this.startGame(this.difficulty);
            });
        } else {
            console.error('Restart button not found!');
        }
        
        // Back button - returns to start menu
        const backButton = document.getElementById('backButton');
        if (backButton) {
            console.log('Back button found, attaching listener');
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Back button clicked!');
                this.returnToStartMenu();
            });
        } else {
            console.error('Back button not found!');
        }
    }

    loadCoinImages() {
        // Load all coin sprite images
        Object.keys(this.coinSprites).forEach(coinType => {
            const img = new Image();
            img.onload = () => {
                this.coinSprites[coinType].loaded = true;
                this.coinImages[coinType] = img;
                // Calculate frame dimensions (sprite sheets are horizontal strips)
                const sprite = this.coinSprites[coinType];
                sprite.frameWidth = img.width / sprite.frames;
                sprite.frameHeight = img.height;
                console.log(`Loaded ${coinType} coin sprite sheet: ${img.width}x${img.height}, ${sprite.frames} frames, frame size: ${sprite.frameWidth}x${sprite.frameHeight}`);
            };
            img.onerror = () => {
                console.error(`Failed to load ${coinType} coin image`);
            };
            img.src = `assets/${coinType}.png`;
        });
    }

    loadBackgroundImages() {
        // Load background layers in order (back to front)
        // Layer numbers indicate depth: higher numbers = further back (slower scroll)
        const layerFiles = [
            'Layer_0011_0.png',  // Furthest back
            'Layer_0010_1.png',
            'Layer_0009_2.png',
            'Layer_0008_3.png',
            'Layer_0007_Lights.png',
            'Layer_0006_4.png',
            'Layer_0005_5.png',
            'Layer_0004_Lights.png',
            'Layer_0003_6.png',
            'Layer_0002_7.png',
            'Layer_0001_8.png',
            'Layer_0000_9.png'   // Closest
        ];
        
        let loadedCount = 0;
        layerFiles.forEach((filename, index) => {
            const img = new Image();
            img.onload = () => {
                this.backgroundLayers[index] = img;
                this.backgroundScrollPositions[index] = 0;
                loadedCount++;
                console.log(`Loaded background layer ${index}: ${filename}`);
            };
            img.onerror = () => {
                console.error(`Failed to load background layer: ${filename}`);
            };
            img.src = `assets/background/${filename}`;
        });
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
            // High score is now saved based on grand total (calculated in gameOver)
            localStorage.setItem('flappyBirdHighScore', this.highScore.toString());
        } catch (e) {
            // Ignore localStorage errors
        }
    }

    startGame(difficulty = 'regular') {
        console.log('startGame() called with difficulty:', difficulty);
        try {
            // Validate and set difficulty
            if (this.difficultyModes[difficulty]) {
                this.difficulty = difficulty;
                // Apply difficulty settings to config
                const mode = this.difficultyModes[difficulty];
                this.config.gravity = mode.gravity;
                this.config.gameSpeed = mode.gameSpeed;
            } else {
                console.warn('Invalid difficulty, using regular');
                this.difficulty = 'regular';
                const mode = this.difficultyModes.regular;
                this.config.gravity = mode.gravity;
                this.config.gameSpeed = mode.gameSpeed;
            }
            
            this.gameRunning = true;
            this.gameStarted = false; // Reset - game starts on first flap
            this.score = 0;
            this.coinsCollected = 0; // Reset coin count
            this.pipeCount = 0; // Reset pipe counter
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
            this.coins = []; // Reset coins array
            this.lastTime = performance.now();
            
            // Don't create first pipe until game actually starts (first flap)
            
            // Hide screens
            const startScreen = document.getElementById('startScreen');
            const gameOverScreen = document.getElementById('gameOverScreen');
            const backButton = document.getElementById('backButton');
            
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
            
            // Show back button during gameplay
            if (backButton) {
                backButton.classList.remove('hidden');
                backButton.style.display = '';
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
        
        const pipe = {
            x: this.canvas.width,
            topHeight: topHeight,
            bottomHeight: this.canvas.height - topHeight - this.config.pipeGap - this.config.groundHeight,
            scored: false
        };
        
        this.pipes.push(pipe);
        this.pipeCount++; // Increment pipe counter
        
        // Spawn coins based on difficulty
        if (this.difficulty === 'easy') {
            // Easy: 1 coin every other pipe (centered, not randomized)
            if (this.pipeCount % 2 === 0) {
                this.createCoin(pipe, 0, false); // No randomization for easy mode
            }
        } else if (this.difficulty === 'regular') {
            // Regular: 1 coin between every pipe (randomized position)
            this.createCoin(pipe, 0, true); // Randomize position
        } else if (this.difficulty === 'insane') {
            // Insane: 2 coins between every pipe (both randomized)
            this.createCoin(pipe, 0, true); // First coin, randomized
            this.createCoin(pipe, 0, true);  // Second coin, randomized
        }
    }

    createCoin(pipe, yOffset = 0, randomizePosition = false) {
        // Randomly select coin type
        const coinTypes = ['MonedaP', 'MonedaR', 'MonedaD'];
        const weights = [0.5, 0.3, 0.2]; // Higher chance for lower value coins
        let rand = Math.random();
        let coinType = coinTypes[0];
        
        if (rand < weights[0]) {
            coinType = coinTypes[0]; // MonedaP (2 coins)
        } else if (rand < weights[0] + weights[1]) {
            coinType = coinTypes[1]; // MonedaR (5 coins)
        } else {
            coinType = coinTypes[2]; // MonedaD (10 coins)
        }
        
        // Position coin in the gap between pipes
        const gapTop = pipe.topHeight;
        const gapBottom = gapTop + this.config.pipeGap;
        let coinY;
        
        if (randomizePosition) {
            // Randomize position within the gap (leave some margin for coin size)
            const coinSize = 25;
            const margin = coinSize / 2;
            const availableHeight = gapBottom - gapTop - coinSize;
            coinY = gapTop + margin + Math.random() * availableHeight + yOffset;
        } else {
            // Center of gap with optional offset (for easy mode or fixed positioning)
            coinY = gapTop + (gapBottom - gapTop) / 2 + yOffset;
        }
        
        // Coin size
        const coinSize = 25;
        
        this.coins.push({
            x: pipe.x + this.config.pipeWidth + 20, // Slightly after the pipe
            y: coinY,
            width: coinSize,
            height: coinSize,
            type: coinType,
            value: this.coinSprites[coinType].value,
            collected: false,
            animationFrame: 0,
            spriteFrame: 0, // Current frame in sprite sheet
            rotation: 0
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
            
            // Update background scroll positions (parallax effect)
            // Further layers scroll slower for depth effect
            this.backgroundLayers.forEach((layer, index) => {
                if (layer && layer.complete && layer.width) {
                    // Calculate parallax speed: further layers (higher index) scroll slower
                    // Layer 0 (furthest) scrolls at 0.1x speed, layer 11 (closest) scrolls at 0.9x speed
                    const parallaxSpeed = 0.1 + (index / Math.max(this.backgroundLayers.length - 1, 1)) * 0.8;
                    
                    // Scale factor to match drawing scale
                    const scaleY = this.canvas.height / layer.height;
                    const scaledWidth = layer.width * scaleY;
                    
                    // Update scroll position (scroll right to left, same direction as pipes)
                    // Add to create a counter that increases, which we'll use to read from source
                    this.backgroundScrollPositions[index] = (this.backgroundScrollPositions[index] || 0) + moveDistance * parallaxSpeed;
                    
                    // Reset position when layer scrolls completely off screen (seamless loop)
                    if (this.backgroundScrollPositions[index] >= scaledWidth) {
                        this.backgroundScrollPositions[index] -= scaledWidth;
                    }
                }
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

            // Update coins
            const moveDistance = this.config.gameSpeed * (deltaTime / 16.67);
            this.coins.forEach(coin => {
                if (!coin.collected) {
                    coin.x -= moveDistance;
                    // Animate coin (sprite sheet animation and floating)
                    coin.animationFrame += deltaTime / 16.67;
                    // Update sprite frame (animate through sprite sheet frames)
                    const sprite = this.coinSprites[coin.type];
                    if (sprite && sprite.frames > 1) {
                        coin.spriteFrame = Math.floor((coin.animationFrame * 0.15) % sprite.frames);
                    }
                    // Store original Y for floating animation
                    if (coin.originalY === undefined) {
                        coin.originalY = coin.y;
                    }
                    coin.y = coin.originalY + Math.sin(coin.animationFrame * 0.1) * 3; // Float up and down
                }
            });

            // Remove off-screen or collected coins
            this.coins = this.coins.filter(coin => coin.x > -coin.width && !coin.collected);

            // Update score
            this.pipes.forEach(pipe => {
                if (pipe.x + this.config.pipeWidth < this.bird.x && !pipe.scored) {
                    this.score++;
                    pipe.scored = true;
                }
            });

            // Check coin collection
            this.checkCoinCollection();

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

    checkCoinCollection() {
        for (const coin of this.coins) {
            if (coin.collected) continue;
            
            // Check if bird collides with coin using bounding box collision
            const birdLeft = this.bird.x;
            const birdRight = this.bird.x + this.bird.width;
            const birdTop = this.bird.y;
            const birdBottom = this.bird.y + this.bird.height;
            
            const coinLeft = coin.x;
            const coinRight = coin.x + coin.width;
            const coinTop = coin.y;
            const coinBottom = coin.y + coin.height;
            
            // Check for overlap
            if (birdRight > coinLeft && birdLeft < coinRight &&
                birdBottom > coinTop && birdTop < coinBottom) {
                coin.collected = true;
                this.coinsCollected += coin.value;
                console.log(`Collected ${coin.type} worth ${coin.value} coins! Total: ${this.coinsCollected}`);
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw scrolling background layers (parallax effect)
        this.backgroundLayers.forEach((layer, index) => {
            if (layer && layer.complete && layer.width) {
                let scrollPos = this.backgroundScrollPositions[index] || 0;
                
                // Scale factor to fit layer to canvas height
                const scaleY = this.canvas.height / layer.height;
                const scaledWidth = layer.width * scaleY;
                const canvasWidthInSource = this.canvas.width / scaleY;
                
                // Convert scroll position to source image coordinates
                let scrollPosInSource = (scrollPos % scaledWidth) / scaleY;
                
                // For right-to-left scrolling: read from further right in source as scrollPos increases
                // This creates leftward visual movement (content moves from right to left on screen)
                // When scrollPos = 0: read from rightmost part (layer.width - canvasWidthInSource)
                // As scrollPos increases: read from further right (sourceX increases)
                let sourceX = (layer.width - canvasWidthInSource + scrollPosInSource) % layer.width;
                
                // Calculate how much we can read from sourceX
                const remainingInSource = layer.width - sourceX;
                const firstPartSourceWidth = Math.min(remainingInSource, canvasWidthInSource);
                const firstPartCanvasWidth = firstPartSourceWidth * scaleY;
                
                // Draw first part (from sourceX to end of layer)
                if (firstPartCanvasWidth > 0 && firstPartSourceWidth > 0) {
                    this.ctx.drawImage(
                        layer,
                        sourceX, 0,
                        firstPartSourceWidth, layer.height,
                        0, 0,
                        firstPartCanvasWidth, this.canvas.height
                    );
                }
                
                // Draw second part (from beginning of layer) if needed for seamless loop
                if (firstPartCanvasWidth < this.canvas.width) {
                    const secondPartCanvasWidth = this.canvas.width - firstPartCanvasWidth;
                    const secondPartSourceWidth = secondPartCanvasWidth / scaleY;
                    if (secondPartSourceWidth > 0) {
                        this.ctx.drawImage(
                            layer,
                            0, 0,
                            secondPartSourceWidth, layer.height,
                            firstPartCanvasWidth, 0,
                            secondPartCanvasWidth, this.canvas.height
                        );
                    }
                }
            }
        });
        
        // Fallback: solid color if background not loaded
        if (this.backgroundLayers.length === 0 || !this.backgroundLayers[0] || !this.backgroundLayers[0].complete) {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#5B9BD5');
            gradient.addColorStop(1, '#B0D4E6');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

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

        // Draw coins
        if (this.coins && Array.isArray(this.coins)) {
            this.coins.forEach(coin => {
                if (coin.collected) return;
                
                const coinImg = this.coinImages[coin.type];
                const sprite = this.coinSprites[coin.type];
                if (coinImg && sprite && sprite.loaded) {
                    this.ctx.save();
                    const coinX = Math.round(coin.x);
                    const coinY = Math.round(coin.y);
                    
                    // Draw specific frame from sprite sheet
                    const frameX = sprite.frameWidth * coin.spriteFrame;
                    this.ctx.drawImage(
                        coinImg,
                        frameX, 0, // Source position in sprite sheet
                        sprite.frameWidth, sprite.frameHeight, // Source size
                        coinX, coinY, // Destination position
                        coin.width, coin.height // Destination size
                    );
                    
                    this.ctx.restore();
                } else {
                    // Fallback: draw colored circle if image not loaded
                    this.ctx.save();
                    this.ctx.fillStyle = coin.type === 'MonedaP' ? '#FFD700' : 
                                        coin.type === 'MonedaR' ? '#FF6B6B' : '#4ECDC4';
                    this.ctx.beginPath();
                    this.ctx.arc(
                        Math.round(coin.x + coin.width / 2),
                        Math.round(coin.y + coin.height / 2),
                        coin.width / 2,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                    this.ctx.restore();
                }
            });
        }

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

        // Draw pipe score (centered)
        this.ctx.fillStyle = '#FFF';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.font = 'bold 28px Bitmgothic, Arial, sans-serif';
        const scoreText = this.score.toString();
        const scoreX = Math.round(this.canvas.width / 2 - this.ctx.measureText(scoreText).width / 2);
        this.ctx.strokeText(scoreText, scoreX, 40);
        this.ctx.fillText(scoreText, scoreX, 40);

        // Draw coin count (always visible, top-left)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.font = 'bold 18px Bitmgothic, Arial, sans-serif';
        const coinText = `💰 Coins: ${this.coinsCollected}`;
        const coinX = Math.round(20);
        const coinY = 70; // Position below the pipe score
        this.ctx.strokeText(coinText, coinX, coinY);
        this.ctx.fillText(coinText, coinX, coinY);

        // Draw high score (pixel art style, centered below pipe score)
        if (this.highScore > 0) {
            this.ctx.fillStyle = '#FFC800';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.font = 'bold 16px Bitmgothic, Arial, sans-serif';
            const highScoreText = `Best: ${this.highScore}`;
            const highScoreX = Math.round(this.canvas.width / 2 - this.ctx.measureText(highScoreText).width / 2);
            const highScoreY = 100; // Position below coin counter to avoid overlap
            this.ctx.strokeText(highScoreText, highScoreX, highScoreY);
            this.ctx.fillText(highScoreText, highScoreX, highScoreY);
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
        
        // Calculate grand total (pipes + coins)
        const grandTotal = this.score + this.coinsCollected;
        
        // Update high score (based on grand total)
        if (grandTotal > this.highScore) {
            this.highScore = grandTotal;
            this.saveHighScore();
        }
        
        // Update game over screen displays
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore;
        }
        
        const finalScoreElement = document.getElementById('finalScore');
        if (finalScoreElement) {
            finalScoreElement.textContent = this.score;
        }
        
        const finalCoinsElement = document.getElementById('finalCoins');
        if (finalCoinsElement) {
            finalCoinsElement.textContent = this.coinsCollected;
        }
        
        const grandTotalElement = document.getElementById('grandTotal');
        if (grandTotalElement) {
            grandTotalElement.textContent = grandTotal;
        }
        
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
            gameOverScreen.style.display = ''; // Clear inline display style
        }
        
        // Hide back button on game over
        const backButton = document.getElementById('backButton');
        if (backButton) {
            backButton.classList.add('hidden');
            backButton.style.display = 'none';
        }
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    returnToStartMenu() {
        // Hide game over screen
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
            gameOverScreen.style.display = 'none';
        }
        
        // Hide back button
        const backButton = document.getElementById('backButton');
        if (backButton) {
            backButton.classList.add('hidden');
            backButton.style.display = 'none';
        }
        
        // Show start screen
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.classList.remove('hidden');
            startScreen.style.display = '';
        }
        
        // Reset game state
        this.gameRunning = false;
        this.gameStarted = false;
        this.pipes = [];
        
        // Reset bird position
        if (this.bird) {
            this.bird.x = this.canvas.width / 2 - this.config.birdSize / 2;
            this.bird.y = this.canvas.height / 2;
            this.bird.velocity = 0;
            this.bird.rotation = 0;
        }
        
        // Redraw
        this.draw();
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
