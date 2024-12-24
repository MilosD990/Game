"use strict";
class MyGame {
    constructor() {
        this.backgroundX = 0; // Initialize here with 0
        this.enemies = [];
        this.obstacleImages = [];
        this.difficulty = 0; // Difficulty level, controls when to increase enemy speed
        this.lastUpdatedScore = 0; // Track the last score when the difficulty was updated
        this.lastDifficultyIncrease = 0; // Track last score at which difficulty was increased
        this.presents = [];
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // Initialize game state to 'menu' initially
        this.gameState = 'menu';
        // Initialize player properties
        this.player = { x: 100, y: this.canvas.height - 105, width: 53, height: 100, velocityY: 0, onGround: true };
        // Initialize background music
        this.backgroundMusic = new Audio('assets/music.mp3'); // Path to your music file
        this.backgroundMusic.loop = true; // Loop the music
        this.backgroundMusic.volume = 0.2; // Set volume to 50%
        // Initialize jump sound
        this.jumpSound = new Audio('assets/jump.mp3'); // Load the jump sound
        this.jumpSound.volume = 0.5; // Set volume to 50% (you can adjust this)
        // Initialize jump sound
        this.collectSound = new Audio('assets/collect.mp3'); // Load the jump sound
        this.collectSound.volume = 0.5; // Set volume to 50% (you can adjust this)
        // Initialize images
        this.playerImage = new Image();
        this.playerImage.src = 'assets/player.png'; // Path to the player image
        this.enemyImage = new Image();
        this.enemyImage.src = 'assets/Obstacle1.png'; // Path to the enemy image
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'assets/background.png'; // Path to the background image
        this.staticBackgroundImage = new Image();
        this.staticBackgroundImage.src = 'assets/static_background.png'; // Path to the background image
        // Load the present image
        this.presentImage = new Image();
        this.presentImage.src = 'assets/present.png'; // Path to your present image
        // Load three types of obstacle images
        this.obstacleImages[0] = new Image();
        this.obstacleImages[0].src = 'assets/Obstacle1.png'; // First obstacle image
        this.obstacleImages[1] = new Image();
        this.obstacleImages[1].src = 'assets/Obstacle2.png'; // Second obstacle image
        this.obstacleImages[2] = new Image();
        this.obstacleImages[2].src = 'assets/Obstacle3.png'; // Third obstacle image
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
        this.presentSpawnInterval = 10000;
        this.lastPresentSpawnTime = Date.now();
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
        this.backgroundMusic.play(); // Start the music when the game begins
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
            this.jumpSound.play(); // Play the jump sound
            setTimeout(() => {
                this.jumpSound.pause(); // Pause the sound
                this.jumpSound.currentTime = 0; // Reset the sound to the start
            }, 500); // 500ms duration
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
        // Spawn presents every 10 seconds
        if (Date.now() - this.lastPresentSpawnTime >= this.presentSpawnInterval) { // 10 seconds
            this.spawnPresent();
            this.lastPresentSpawnTime = Date.now(); // Reset the last spawn time for presents
        }
        // Update presents
        this.updatePresents();
        // Check for collisions between player and enemies
        this.checkCollisions();
        // Increase difficulty every 5 score points
        this.adjustDifficulty();
    }
    updatePresents() {
        for (let i = 0; i < this.presents.length; i++) {
            const present = this.presents[i];
            // Move the present towards the player
            present.x -= present.velocityX;
            if (present.x + present.width < 0) {
                // Remove the present if it goes off the screen
                this.presents.splice(i, 1);
                i--;
            }
        }
    }
    adjustDifficulty() {
        const scoreThreshold = 5; // Increase difficulty every 5 points
        // Only increase speed once per threshold (5, 10, 15, ...)
        if (this.score >= scoreThreshold && this.score % scoreThreshold === 0 && this.score !== this.lastDifficultyIncrease) {
            this.lastDifficultyIncrease = this.score; // Update the last difficulty increase
            // Increase the difficulty level (used for spawning new enemies)
            this.difficulty += 1;
            this.spawnInterval -= this.spawnInterval * 0.2;
        }
    }
    updateEnemies() {
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            // Move each enemy based on its velocityX
            enemy.x -= enemy.velocityX;
            if (enemy.x + enemy.width < 0) {
                // Increment the score when an enemy exits the screen
                this.score += 1;
                // Remove the enemy from the array after it exits the screen
                this.enemies.splice(i, 1);
                i--; // Adjust the index to account for the removal
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
        // Draw the background
        this.ctx.drawImage(this.staticBackgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        // Draw the player
        this.ctx.drawImage(this.playerImage, this.player.x, this.player.y, this.player.width, this.player.height);
        // Draw each enemy with the correct image
        for (let enemy of this.enemies) {
            this.ctx.drawImage(enemy.obstacleImage, enemy.x, enemy.y, enemy.width, enemy.height);
        }
        // Draw each present
        for (let present of this.presents) {
            this.ctx.drawImage(this.presentImage, present.x, present.y, present.width, present.height);
        }
        // Draw the score
        this.ctx.fillText('Score: ' + this.score, 10, 30);
        // Draw the high score
        this.ctx.fillText('High Score: ' + this.highScore, 10, 60);
    }
    spawnEnemy() {
        const enemyWidth = 70;
        const enemyHeight = 115;
        const spawnY = this.canvas.height - 110 - enemyHeight; // Just above the ground level
        // Randomly select an obstacle type (0, 1, or 2)
        const randomObstacleIndex = Math.floor(Math.random() * 3);
        // Calculate enemy speed based on the difficulty
        const enemySpeed = 5 + this.difficulty; // Increase speed based on difficulty level
        // Spawn the enemy just off the right side of the canvas
        this.enemies.push({
            x: this.canvas.width,
            y: spawnY,
            width: enemyWidth,
            height: enemyHeight,
            velocityX: enemySpeed,
            obstacleImage: this.obstacleImages[randomObstacleIndex] // Random obstacle image
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
        // Check for collision with presents
        for (let i = 0; i < this.presents.length; i++) {
            const present = this.presents[i];
            if (this.player.x < present.x + present.width &&
                this.player.x + this.player.width > present.x &&
                this.player.y < present.y + present.height &&
                this.player.y + this.player.height > present.y) {
                // If collision with present, add score and remove present
                this.score += 10;
                this.presents.splice(i, 1);
                i--; // Adjust index after removal
                this.collectSound.play();
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
        this.ctx.fillText('Game Over!', this.canvas.width / 2 - 160, this.canvas.height / 2 - 40);
        // Display Final Score
        this.ctx.font = '20px "Press Start 2P", cursive';
        this.ctx.fillText('Final Score: ' + this.score, this.canvas.width / 2 - 160, this.canvas.height / 2);
        // Display High Score
        this.ctx.fillText('High Score: ' + this.highScore, this.canvas.width / 2 - 160, this.canvas.height / 2 + 40);
        // Display Restart instructions
        this.ctx.font = '18px "Press Start 2P", cursive';
        this.ctx.fillText('Press "R" to Restart', this.canvas.width / 2 - 160, this.canvas.height / 2 + 80);
        this.sendScoreToGoogleSheets();
        console.log('Game Over screen displayed. Preparing to redirect...');
    }
    displayPaused() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = '40px "Press Start 2P", cursive';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('PAUSED', this.canvas.width / 2 - 110, this.canvas.height / 2);
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
        this.ctx.font = '20px "Press Start 2P", cursive';
        this.ctx.fillStyle = 'white';
        // Draw the background
        this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        // Draw the background
        this.ctx.drawImage(this.staticBackgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        // Create a gray background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Display start prompt text
        this.ctx.font = '20px "Press Start 2P", cursive';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Press "A" or "D" to move left or right.', this.canvas.width / 2 - 240, this.canvas.height / 2 + 60);
        this.ctx.fillText('Press "Space" to jump.', this.canvas.width / 2 - 240, this.canvas.height / 2 + 40);
        this.ctx.fillText('Press "P" to pause.', this.canvas.width / 2 - 240, this.canvas.height / 2 + 20);
        this.ctx.fillText('Jump over the building for +1 point,', this.canvas.width / 2 - 240, this.canvas.height / 2);
        this.ctx.fillText('Collect presents for +10 points.', this.canvas.width / 2 - 240, this.canvas.height / 2 - 20);
        this.ctx.fillText('Press "Enter" to Start', this.canvas.width / 2 - 240, this.canvas.height / 2 - 40);
        // Display "Enter Your Name" prompt
        this.ctx.fillText('Enter Your Name:', this.canvas.width / 2 - 240, this.canvas.height / 2 - 60);
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
        nameInput.style.left = `${rect.left + this.canvas.width / 2 - 100} px`; // Centered horizontally
        nameInput.style.top = `${rect.top + this.canvas.height / 2 + 50} px`; // Positioned below the prompt
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
        this.lastPresentSpawnTime = Date.now();
        this.difficulty = 0;
        this.spawnInterval = 3000;
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
        const url = 'https://script.google.com/macros/s/AKfycbxBsw2oZmXG0nkpw_pxn0BLCuuWXTLFytCqGxWXbsGxyal71kX3B4Z3bEfhZnKRr8AE/exec'; // Replace with your deployed Google Apps Script URL
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
    spawnPresent() {
        const presentWidth = 50;
        const presentHeight = 50;
        const randomHeight = Math.random() * (450 - 100) + 100;
        this.presents.push({
            x: this.canvas.width,
            y: randomHeight,
            width: presentWidth,
            height: presentHeight,
            velocityX: 10, // Move towards player at velocity 15
        });
    }
}
// Initialize the game
const game = new MyGame();
