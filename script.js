// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========

// Таймер обратного отсчета
let countdownInterval = null;

// Переменные для игры Memory
let gameStarted = false;
let gameTimer = 0;
let gameInterval = null;
let moves = 0;
let pairsFound = 0;
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let timerRunning = false;
let gameActive = false;

// Ключ для localStorage
const LEADERBOARD_KEY = 'wedding_memory_leaderboard';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx0chT-BiTBb_cP11xqdc06e68mgtRg7gdyXKQsJ2f_n9TXlTPcL9NnSwJtGM2F_o7T/exec';

// ========== ОБРАТНЫЙ ОТСЧЕТ (ИСПРАВЛЕННЫЙ) ==========

function updateCountdown() {
    try {
        const targetDate = new Date('June 13, 2026 16:00:00 GMT+0300').getTime();
        const now = new Date().getTime();
        const timeLeft = targetDate - now;

        if (timeLeft < 0) {
            const daysEl = document.getElementById('days');
            const hoursEl = document.getElementById('hours');
            const minutesEl = document.getElementById('minutes');
            const secondsEl = document.getElementById('seconds');
            
            if (daysEl) daysEl.textContent = '000';
            if (hoursEl) hoursEl.textContent = '00';
            if (minutesEl) minutesEl.textContent = '00';
            if (secondsEl) secondsEl.textContent = '00';
            return;
        }

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (daysEl) daysEl.textContent = days.toString().padStart(3, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    } catch (error) {
        console.error('Ошибка в updateCountdown:', error);
    }
}

// ========== ФОРМА ОТВЕТОВ (ДОБАВЛЕНА) ==========

function initResponseForm() {
    console.log('📝 Инициализация формы ответов...');
    
    const guestsCountSelect = document.getElementById('guests_count');
    const additionalGuestsContainer = document.getElementById('additional-guests-container');
    
    if (!guestsCountSelect || !additionalGuestsContainer) {
        console.log('Элементы формы не найдены');
        return;
    }
    
    // Обработчик изменения количества гостей
    guestsCountSelect.addEventListener('change', function() {
        const selectedValue = parseInt(this.value);
        
        // Очищаем предыдущие поля
        additionalGuestsContainer.innerHTML = '';
        
        // Если выбрано больше 1 гостя, показываем поля для имен
        if (selectedValue > 1) {
            for (let i = 2; i <= selectedValue; i++) {
                const guestField = document.createElement('div');
                guestField.className = 'form-group';
                guestField.innerHTML = `
                    <label for="guest_${i}">Имя гостя ${i}:</label>
                    <input type="text" 
                           id="guest_${i}" 
                           name="guest_${i}" 
                           placeholder="Введите имя гостя"
                           required>
                `;
                additionalGuestsContainer.appendChild(guestField);
            }
            additionalGuestsContainer.style.display = 'block';
        } else {
            additionalGuestsContainer.style.display = 'none';
        }
    });
    
    // Инициализируем при загрузке (на случай, если уже выбрано значение)
    if (guestsCountSelect.value > 1) {
        guestsCountSelect.dispatchEvent(new Event('change'));
    }
    
    console.log('✅ Форма ответов инициализирована');
}

// ========== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ (ИСПРАВЛЕННАЯ) ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔥 DOM загружен, инициализируем...');
    
    // 1. Запускаем обратный отсчет сразу
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
    
    // 2. Инициализируем форму ответов
    initResponseForm();
    
    // 3. Инициализируем игру Memory
    setTimeout(initMemoryGame, 100);
    
    // 4. Загружаем таблицу лидеров
    setTimeout(loadLeaderboard, 500);
    
    // 5. Добавляем обработчик ресайза
    window.addEventListener('resize', adjustGameForMobile);
});

// ========== ИНИЦИАЛИЗАЦИЯ ИГРЫ MEMORY ==========

