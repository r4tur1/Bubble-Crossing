document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const gameOverElement = document.getElementById('game-over');
    const finalScoreElement = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-btn');
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    
    let score = 0;
    let gameIsOver = false;
    let player;
    let cars = [];
    let gameLoop;
    let carSpawnInterval;
    
    function initGame() {
        // Clear existing game elements
        gameBoard.innerHTML = '';
        cars = [];
        score = 0;
        scoreElement.textContent = `Score: ${score}`;
        gameIsOver = false;
        gameOverElement.style.display = 'none';
        
        // Create player
        player = document.createElement('div');
        player.className = 'player';
        player.style.left = '135px';
        player.style.bottom = '20px';
        gameBoard.appendChild(player);
        
        // Start game loops
        gameLoop = setInterval(updateGame, 20);
        carSpawnInterval = setInterval(spawnCar, 2000);
    }
    
    function spawnCar() {
        if (gameIsOver) return;
        
        const car = document.createElement('div');
        car.className = 'car';
        const lane = Math.random() > 0.5 ? 80 : 180;
        car.style.left = `${lane}px`;
        car.style.top = '-60px';
        gameBoard.appendChild(car);
        cars.push(car);
    }
    
    function updateGame() {
        if (gameIsOver) return;
        
        // Move cars
        cars.forEach((car, index) => {
            const currentTop = parseInt(car.style.top);
            car.style.top = `${currentTop + 5}px`;
            
            // Remove cars that are off screen
            if (currentTop > gameBoard.clientHeight) {
                car.remove();
                cars.splice(index, 1);
                increaseScore();
            }
            
            // Check for collisions
            if (checkCollision(player, car)) {
                endGame();
            }
        });
    }
    
    function checkCollision(player, car) {
        const playerRect = player.getBoundingClientRect();
        const carRect = car.getBoundingClientRect();
        
        return !(
            playerRect.bottom < carRect.top ||
            playerRect.top > carRect.bottom ||
            playerRect.right < carRect.left ||
            playerRect.left > carRect.right
        );
    }
    
    function increaseScore() {
        score++;
        scoreElement.textContent = `Score: ${score}`;
    }
    
    function endGame() {
        gameIsOver = true;
        clearInterval(gameLoop);
        clearInterval(carSpawnInterval);
        finalScoreElement.textContent = score;
        gameOverElement.style.display = 'block';
    }
    
    // Event listeners
    upBtn.addEventListener('click', () => {
        if (gameIsOver) return;
        const currentBottom = parseInt(player.style.bottom);
        if (currentBottom < gameBoard.clientHeight - 60) {
            player.style.bottom = `${currentBottom + 20}px`;
        }
    });
    
    downBtn.addEventListener('click', () => {
        if (gameIsOver) return;
        const currentBottom = parseInt(player.style.bottom);
        if (currentBottom > 20) {
            player.style.bottom = `${currentBottom - 20}px`;
        }
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (gameIsOver) return;
        
        const currentBottom = parseInt(player.style.bottom);
        
        if (e.key === 'ArrowUp' && currentBottom < gameBoard.clientHeight - 60) {
            player.style.bottom = `${currentBottom + 20}px`;
        } else if (e.key === 'ArrowDown' && currentBottom > 20) {
            player.style.bottom = `${currentBottom - 20}px`;
        }
    });
    
    restartBtn.addEventListener('click', initGame);
    
    // Start the game
    initGame();
});