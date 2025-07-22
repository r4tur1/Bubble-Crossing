document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const gameOverElement = document.getElementById('game-over');
    const finalScoreElement = document.getElementById('final-score');
    const finalHighScoreElement = document.getElementById('final-high-score');
    const restartBtn = document.getElementById('restart-btn');
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const tiltBtn = document.getElementById('tilt-btn');
    const powerupTimer = document.getElementById('powerup-timer');
    const activePowerups = document.getElementById('active-powerups');
    const themeButtons = document.querySelectorAll('.theme-btn');
    
    // Sound elements
    const popSound = document.getElementById('pop-sound');
    const powerupSound = document.getElementById('powerup-sound');
    const gameOverSound = document.getElementById('game-over-sound');
    const themeMusic = document.getElementById('theme-music');
    
    // Game state
    let score = 0;
    let highScore = localStorage.getItem('bubbleHighScore') || 0;
    let gameIsOver = false;
    let player;
    let bubbles = [];
    let obstacles = [];
    let gameLoop;
    let bubbleSpawnInterval;
    let obstacleSpawnInterval;
    let spawnRate = 1000;
    let isTiltMode = false;
    let tiltControlsActive = false;
    
    // Powerups
    const powerups = {
        speed: { active: false, duration: 10000, endTime: 0 },
        multiplier: { active: false, duration: 10000, endTime: 0, value: 2 },
        invincible: { active: false, duration: 8000, endTime: 0 }
    };
    
    const bubbleColors = ['#ff6b6b', '#4a6bff', '#6bff6b', '#ffd56b', '#d56bff'];
    
    // Initialize game
    function initGame() {
        // Clear existing game elements
        gameBoard.innerHTML = '';
        bubbles = [];
        obstacles = [];
        score = 0;
        spawnRate = 1000;
        updateScoreDisplay();
        gameIsOver = false;
        gameOverElement.style.display = 'none';
        clearPowerups();
        
        // Create player
        player = document.createElement('div');
        player.className = 'player';
        player.style.left = '50%';
        player.style.bottom = '20px';
        gameBoard.appendChild(player);
        
        // Start game loops
        gameLoop = setInterval(updateGame, 20);
        bubbleSpawnInterval = setInterval(spawnBubble, spawnRate);
        obstacleSpawnInterval = setInterval(spawnObstacle, 5000);
        
        // Start theme music
        themeMusic.currentTime = 0;
        themeMusic.volume = 0.3;
        themeMusic.play();
    }
    
    function spawnBubble() {
        if (gameIsOver) return;
        
        const bubble = document.createElement('div');
        let bubbleType = 'normal';
        
        // 15% chance for powerup bubble
        if (Math.random() < 0.15) {
            const powerupTypes = ['speed', 'multiplier', 'invincible'];
            bubbleType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
            bubble.className = `bubble powerup-bubble ${bubbleType}-bubble`;
        } else {
            bubble.className = 'bubble';
            // Random color
            const color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
            bubble.style.backgroundColor = color;
        }
        
        // Random size between 30 and 60px
        const size = Math.floor(Math.random() * 30) + 30;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        
        // Random horizontal position
        const maxLeft = gameBoard.clientWidth - size;
        const left = Math.floor(Math.random() * maxLeft);
        bubble.style.left = `${left}px`;
        bubble.style.top = `-${size}px`;
        
        // Random floating animation
        bubble.style.animation = `bubbleFloat ${Math.random() * 2 + 1}s infinite ease-in-out`;
        
        gameBoard.appendChild(bubble);
        bubbles.push({
            element: bubble,
            speed: Math.random() * 3 + 2 + (score / 500), // Speed increases with score
            size: size,
            type: bubbleType
        });
        
        // Increase spawn rate as score increases (up to a limit)
        if (spawnRate > 300) {
            spawnRate = Math.max(300, 1000 - (score * 2));
            clearInterval(bubbleSpawnInterval);
            bubbleSpawnInterval = setInterval(spawnBubble, spawnRate);
        }
    }
    
    function spawnObstacle() {
        if (gameIsOver || score < 20) return; // Don't spawn obstacles too early
        
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        
        // Random width and height
        const width = Math.floor(Math.random() * 100) + 50;
        const height = Math.floor(Math.random() * 20) + 10;
        obstacle.style.width = `${width}px`;
        obstacle.style.height = `${height}px`;
        
        // Random horizontal position
        const maxLeft = gameBoard.clientWidth - width;
        const left = Math.floor(Math.random() * maxLeft);
        obstacle.style.left = `${left}px`;
        obstacle.style.top = `-${height}px`;
        
        // Random movement direction
        const moveDirection = Math.random() > 0.5 ? 1 : -1;
        const moveSpeed = Math.random() * 2 + 1;
        
        gameBoard.appendChild(obstacle);
        obstacles.push({
            element: obstacle,
            speed: Math.random() * 2 + 3 + (score / 500), // Speed increases with score
            width: width,
            height: height,
            moveDirection: moveDirection,
            moveSpeed: moveSpeed
        });
    }
    
    function updateGame() {
        if (gameIsOver) return;
        
        // Update powerup timer
        updatePowerupTimer();
        
        // Move bubbles
        bubbles.forEach((bubble, index) => {
            const currentTop = parseInt(bubble.element.style.top);
            bubble.element.style.top = `${currentTop + bubble.speed}px`;
            
            // Remove bubbles that are off screen
            if (currentTop > gameBoard.clientHeight) {
                bubble.element.remove();
                bubbles.splice(index, 1);
            }
            
            // Check for collisions with player
            if (checkCollision(player, bubble.element)) {
                handleCollision(bubble, index);
            }
        });
        
        // Move obstacles
        obstacles.forEach((obstacle, index) => {
            const currentTop = parseInt(obstacle.element.style.top);
            const currentLeft = parseInt(obstacle.element.style.left);
            
            // Update position
            obstacle.element.style.top = `${currentTop + obstacle.speed}px`;
            obstacle.element.style.left = `${currentLeft + (obstacle.moveSpeed * obstacle.moveDirection)}px`;
            
            // Reverse direction if hitting edge
            if (parseInt(obstacle.element.style.left) <= 0 || 
                parseInt(obstacle.element.style.left) >= gameBoard.clientWidth - obstacle.width) {
                obstacle.moveDirection *= -1;
            }
            
            // Remove obstacles that are off screen
            if (currentTop > gameBoard.clientHeight) {
                obstacle.element.remove();
                obstacles.splice(index, 1);
            }
            
            // Check for collisions with player (unless invincible)
            if (!powerups.invincible.active && checkCollision(player, obstacle.element)) {
                endGame();
            }
        });
    }
    
    function checkCollision(player, element) {
        const playerRect = player.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        return !(
            playerRect.bottom < elementRect.top ||
            playerRect.top > elementRect.bottom ||
            playerRect.right < elementRect.left ||
            playerRect.left > elementRect.right
        );
    }
    
    function handleCollision(bubble, index) {
        if (bubble.type === 'normal') {
            // Normal bubble
            createParticles(bubble);
            bubble.element.remove();
            bubbles.splice(index, 1);
            increaseScore();
            popSound.currentTime = 0;
            popSound.play();
        } else {
            // Powerup bubble
            activatePowerup(bubble.type);
            createParticles(bubble, true);
            bubble.element.remove();
            bubbles.splice(index, 1);
            powerupSound.currentTime = 0;
            powerupSound.play();
        }
    }
    
    function activatePowerup(type) {
        powerups[type].active = true;
        powerups[type].endTime = Date.now() + powerups[type].duration;
        
        // Visual feedback
        const icon = document.createElement('div');
        icon.className = 'powerup-icon';
        icon.textContent = type === 'speed' ? '⚡' : 
                          type === 'multiplier' ? '×2' : 
                          '🛡️';
        icon.style.backgroundColor = type === 'speed' ? '#ff0' : 
                                    type === 'multiplier' ? '#0f0' : 
                                    '#f0f';
        activePowerups.appendChild(icon);
        
        // Remove icon when powerup ends
        setTimeout(() => {
            if (icon.parentNode) {
                icon.remove();
            }
        }, powerups[type].duration);
        
        // Special effects for each powerup
        if (type === 'speed') {
            player.style.transition = 'bottom 0.05s ease-out';
        } else if (type === 'invincible') {
            player.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.8)';
        }
    }
    
    function updatePowerupTimer() {
        const activePowerup = Object.values(powerups).find(p => p.active);
        if (!activePowerup) {
            powerupTimer.style.width = '0%';
            return;
        }
        
        const remaining = activePowerup.endTime - Date.now();
        const percentage = Math.max(0, (remaining / activePowerup.duration) * 100);
        powerupTimer.style.width = `${percentage}%`;
        
        // Check if powerup expired
        if (remaining <= 0) {
            deactivatePowerup(activePowerup);
        }
    }
    
    function deactivatePowerup(powerup) {
        powerup.active = false;
        
        // Reset effects
        if (powerup === powerups.speed) {
            player.style.transition = 'bottom 0.1s ease-out';
        } else if (powerup === powerups.invincible) {
            player.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
        }
    }
    
    function clearPowerups() {
        Object.values(powerups).forEach(p => {
            p.active = false;
            p.endTime = 0;
        });
        activePowerups.innerHTML = '';
        player.style.transition = 'bottom 0.1s ease-out';
        player.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
    }
    
    function createParticles(bubble, isPowerup = false) {
        const particleCount = isPowerup ? 25 : 15;
        const color = bubble.element.style.backgroundColor || '#ffffff';
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 10 + 5;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.backgroundColor = color;
            
            const bubbleRect = bubble.element.getBoundingClientRect();
            const gameBoardRect = gameBoard.getBoundingClientRect();
            
            const left = bubbleRect.left - gameBoardRect.left + bubbleRect.width / 2;
            const top = bubbleRect.top - gameBoardRect.top + bubbleRect.height / 2;
            
            particle.style.left = `${left}px`;
            particle.style.top = `${top}px`;
            
            // Random direction
            particle.style.transform = `translate(${(Math.random() - 0.5) * 50}px, ${(Math.random() - 0.5) * 50}px)`;
            
            gameBoard.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                particle.remove();
            }, 500);
        }
    }
    
    function increaseScore() {
        const multiplier = powerups.multiplier.active ? powerups.multiplier.value : 1;
        score += multiplier;
        
        updateScoreDisplay();
        
        // Create score pop effect
        const scorePop = document.createElement('div');
        scorePop.className = `score-pop ${multiplier > 1 ? 'multiplier-pop' : ''}`;
        scorePop.textContent = `+${multiplier}`;
        scorePop.style.left = `${Math.random() * gameBoard.clientWidth}px`;
        scorePop.style.top = `${gameBoard.clientHeight - 50}px`;
        gameBoard.appendChild(scorePop);
        
        // Animate score element
        scoreElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    function updateScoreDisplay() {
        scoreElement.textContent = score;
        highScoreElement.textContent = `High Score: ${highScore}`;
    }
    
    function endGame() {
        gameIsOver = true;
        clearInterval(gameLoop);
        clearInterval(bubbleSpawnInterval);
        clearInterval(obstacleSpawnInterval);
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('bubbleHighScore', highScore);
        }
        
        finalScoreElement.textContent = score;
        finalHighScoreElement.textContent = highScore;
        gameOverElement.style.display = 'block';
        
        // Stop music and play game over sound
        themeMusic.pause();
        gameOverSound.currentTime = 0;
        gameOverSound.play();
    }
    
    // Player movement functions
    function movePlayer(direction) {
        if (gameIsOver || tiltControlsActive) return;
        
        const currentBottom = parseInt(player.style.bottom);
        const moveAmount = powerups.speed.active ? 45 : 30;
        
        if (direction === 'up' && currentBottom < gameBoard.clientHeight - 60) {
            player.style.bottom = `${currentBottom + moveAmount}px`;
        } else if (direction === 'down' && currentBottom > 20) {
            player.style.bottom = `${currentBottom - moveAmount}px`;
        }
    }
    
    // Event listeners for buttons
    upBtn.addEventListener('click', () => movePlayer('up'));
    downBtn.addEventListener('click', () => movePlayer('down'));
    
    tiltBtn.addEventListener('click', () => {
        isTiltMode = !isTiltMode;
        tiltBtn.style.background = isTiltMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        
        if (isTiltMode) {
            requestTiltPermission();
        }
    });
    
    function requestTiltPermission() {
        if (window.DeviceOrientationEvent) {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                // iOS 13+ requires permission
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            setupTiltControls();
                        }
                    })
                    .catch(console.error);
            } else {
                // Other browsers
                setupTiltControls();
            }
        }
    }
    
    function setupTiltControls() {
        tiltControlsActive = true;
        let initialBeta = null;
        
        window.addEventListener('deviceorientation', (e) => {
            if (!isTiltMode || gameIsOver) return;
            
            if (initialBeta === null && e.beta !== null) {
                initialBeta = e.beta;
            }
            
            if (e.beta !== null && initialBeta !== null) {
                const delta = e.beta - initialBeta;
                const maxBottom = gameBoard.clientHeight - 60;
                const newBottom = 20 + ((delta + 45) / 90) * (maxBottom - 20);
                
                // Constrain to game board boundaries
                if (newBottom > 20 && newBottom < maxBottom) {
                    player.style.bottom = `${newBottom}px`;
                }
            }
        });
    }
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (gameIsOver || tiltControlsActive) return;
        
        if (e.key === 'ArrowUp') {
            movePlayer('up');
        } else if (e.key === 'ArrowDown') {
            movePlayer('down');
        }
    });
    
    // Touch controls for mobile
    let touchStartY = 0;
    
    gameBoard.addEventListener('touchstart', (e) => {
        if (tiltControlsActive) return;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    gameBoard.addEventListener('touchmove', (e) => {
        if (gameIsOver || tiltControlsActive) return;
        
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY;
        
        if (Math.abs(deltaY) > 10) { // Threshold to prevent accidental moves
            const currentBottom = parseInt(player.style.bottom);
            const moveAmount = powerups.speed.active ? 45 : 30;
            const newBottom = currentBottom - deltaY * 0.3; // Dampen the movement
            
            // Constrain to game board boundaries
            if (newBottom > 20 && newBottom < gameBoard.clientHeight - 60) {
                player.style.bottom = `${newBottom}px`;
            }
            
            touchStartY = touchY;
        }
    }, { passive: true });
    
    // Theme switching
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove all theme classes
            document.body.classList.remove('theme-ocean', 'theme-neon');
            
            // Add selected theme class
            if (button.dataset.theme !== 'default') {
                document.body.classList.add(`theme-${button.dataset.theme}`);
            }
            
            // Update active button style
            themeButtons.forEach(btn => {
                btn.style.background = btn === button ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
            });
        });
    });
    
    restartBtn.addEventListener('click', initGame);
    
    // Initialize high score display
    highScoreElement.textContent = `High Score: ${highScore}`;
    
    // Start the game
    initGame();
});