function initMemoryGame() {
    console.log('🎮 Инициализация игры Memory...');

    const toggleGameBtn = document.getElementById('toggle-game-btn');

    if (!toggleGameBtn) {
        console.error('❌ Кнопка "toggle-game-btn" не найдена!');
        setTimeout(initMemoryGame, 1000);
        return;
    }

    console.log('✅ Кнопка найдена, добавляем обработчик...');

    // Обработчик кнопки "Сыграть в Memory"
    toggleGameBtn.addEventListener('click', function() {
        console.log('🎯 Кнопка нажата!');
        const gameContainer = document.getElementById('game-container');

        if (!gameContainer) {
            console.error('❌ game-container не найден');
            return;
        }

        const isHidden = gameContainer.style.display === 'none' || gameContainer.style.display === '';

        if (isHidden) {
            // Показываем игру
            gameContainer.style.display = 'block';
            gameStarted = true;

            // Инициализируем игру если нужно
            const grid = document.getElementById('memory-grid');
            if (grid && grid.children.length === 0) {
                initGame();
            } else {
                adjustGameForMobile();
            }

            // Загружаем турнирную таблицу
            loadLeaderboard();

            // Меняем текст кнопки
            toggleGameBtn.textContent = 'Скрыть игру';

            // Прокрутка
            setTimeout(() => {
                gameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } else {
            // Скрываем игру
            gameContainer.style.display = 'none';
            gameStarted = false;

            if (timerRunning) {
                clearInterval(gameInterval);
                timerRunning = false;
            }

            gameActive = false;
            toggleGameBtn.textContent = 'Сыграть в Memory';
        }
    });

    // Кнопка "Начать заново"
    const restartGameBtn = document.getElementById('restart-game');
    if (restartGameBtn) {
        restartGameBtn.addEventListener('click', function() {
            resetGameState();
            initGame();
            const saveResultForm = document.getElementById('save-result-form');
            if (saveResultForm) saveResultForm.style.display = 'none';
            const playerNameInput = document.getElementById('player-name');
            if (playerNameInput) playerNameInput.value = '';
        });
    }

    // Кнопка сохранения результата
    const saveResultBtn = document.getElementById('save-result-btn');
    const playerNameInput = document.getElementById('player-name');

    if (saveResultBtn && playerNameInput) {
        saveResultBtn.addEventListener('click', function() {
            const playerName = playerNameInput.value.trim();

            if (!playerName) {
                alert('Пожалуйста, введите ваше имя!');
                return;
            }

            if (playerName.length > 20) {
                alert('Имя не должно превышать 20 символов!');
                return;
            }

            saveResult(playerName, moves, gameTimer);
            playerNameInput.value = '';
            const saveResultForm = document.getElementById('save-result-form');
            if (saveResultForm) saveResultForm.style.display = 'none';
        });
    }

    console.log('✅ Игра Memory инициализирована!');
}

// ========== ФУНКЦИИ ИГРЫ MEMORY ==========

// Функция инициализации игры
function initGame() {
    console.log('🃏 Инициализация игрового поля...');
    const grid = document.getElementById('memory-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const symbols = ['💍', '💐', '🥂', '🔥', '🏠', '👰', '🤵', '❤️', '🎉', '🎶', '🍖', '🌲', '🎈', '🍰', '🕊️'];
    const gameSymbols = [...symbols, ...symbols];

    const shuffledSymbols = [...gameSymbols].sort(() => Math.random() - 0.5);

    shuffledSymbols.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.symbol = symbol;
        card.dataset.index = index;

        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });

    adjustGameForMobile();
}

// Функция сброса состояния игры
function resetGameState() {
    console.log('🔄 Сброс состояния игры...');
    if (timerRunning) {
        clearInterval(gameInterval);
        timerRunning = false;
    }

    gameTimer = 0;
    moves = 0;
    pairsFound = 0;
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    gameActive = false;

    const movesEl = document.getElementById('moves');
    const timerEl = document.getElementById('game-timer');
    const pairsEl = document.getElementById('pairs');

    if (movesEl) movesEl.textContent = '0';
    if (timerEl) timerEl.textContent = '0';
    if (pairsEl) pairsEl.textContent = '0';
}

// Запуск таймера
function startTimer() {
    if (!timerRunning) {
        console.log('⏱️ Запуск таймера...');
        gameTimer = 0;
        timerRunning = true;
        gameInterval = setInterval(() => {
            gameTimer++;
            const timerEl = document.getElementById('game-timer');
            if (timerEl) timerEl.textContent = gameTimer;
        }, 1000);
    }
}

// Функция переворота карточки
function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;
    if (this.classList.contains('matched')) return;

    if (!gameActive) {
        console.log('🎮 Первый ход, начинаем игру...');
        gameActive = true;
        startTimer();
    }

    this.classList.add('flipped');
    this.textContent = this.dataset.symbol;

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    moves++;
    const movesEl = document.getElementById('moves');
    if (movesEl) movesEl.textContent = moves;

    checkForMatch();
}

