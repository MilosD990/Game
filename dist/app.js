"use strict";
class MyGame {
    constructor() {
        this.backgroundX = 0;
        this.enemies = [];
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // Initialize images
        this.playerImage = new Image();
        this.enemyImage = new Image();
        this.backgroundImage = new Image();
        // Game state variables
        this.score = 0;
        this.gravity = 0.5;
        this.jumpPower = -15;
        this.gameOver = false;
        this.paused = false;
        this.highScore = this.loadHighScore();
        this.playerName = '';
        this.spawnInterval = 3000;
        this.lastSpawnTime = Date.now();
        this.gameStarted = false; // Game starts as false
        this.gameState = 'menu'; // Set the initial game state to 'menu'
        // Initialize key states
        this.keys = { space: false, left: false, right: false, start: false };
        // Setup input event listeners
        this.setupInput();
        // Show the menu screen initially
        this.gameLoop();
    }
    showMenu() {
        // Display the menu screen with "Press 'S' to start" message
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = '30px "Press Start 2P", cursive';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText("Press 'S' to start", this.canvas.width / 2 - 120, this.canvas.height / 2);
        // Only start the game when 'S' is pressed
        if (this.keys.start) {
            this.startGame();
        }
    }
    startGame() {
        // Transition to game state
        this.gameState = 'game';
        this.gameStarted = true;
        this.resetGame();
    }
    resetGame() {
        // Initialize player and other game elements
        this.player = { x: 100, y: this.canvas.height - 105, width: 53, height: 100, velocityY: 0, onGround: true };
        this.enemies = [];
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.lastSpawnTime = Date.now();
    }
    gameLoop() {
        // Clear the canvas and update the game based on the current state
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.gameState === 'menu') {
            this.showMenu();
        }
        else if (this.gameState === 'game') {
            this.update();
            this.draw();
        }
        else if (this.gameState === 'paused') {
            this.displayPaused();
        }
        else if (this.gameState === 'gameOver') {
            this.displayGameOver();
        }
        requestAnimationFrame(() => this.gameLoop());
    }
    update() {
        // Background scrolling logic
        this.backgroundX -= 2;
        if (this.backgroundX <= -this.canvas.width) {
            this.backgroundX = 0;
        }
        // Handle player jumping
        if (this.keys.space && this.player.onGround) {
            this.player.velocityY = this.jumpPower;
            this.player.onGround = false;
        }
        // Apply gravity
        if (!this.player.onGround) {
            this.player.velocityY += this.gravity;
        }
        // Update player position
        this.player.y += this.player.velocityY;
        if (this.player.y >= this.canvas.height - this.player.height - 105) {
            this.player.y = this.canvas.height - this.player.height - 105;
            this.player.velocityY = 0;
            this.player.onGround = true;
        }
        // Handle left and right movement
        if (this.keys.left) {
            this.player.x -= 5;
        }
        if (this.keys.right) {
            this.player.x += 5;
        }
        if (this.player.x < 0) {
            this.player.x = 0;
        }
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
        // Update enemies and spawn them
        this.updateEnemies();
        if (Date.now() - this.lastSpawnTime >= this.spawnInterval) {
            this.spawnEnemy();
            this.lastSpawnTime = Date.now();
        }
        // Check for collisions
        this.checkCollisions();
    }
    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' && this.player.onGround && !this.gameOver && !this.paused) {
                this.keys.space = true;
            }
            if (e.key === 'a' && !this.gameOver && !this.paused) {
                this.keys.left = true;
            }
            if (e.key === 'd' && !this.gameOver && !this.paused) {
                this.keys.right = true;
            }
            if (e.key === 's' && !this.gameStarted) {
                this.keys.start = true; // Set start to true when 'S' is pressed
            }
            if (e.key === 'r' && this.gameOver) {
                this.resetGame(); // Reset game when "R" is pressed after game over
            }
            if (e.key === 'p') {
                this.togglePause(); // Toggle pause when "P" is pressed
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === ' ') {
                this.keys.space = false;
            }
            if (e.key === 'a') {
                this.keys.left = false;
            }
            if (e.key === 'd') {
                this.keys.right = false;
            }
        });
    }
    updateEnemies() {
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            enemy.x -= 5;
            if (enemy.x + enemy.width < 0) {
                this.score += 1;
                this.enemies.splice(i, 1);
                i--;
            }
        }
    }
    draw() {
        // Drawing background and player
        this.ctx.drawImage(this.backgroundImage, this.backgroundX, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.backgroundImage, this.backgroundX + this.canvas.width, 0, this.canvas.width, this.canvas.height);
        // Drawing the player
        this.ctx.drawImage(this.playerImage, this.player.x, this.player.y, this.player.width, this.player.height);
        // Drawing enemies
        for (let enemy of this.enemies) {
            this.ctx.drawImage(this.enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        }
        // Draw score and high score
        this.ctx.fillText('Score: ' + this.score, 10, 30);
        this.ctx.fillText('High Score: ' + this.highScore, 10, 60);
    }
    spawnEnemy() {
        const enemyWidth = 40;
        const enemyHeight = 40;
        const spawnY = this.canvas.height - 110 - enemyHeight;
        // Spawn the enemy just off the right side of the canvas
        this.enemies.push({
            x: this.canvas.width,
            y: spawnY,
            width: enemyWidth,
            height: enemyHeight,
            velocityX: 5,
        });
    }
    checkCollisions() {
        for (let enemy of this.enemies) {
            if (this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y) {
                this.gameOver = true;
                this.updateHighScore();
            }
        }
    }
    displayGameOver() {
        // Display Game Over screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = '40px "Press Start 2P", cursive';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Game Over!', this.canvas.width / 2 - 100, this.canvas.height / 2);
        this.ctx.font = '20px "Press Start 2P", cursive';
        this.ctx.fillText('Final Score: ' + this.score, this.canvas.width / 2 - 80, this.canvas.height / 2 + 40);
    }
    displayPaused() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = '40px "Press Start 2P", cursive';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('GAME PAUSED', this.canvas.width / 2 - 70, this.canvas.height / 2);
    }
    togglePause() {
        this.paused = !this.paused;
    }
    loadHighScore() {
        return parseInt(localStorage.getItem('highScore') || '0');
    }
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore.toString());
        }
    }
}
// Initialize the game
const game = new MyGame();
