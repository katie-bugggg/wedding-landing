// Логика игры Memory для свадебного лендинга

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли контейнер для игры
    const gameContainer = document.getElementById('memory-game');
    if (!gameContainer) return;
    
    // Инициализируем игру
    initMemoryGame();
});

function initMemoryGame() {
    const gameContainer = document.getElementById('memory-game');
    const restartButton = document.getElementById('restart-game');
    const gameTimeElement = document.getElementById('game-time');
    const bestTimeElement = document.getElementById('best-time');
    
    // Иконки для карточек (18 пар)
    const cardIcons = [
        'fas fa-ring', 'fas fa-heart', 'fas fa-champagne-glasses',
        'fas fa-cake', 'fas fa-music', 'fas fa-camera',
        'fas fa-car', 'fas fa-tree', 'fas fa-umbrella-beach',
        'fas fa-wine-bottle', 'fas fa-guitar', 'fas fa-star',
        'fas fa-moon', 'fas fa-sun', 'fas fa-cloud',
        'fas fa-home', 'fas fa-glass-cheers', 'fas fa-kiss-wink-heart'
    ];
    
    // Дублируем иконки для создания пар
    let gameCards = [...cardIcons, ...cardIcons];
    let flippedCards = [];
    let matchedPairs = 0;
    let gameStarted = false;
    let timer = null;
    let seconds = 0;
    
    // Загружаем лучшее время из localStorage
    let bestTime = localStorage.getItem('weddingMemoryBestTime') || '--:--';
    bestTimeElement.textContent = bestTime;
    
    // Создаем игровое поле
    function createGameBoard() {
        gameContainer.innerHTML = '';
        shuffledCards = shuffleArray([...gameCards]);
        
        for (let i = 0; i < 36; i++) {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.icon = shuffledCards[i];
            card.dataset.index = i;
            
            card.innerHTML = `
                <div class="card-front">
                    <i class="${shuffledCards[i]}"></i>
                </div>
                <div class="card-back">
                    <i class="fas fa-question"></i>
                </div>
            `;
            
            card.addEventListener('click', () => flipCard(card));
            gameContainer.appendChild(card);
        }
    }
    
    // Перемешиваем массив
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Переворачиваем карточку
    function flipCard(card) {
        // Игнорируем, если карта уже перевернута или совпала
        if (card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }
        
        // Начинаем игру при первом клике
        if (!gameStarted) {
            startGame();
            gameStarted = true;
        }
        
        // Переворачиваем карту
        card.classList.add('flipped');
        flippedCards.push(card);
        
        // Если перевернуто 2 карты, проверяем совпадение
        if (flippedCards.length === 2) {
            checkForMatch();
        }
    }
    
    // Проверяем совпадение карт
    function checkForMatch() {
        const [card1, card2] = flippedCards;
        
        if (card1.dataset.icon === card2.dataset.icon) {
            // Совпали
            card1.classList.add('matched');
            card2.classList.add('matched');
            flippedCards = [];
            matchedPairs++;
            
            // Проверяем, завершена ли игра
            if (matchedPairs === 18) {
                endGame();
            }
        } else {
            // Не совпали - переворачиваем обратно через 1 секунду
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
            }, 1000);
        }
    }
    
    // Начинаем игру
    function startGame() {
        seconds = 0;
        updateTimerDisplay();
        timer = setInterval(() => {
            seconds++;
            updateTimerDisplay();
        }, 1000);
    }
    
    // Завершаем игру
    function endGame() {
        clearInterval(timer);
        
        // Сохраняем лучшее время
        const currentTime = formatTime(seconds);
        gameTimeElement.textContent = currentTime;
        
        // Обновляем лучшее время, если текущее лучше
        if (bestTime === '--:--' || seconds < parseTime(bestTime)) {
            bestTime = currentTime;
            bestTimeElement.textContent = bestTime;
            localStorage.setItem('weddingMemoryBestTime', bestTime);
            
            // Показываем поздравление
            setTimeout(() => {
                alert(`🎉 Поздравляем! Вы собрали все пары за ${currentTime}! Это ваш новый рекорд!`);
            }, 500);
        } else {
            setTimeout(() => {
                alert(`🎉 Отлично! Вы собрали все пары за ${currentTime}! Ваш лучший результат: ${bestTime}`);
            }, 500);
        }
    }
    
    // Обновляем отображение таймера
    function updateTimerDisplay() {
        gameTimeElement.textContent = formatTime(seconds);
    }
    
    // Форматируем время в MM:SS
    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Парсим время из формата MM:SS в секунды
    function parseTime(timeStr) {
        if (timeStr === '--:--') return Infinity;
        const [minutes, seconds] = timeStr.split(':').map(Number);
        return minutes * 60 + seconds;
    }
    
    // Перезапуск игры
    function restartGame() {
        clearInterval(timer);
        gameStarted = false;
        flippedCards = [];
        matchedPairs = 0;
        seconds = 0;
        updateTimerDisplay();
        createGameBoard();
    }
    
    // Обработчик кнопки перезапуска
    if (restartButton) {
        restartButton.addEventListener('click', restartGame);
    }
    
    // Инициализируем игровое поле
    createGameBoard();
}