// Проверка совпадения карточек
function checkForMatch() {
    const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

    if (isMatch) {
        disableCards();
        pairsFound++;
        const pairsEl = document.getElementById('pairs');
        if (pairsEl) pairsEl.textContent = pairsFound;

        if (pairsFound === 15) {
            console.log('🏆 Игра завершена!');
            if (timerRunning) {
                clearInterval(gameInterval);
                timerRunning = false;
            }

            setTimeout(() => {
                showResultModal();
            }, 500);
        }
    } else {
        unflipCards();
    }
}

// Отключение совпавших карточек
function disableCards() {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    resetBoard();
}

// Переворот несовпавших карточек обратно
function unflipCards() {
    lockBoard = true;

    setTimeout(() => {
        firstCard.classList.remove('flipped');
        firstCard.textContent = '';
        secondCard.classList.remove('flipped');
        secondCard.textContent = '';

        resetBoard();
    }, 1000);
}

// Сброс состояния доски
function resetBoard() {
    [firstCard, secondCard, lockBoard] = [null, null, false];
}

// Показать модальное окно с результатами
function showResultModal() {
    console.log('🏅 Показ модального окна с результатами...');
    const modal = document.createElement('div');
    modal.className = 'result-modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
        <div class="result-modal-content">
            <h3>Поздравляем!</h3>
            <p>Вы нашли все пары за <strong>${moves}</strong> ходов и <strong>${gameTimer}</strong> секунд!</p>
            <p>Хотите сохранить результат в турнирную таблицу?</p>
            <div class="result-modal-buttons">
                <button class="result-modal-btn save" id="save-to-leaderboard">Сохранить результат</button>
                <button class="result-modal-btn play-again" id="play-again">Играть снова</button>
                <button class="result-modal-btn close" id="close-modal">Закрыть</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('save-to-leaderboard').addEventListener('click', function() {
        modal.remove();
        const leaderboardContainer = document.getElementById('leaderboard-container');
        const saveResultForm = document.getElementById('save-result-form');
        const playerNameInput = document.getElementById('player-name');

        if (leaderboardContainer) leaderboardContainer.style.display = 'block';
        if (saveResultForm) saveResultForm.style.display = 'block';
        if (playerNameInput) playerNameInput.focus();
    });

    document.getElementById('play-again').addEventListener('click', function() {
        modal.remove();
        resetGameState();
        initGame();
        const saveResultForm = document.getElementById('save-result-form');
        if (saveResultForm) saveResultForm.style.display = 'none';
    });

    document.getElementById('close-modal').addEventListener('click', function() {
        modal.remove();
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ========== ТУРНИРНАЯ ТАБЛИЦА (Google Sheets) ==========

// Сохранение результата
async function saveResult(name, moves, time) {
    console.log('💾 Сохранение результата:', name, moves, time);
    try {
        const saveResultBtn = document.getElementById('save-result-btn');
        if (saveResultBtn) {
            saveResultBtn.disabled = true;
            saveResultBtn.textContent = 'Сохраняем...';
        }

        // Отправляем результат на сервер
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveMemoryScore',
                data: { name: name, moves: moves, time: time }
            })
        });

        const result = await response.json();
        console.log('📨 Ответ сервера:', result);

        if (result.success) {
            // Сохраняем также локально
            saveToLocalStorage(name, moves, time);
            await loadLeaderboard();
            showNotification(`🎉 Результат сохранен! Место в таблице: ${result.rank || 'топ-10'}`);

            setTimeout(() => {
                const saveResultForm = document.getElementById('save-result-form');
                if (saveResultForm) saveResultForm.style.display = 'none';
            }, 2000);
        } else {
            saveToLocalStorage(name, moves, time);
            loadLeaderboard();
            showNotification('⚠️ Результат сохранен локально (ошибка сервера)');
        }

    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        saveToLocalStorage(name, moves, time);
        loadLeaderboard();
        showNotification('⚠️ Результат сохранен локально (ошибка сети)');

    } finally {
        const saveResultBtn = document.getElementById('save-result-btn');
        if (saveResultBtn) {
            saveResultBtn.disabled = false;
            saveResultBtn.textContent = 'Сохранить результат';
        }
    }
}

