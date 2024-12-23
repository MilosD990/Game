"use strict";
class MyGame {
    constructor() {
        this.backgroundX = 0; // Initialize here with 0
        this.enemies = [];
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // Initialize game state to 'menu' initially
        this.gameState = 'menu';
        // Initialize player properties
        this.player = { x: 100, y: this.canvas.height - 105, width: 53, height: 100, velocityY: 0, onGround: true };
        // Initialize images
        this.playerImage = new Image();
        this.playerImage.src = 'assets/player.png'; // Path to the player image
        this.enemyImage = new Image();
        this.enemyImage.src = 'assets/enemy.png'; // Path to the enemy image
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'assets/background.jpg'; // Path to the background image
        // Initialize game state
        this.score = 0;
        this.gravity = 0.5;
        this.jumpPower = -15;
        this.gameOver = false; // Initially, the game is not over
        this.paused = false; // Initially, the game is not paused
        this.highScore = this.loadHighScore(); // Load the high score from localStorage
        this.playerName = ''; // Default player name
        // Key states
        this.keys = { space: false, left: false, right: false };
        // Spawn interval and tracking the last spawn time
        this.spawnInterval = 3000; // Spawn enemy every 3 seconds
        this.lastSpawnTime = Date.now();
        // Bind input event listeners
        this.setupInput();
        // Start the game loop
        this.gameLoop();
    }
    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' && this.player.onGround && this.gameState === 'game' && !this.gameOver && !this.paused) {
                this.keys.space = true;
            }
            if (e.key === 'a' && this.gameState === 'game' && !this.gameOver && !this.paused) {
                this.keys.left = true;
            }
            if (e.key === 'd' && this.gameState === 'game' && !this.gameOver && !this.paused) {
                this.keys.right = true;
            }
            if (e.key === 'r' && this.gameOver) {
                this.resetGame(); // Reset game when "R" key is pressed after game over
            }
            if (e.key === 'p' && this.gameState === 'game') {
                this.togglePause(); // Toggle pause when "P" key is pressed
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
    gameLoop() {
        if (this.gameState === 'menu') {
            this.displayMenu();
            return; // Stop the game loop if in the menu state
        }
        if (this.gameOver) {
            this.displayGameOver();
            return; // Stop the game loop if game over
        }
        if (this.paused) {
            this.displayPaused();
            return; // Stop the game loop if paused
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    update() {
        // Update background scrolling
        this.backgroundX -= 2;
        if (this.backgroundX <= -this.canvas.width) {
            this.backgroundX = 0;
        }
        // Handle jumping
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
        // Handle left/right movement
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
        // Update and check for enemies
        this.updateEnemies();
        // Spawn enemies at regular intervals
        if (Date.now() - this.lastSpawnTime >= this.spawnInterval) {
            this.spawnEnemy();
            this.lastSpawnTime = Date.now();
        }
        // Check for collisions between player and enemies
        this.checkCollisions();
    }
    updateEnemies() {
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            enemy.x -= 5; // Move the enemy to the left
            if (enemy.x + enemy.width < 0) {
                // Increment the score when an enemy exits the screen
                this.score += 1;
                // Remove the enemy from the array
                this.enemies.splice(i, 1);
                i--; // Adjust index after removal to prevent skipping next enemy
            }
        }
    }
    draw() {
        // Set the pixelated font
        this.ctx.font = '20px "Press Start 2P", cursive';
        this.ctx.fillStyle = 'white';
        // Draw the background
        this.ctx.drawImage(this.backgroundImage, this.backgroundX, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.backgroundImage, this.backgroundX + this.canvas.width, 0, this.canvas.width, this.canvas.height);
        // Draw the player
        this.ctx.drawImage(this.playerImage, this.player.x, this.player.y, this.player.width, this.player.height);
        // Draw each enemy
        for (let enemy of this.enemies) {
            this.ctx.drawImage(this.enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        }
        // Draw the score
        this.ctx.fillText('Score: ' + this.score, 10, 30);
        // Draw the high score
        this.ctx.fillText('High Score: ' + this.highScore, 10, 60);
    }
    spawnEnemy() {
        const enemyWidth = 40;
        const enemyHeight = 40;
        const spawnY = this.canvas.height - 110 - enemyHeight; // Just above the ground level
        // Spawn the enemy just off the right side of the canvas
        this.enemies.push({
            x: this.canvas.width,
            y: spawnY,
            width: enemyWidth,
            height: enemyHeight,
            velocityX: 5, // Speed at which the enemy moves
        });
    }
    checkCollisions() {
        for (let enemy of this.enemies) {
            // Check if there's an overlap between the player and the enemy
            if (this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y) {
                // If collision detected, stop the game
                this.gameOver = true;
                this.updateHighScore();
            }
        }
    }
    displayGameOver() {
        // Darken the screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Display Game Over text
        this.ctx.font = '40px "Press Start 2P", cursive';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Game Over!', this.canvas.width / 2 - 100, this.canvas.height / 2);
        // Display Final Score
        this.ctx.font = '20px "Press Start 2P", cursive';
        this.ctx.fillText('Final Score: ' + this.score, this.canvas.width / 2 - 70, this.canvas.height / 2 + 40);
        // Display High Score
        this.ctx.fillText('High Score: ' + this.highScore, this.canvas.width / 2 - 80, this.canvas.height / 2 + 80);
        // Display Restart instructions
        this.ctx.font = '18px "Press Start 2P", cursive';
        this.ctx.fillText('Press "R" to Restart', this.canvas.width / 2 - 85, this.canvas.height / 2 + 120);
        this.sendScoreToGoogleSheets();
        console.log('Game Over screen displayed. Preparing to redirect...');
    }
    displayPaused() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = '40px "Press Start 2P", cursive';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('PAUSED', this.canvas.width / 2 - 70, this.canvas.height / 2);
    }
    changeGameState(state) {
        this.gameState = state;
        if (state === 'game') {
            // Initialize the game state (clear scores, reset player position, etc.)
            this.gameOver = false;
            this.score = 0;
            this.spawnInterval = 3000;
            this.lastSpawnTime = Date.now();
            // Start the game loop
            this.gameLoop();
        }
    }
    displayMenu() {
        // Create a gray background
        this.ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Display start prompt text
        this.ctx.font = '40px "Press Start 2P", cursive';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Press "Enter" to Start', this.canvas.width / 2 - 120, this.canvas.height / 2 - 20);
        // Display "Enter Your Name" prompt
        this.ctx.fillText('Enter Your Name:', this.canvas.width / 2 - 120, this.canvas.height / 2 + 30);
        // Create the text input for the player's name
        const nameInput = document.createElement('input');
        nameInput.id = 'playerName';
        nameInput.type = 'text';
        nameInput.style.position = 'absolute';
        nameInput.style.fontSize = '20px';
        nameInput.style.width = '200px'; // Adjust the width to your preference
        nameInput.style.textAlign = 'center'; // Center text inside input box
        // Get the canvas position on the page
        const rect = this.canvas.getBoundingClientRect();
        // Position the input inside the canvas, centered below the name prompt
        nameInput.style.left = `${rect.left + this.canvas.width / 2 - 100}px`; // Centered horizontally
        nameInput.style.top = `${rect.top + this.canvas.height / 2 + 50}px`; // Positioned below the prompt
        // Append the input field to the document body
        document.body.appendChild(nameInput);
        // Focus the input for user interaction
        nameInput.focus();
        // Listen for the Enter key to start the game and store the name
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.playerName = nameInput.value; // Store the player's name
                document.body.removeChild(nameInput); // Remove the input field from the screen
                this.changeGameState('game'); // Start the game
                e.preventDefault(); // Prevent the default behavior (e.g., form submission)
            }
        });
    }
    loadHighScore() {
        const savedScore = localStorage.getItem('highScore');
        return savedScore ? parseInt(savedScore) : 0;
    }
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore.toString());
        }
    }
    resetGame() {
        // Reset player, enemies, score, and other variables
        this.player = { x: 100, y: this.canvas.height - 105, width: 53, height: 100, velocityY: 0, onGround: true };
        this.enemies = [];
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.lastSpawnTime = Date.now();
        // Restart the game loop
        this.gameLoop();
    }
    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) {
            this.gameLoop(); // Restart the loop when unpaused
        }
    }
    startGame() {
        this.gameState = 'game'; // Change game state to 'game'
        this.gameLoop(); // Start the game loop
    }
    sendScoreToGoogleSheets() {
        const url = 'https://script.google.com/macros/s/AKfycbwoFkqhB64-3z_LfyEcoq3uC_jDJre-62CyevoKhbQmH_RhmhYDyTRmfi46s80Aeizf/exec'; // Replace with your deployed Google Apps Script URL
        const data = new URLSearchParams();
        data.append('playerName', this.playerName); // Player name
        data.append('score', this.score.toString()); // Score
        // Send a POST request to the Google Apps Script
        fetch(url, {
            method: 'POST',
            body: data,
        })
            .then(response => response.text())
            .then(result => {
            console.log('Score sent successfully:', result);
        })
            .catch(error => {
            console.error('Error sending score:', error);
        });
    }
}
// Initialize the game
const game = new MyGame();