// Сохранение в localStorage как запасной вариант (ИСПРАВЛЕНА СТРОКА ~74)
function saveToLocalStorage(name, moves, time) {
    let leaderboard = getLeaderboard();

    const newResult = {
        name: name,
        moves: moves,
        time: time,
        date: new Date().toISOString()
    };

    leaderboard.push(newResult);
    leaderboard.sort((a, b) => {
        if (a.moves !== b.moves) return a.moves - b.moves;
        return a.time - b.time;
    });

    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

// Уведомление
function showNotification(message) {
    const oldNotification = document.querySelector('.game-notification');
    if (oldNotification) oldNotification.remove();

    const notification = document.createElement('div');
    notification.className = 'game-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #8B7355;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        font-family: inherit;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Загрузка турнирной таблицы (ИСПРАВЛЕН ДУБЛИРУЮЩИЙСЯ ЗАГОЛОВОК)
async function loadLeaderboard() {
    const leaderboardElement = document.getElementById('leaderboard');
    if (!leaderboardElement) {
        console.log('📊 Элемент leaderboard не найден');
        return;
    }

    console.log('📥 Загрузка таблицы лидеров...');
    leaderboardElement.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Загружаем таблицу лидеров...</p>
        </div>
    `;

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getTopScores`);
        const cloudLeaderboard = await response.json();
        console.log('☁️ Облачная таблица:', cloudLeaderboard);

        if (cloudLeaderboard && cloudLeaderboard.length > 0) {
            displayLeaderboard(cloudLeaderboard, true);
        } else {
            const localLeaderboard = getLeaderboard();
            if (localLeaderboard.length > 0) {
                displayLeaderboard(localLeaderboard, false);
            } else {
                showNoResults();
            }
        }

    } catch (error) {
        console.error('❌ Ошибка загрузки из облака:', error);
        const localLeaderboard = getLeaderboard();
        if (localLeaderboard.length > 0) {
            displayLeaderboard(localLeaderboard, false);
        } else {
            showNoResults();
        }
    }
}

// Отображение таблицы лидеров (ИСПРАВЛЕН ДУБЛИРУЮЩИЙСЯ ЗАГОЛОВОК)
function displayLeaderboard(leaderboard, isCloud) {
    const leaderboardElement = document.getElementById('leaderboard');
    if (!leaderboardElement) return;

    if (leaderboard.length === 0) {
        showNoResults();
        return;
    }

    let tableHTML = `
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Имя</th>
                    <th>Ходы</th>
                    <th>Время</th>
                </tr>
            </thead>
            <tbody>
    `;

    leaderboard.forEach((result, index) => {
        tableHTML += `
            <tr>
                <td class="player-rank">${index + 1}</td>
                <td class="player-name">${result.name}</td>
                <td class="player-moves">${result.moves}</td>
                <td class="player-time">${result.time} сек</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    
    // Добавляем кнопку обновления С НАЗНАЧЕНИЕМ КЛАССА ДЛЯ СТИЛЕЙ
    tableHTML += `
        <div class="leaderboard-footer">
            <button id="refresh-leaderboard" class="refresh-btn">
                Обновить таблицу
            </button>
        </div>
    `;

    leaderboardElement.innerHTML = tableHTML;

    const leaderboardContainer = document.getElementById('leaderboard-container');
    if (leaderboardContainer) leaderboardContainer.style.display = 'block';

    const refreshBtn = document.getElementById('refresh-leaderboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadLeaderboard);
    }
}

// Показать сообщение об отсутствии результатов (ДОБАВЛЕНА КНОПКА С КЛАССОМ)
function showNoResults() {
    const leaderboardElement = document.getElementById('leaderboard');
    if (!leaderboardElement) return;

    leaderboardElement.innerHTML = `
        <div class="no-results">
            <p>🎮 Пока нет результатов</p>
            <p>Будьте первым!</p>
            <button id="refresh-leaderboard" class="refresh-btn">
                🔄 Обновить таблицу
            </button>
        </div>
    `;

    const leaderboardContainer = document.getElementById('leaderboard-container');
    if (leaderboardContainer) leaderboardContainer.style.display = 'block';

    const refreshBtn = document.getElementById('refresh-leaderboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadLeaderboard);
    }
}

// Получение турнирной таблицы из localStorage
function getLeaderboard() {
    try {
        const stored = localStorage.getItem(LEADERBOARD_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('❌ Ошибка загрузки турнирной таблицы:', e);
        return [];
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

// Адаптация игры для мобильных устройств
function adjustGameForMobile() {
    const grid = document.getElementById('memory-grid');
    if (!grid) return;

    const width = window.innerWidth;
    const cards = document.querySelectorAll('.memory-card');

    if (width <= 380) {
        grid.style.maxWidth = '300px';
        grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
        grid.style.gridTemplateRows = 'repeat(6, 1fr)';
    } else if (width <= 480) {
        grid.style.maxWidth = '350px';
        grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
        grid.style.gridTemplateRows = 'repeat(6, 1fr)';
    } else if (width <= 576) {
        grid.style.maxWidth = '400px';
        grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
        grid.style.gridTemplateRows = 'repeat(6, 1fr)';
    } else if (width <= 768) {
        grid.style.maxWidth = '500px';
        grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
        grid.style.gridTemplateRows = 'repeat(6, 1fr)';
    } else {
        grid.style.maxWidth = '650px';
        grid.style.gridTemplateColumns = 'repeat(6, 1fr)';
        grid.style.gridTemplateRows = 'repeat(5, 1fr)';
    }

    cards.forEach(card => {
        if (width <= 768) {
            card.style.width = '100%';
            card.style.height = '100%';
            card.style.minWidth = '48px';
            card.style.minHeight = '48px';
        } else {
            card.style.width = '87.862px';
            card.style.height = '87.862px';
        }
    });
}

// Добавим CSS для анимаций и кнопок если нет
if (!document.querySelector('#game-animations')) {
    const style = document.createElement('style');
    style.id = 'game-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .loading {
            text-align: center;
            padding: 40px 20px;
            color: #8B7355;
        }
        .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid rgba(139, 115, 85, 0.3);
            border-radius: 50%;
            border-top-color: #8B7355;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 15px;
        }
        /* Стили для кнопки обновления в таблице лидеров */
        .leaderboard-footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px dashed #e0d6c9;
        }
        .refresh-btn {
            background: #8B7355;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        .refresh-btn:hover {
            background: #7a6248;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(139, 115, 85, 0.2);
        }
    `;
    document.head.appendChild(style);
}

// Тестовая функция для проверки в консоли
window.testElements = function() {
    console.log('🔍 Проверка элементов:');
    console.log('toggle-game-btn:', document.getElementById('toggle-game-btn'));
    console.log('game-container:', document.getElementById('game-container'));
    console.log('days:', document.getElementById('days'));
    console.log('hours:', document.getElementById('hours'));
    console.log('minutes:', document.getElementById('minutes'));
    console.log('seconds:', document.getElementById('seconds'));
};
