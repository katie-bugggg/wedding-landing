// ========== FIREBASE REST API ==========
const FIREBASE_URL = 'https://zhara-party-default-rtdb.europe-west1.firebasedatabase.app';

// 1. Функция для сохранения результата игры
async function saveGameResult(playerName, timeSeconds, moves) {
    console.log('💾 Сохраняем результат игры...');
    
    const result = {
        name: playerName,
        time: timeSeconds, // в секундах для сортировки
        timeDisplay: formatTime(timeSeconds), // для отображения
        moves: moves,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('ru-RU')
    };
    
    try {
        // POST создает запись с автоматическим ID (например: -Nxyz123)
        const response = await fetch(`${FIREBASE_URL}/leaderboard.json`, {
            method: 'POST',
            body: JSON.stringify(result),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        console.log('✅ Результат сохранен в Firebase! ID:', data.name);
        
        // После сохранения обновляем таблицу
        setTimeout(loadLeaderboard, 1000);
        return data;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения в Firebase:', error);
        // Fallback: сохраняем локально
        saveToLocalStorage(result);
        return null;
    }
}

// 2. Функция для загрузки таблицы лидеров
async function loadLeaderboard() {
    console.log('📥 Загружаем таблицу лидеров...');
    
    try {
        const response = await fetch(`${FIREBASE_URL}/leaderboard.json`);
        const data = await response.json();
        
        if (!data) {
            console.log('📭 Таблица лидеров пуста');
            displayLeaderboard([]);
            return;
        }
        
        // Преобразуем объект в массив и добавляем ID
        const resultsArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
        
        // Сортируем по времени (меньше = лучше)
        resultsArray.sort((a, b) => a.time - b.time);
        
        console.log(`✅ Загружено ${resultsArray.length} результатов`);
        displayLeaderboard(resultsArray);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки таблицы:', error);
        // Fallback: локальные данные
        const localData = getLocalLeaderboard();
        displayLeaderboard(localData);
    }
}

// 3. Вспомогательные функции (добавьте если нет):

// Форматирование времени (секунды → "мм:сс")
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Сохранение в localStorage (fallback)
function saveToLocalStorage(result) {
    try {
        const key = `game_result_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(result));
        console.log('💾 Результат сохранен локально');
    } catch (e) {
        console.error('❌ Ошибка localStorage:', e);
    }
}

// Загрузка из localStorage
function getLocalLeaderboard() {
    try {
        const results = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('game_result_')) {
                const data = JSON.parse(localStorage.getItem(key));
                results.push(data);
            }
        }
        return results.sort((a, b) => a.time - b.time);
    } catch (e) {
        console.error('❌ Ошибка чтения localStorage:', e);
        return [];
    }
}

// 4. Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Сайт загружен, подключаем Firebase REST API...');
    
    // Загружаем таблицу лидеров через 1 секунду
    setTimeout(loadLeaderboard, 1000);
    
    // Проверяем подключение
    fetch(`${FIREBASE_URL}/.json`)
        .then(r => r.json())
        .then(data => {
            if (data && data.leaderboard) {
                console.log('✅ Firebase подключен, записей в leaderboard:', 
                    Object.keys(data.leaderboard).length);
            } else {
                console.log('⚠️  Firebase подключен, но leaderboard пуст');
            }
        })
        .catch(error => {
            console.error('❌ Ошибка подключения к Firebase:', error);
        });
});

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========

// Форма
let guestForm = null;
let guestsCountSelect = null;
let additionalGuestsContainer = null;

// Таймер обратного отсчета
const TARGET_DATE = new Date('June 13, 2026 16:00:00 GMT+0200').getTime();
const COUNTDOWN_TITLE = document.getElementById('countdown-title');
let countdownInterval = null;
// Флаг для отслеживания режима (true = идет обратный отсчет, false = идет отсчет праздника)
let isCountdownMode = true;
// Интервал для постоянного салюта
let fireworksInterval = null;

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
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQ3ILeDMXLKQScdGuW8wpzJfHrfqr55lTjXN9Q9qz78Tf64dnqtDaUTyH2FGDxsHIZ/exec';

// ========== ОБРАТНЫЙ ОТСЧЕТ ==========
// ========== ГЛАВНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ ==========

function updateTimer() {
    try {
        const now = Date.now(); // Используем Date.now() для большей точности
        lastUpdateTime = now;
        
        // Если дата в будущем И мы еще в режиме обратного отсчета
        if (isCountdownMode && now < TARGET_DATE) {
            // РЕЖИМ ОБРАТНОГО ОТСЧЕТА
            const timeLeft = TARGET_DATE - now;
            
            // Обновление обратного отсчета
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            document.getElementById('days').textContent = days.toString().padStart(3, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        } 
        // Если настало или прошло время ТАРГЕТ_ДАТЫ
        else if (isCountdownMode) {
            // ПЕРЕКЛЮЧЕНИЕ В РЕЖИМ ПРАЗДНИКА
            isCountdownMode = false;
            switchToPartyMode();
            updatePartyTimer(); // Немедленно обновить таймер праздника
        }
        else {
            // РЕЖИМ ОТСЧЕТА ПРАЗДНИКА
            updatePartyTimer();
        }
    } catch (error) {
        console.error('Ошибка в updateTimer:', error);
    }
}

// ========== ПЕРЕКЛЮЧЕНИЕ В РЕЖИМ ПРАЗДНИКА ==========

function switchToPartyMode() {
    console.log('Переключение в режим праздника! Время:', new Date().toLocaleTimeString());
    
    // Изменение заголовка
    COUNTDOWN_TITLE.textContent = 'Мы празднуем уже:';
    
    // Установка начальных значений (должны быть все нули)
    document.getElementById('days').textContent = '000';
    document.getElementById('hours').textContent = '00';
    document.getElementById('minutes').textContent = '00';
    document.getElementById('seconds').textContent = '00';
    
    // Запуск постоянного салюта
    startContinuousFireworks();
}

// ========== ОТСЧЕТ ВРЕМЕНИ ПРАЗДНИКА ==========

function updatePartyTimer() {
    const now = Date.now();
    const partyDuration = now - TARGET_DATE; // Сколько длится праздник в миллисекундах
    
    // Защита от отрицательного времени (на всякий случай)
    if (partyDuration < 0) {
        console.warn('Время праздника отрицательное! Проверьте TARGET_DATE');
        return;
    }
    
    // Рассчет дней, часов, минут, секунд праздника
    const days = Math.floor(partyDuration / (1000 * 60 * 60 * 24));
    const hours = Math.floor((partyDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((partyDuration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((partyDuration % (1000 * 60)) / 1000);
    
    // Обновление элементов
    document.getElementById('days').textContent = days.toString().padStart(3, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    
    // Для дебага - выводим в консоль
    if (partyDuration < 5000) { // Только первые 5 секунд
        console.log(`Праздник длится: ${days}д ${hours}ч ${minutes}м ${seconds}с (${partyDuration}мс)`);
    }
}

// ========== ПОСТОЯННЫЙ САЛЮТ ==========

function startContinuousFireworks() {
    console.log('Запуск салюта!');
    
    // Остановить предыдущий интервал, если он был
    if (fireworksInterval) {
        clearInterval(fireworksInterval);
    }
    
    // Запускать салют каждые 2 секунды
    fireworksInterval = setInterval(() => {
        createFireworksBurst();
    }, 2000);
    
    // Сразу запустить первый салют
    createFireworksBurst();
}

function createFireworksBurst() {
    const countdownSection = document.querySelector('.countdown');
    if (!countdownSection) return;
    
    // Создаем несколько "вспышек" салюта в одном залпе
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: ${getRandomColor()};
                border-radius: 50%;
                top: ${20 + Math.random() * 60}%;
                left: ${Math.random() * 100}%;
                pointer-events: none;
                z-index: 1;
                animation: explode 1.5s ease-out forwards;
            `;
            countdownSection.appendChild(firework);
            
            // Удаляем элемент после анимации
            setTimeout(() => {
                if (firework.parentNode) {
                    firework.parentNode.removeChild(firework);
                }
            }, 1500);
        }, i * 100);
    }
}

function getRandomColor() {
    const colors = ['#ff9a9e', '#fad0c4', '#a1c4fd', '#c2e9fb', '#ffecd2', '#fcb69f', '#ff9a9e', '#fad0c4', '#a1c4fd'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

// Запуск таймера при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Загрузка страницы. Текущее время:', new Date().toLocaleTimeString());
    console.log('Целевое время:', new Date(TARGET_DATE).toLocaleTimeString());
    console.log('Разница (мс):', TARGET_DATE - Date.now());
    
    // Проверить сразу, не настало ли уже время праздника
    const now = Date.now();
    if (now >= TARGET_DATE) {
        console.log('Праздник уже начался!');
        isCountdownMode = false;
        switchToPartyMode();
    } else {
        console.log('Обратный отсчет активен');
    }
    
    // Запуск интервала обновления (каждую секунду)
    countdownInterval = setInterval(updateTimer, 1000);
    
    // Первоначальное обновление
    updateTimer();
});

// Остановка интервала при уходе со страницы
window.addEventListener('beforeunload', function() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    if (fireworksInterval) {
        clearInterval(fireworksInterval);
    }
});



// ========== ПОКАЗ СООБЩЕНИЙ ФОРМЫ ==========
function showFormMessage(message, type = 'info') {
    // Удаляем старое сообщение если есть
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Создаем новое сообщение
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    
    // Стили сообщения
    messageDiv.style.cssText = `
        margin: 20px 0;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        font-weight: 500;
        font-size: 16px;
        background-color: ${type === 'success' ? 'rgba(74, 108, 74, 0.1)' : 'rgba(255, 0, 0, 0.1)'};
        color: ${type === 'success' ? '#4a6c4a' : '#d32f2f'};
        border: 1px solid ${type === 'success' ? '#4a6c4a' : '#d32f2f'};
    `;
    
    // Вставляем перед кнопкой отправки
    const submitBtn = document.querySelector('#form button[type="submit"]');
    if (submitBtn && submitBtn.parentNode) {
        submitBtn.parentNode.insertBefore(messageDiv, submitBtn);
    }
    
    // Автоматически скрываем успешные сообщения через 5 секунд
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.transition = 'opacity 0.5s';
                messageDiv.style.opacity = '0';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 500);
            }
        }, 5000);
    }
}

// ========== ФОРМА ОТВЕТОВ ==========

function initResponseForm() {
    console.log('📝 Инициализация формы с правильными селекторами...');
    
    // 1. Находим элементы по их ID из HTML
    guestsCountSelect = document.getElementById('guests-count');
    additionalGuestsContainer = document.getElementById('additional-guests');
    guestForm = document.getElementById('guest-form');
    
    console.log('Найдены элементы:', {
        guestsCountSelect: !!guestsCountSelect,
        additionalGuestsContainer: !!additionalGuestsContainer,
        guestForm: !!guestForm
    });
    
    if (!guestsCountSelect) {
        console.error('❌ Элемент #guests-count не найден!');
        return;
    }
    
    if (!additionalGuestsContainer) {
        console.error('❌ Элемент #additional-guests не найден!');
        return;
    }
    
    if (!guestForm) {
        console.error('❌ Элемент #guest-form не найден!');
        return;
    }
    
    console.log('✅ Все элементы формы найдены!');
    
    // 2. Функция для добавления полей дополнительных гостей
    function updateGuestFields() {
        const guestsCount = parseInt(guestsCountSelect.value);
        console.log('Количество гостей изменено на:', guestsCount);
        
        additionalGuestsContainer.innerHTML = '';
        
        if (guestsCount > 1) {
            additionalGuestsContainer.style.display = 'block';
            
            for (let i = 2; i <= guestsCount; i++) {
                const div = document.createElement('div');
                div.className = 'form-group';
                div.innerHTML = `
                    <label for="guest${i}">Имя гостя ${i}:</label>
                    <input type="text" id="guest${i}" name="guest${i}" 
                           class="form-control" placeholder="Введите имя гостя">
                `;
                additionalGuestsContainer.appendChild(div);
            }
        } else {
            additionalGuestsContainer.style.display = 'none';
        }
    }
    
    // 3. Вешаем обработчик изменения количества гостей
    guestsCountSelect.addEventListener('change', updateGuestFields);
    
    // 4. Инициализируем поля если в URL уже есть значение (guests-count=3)
    if (guestsCountSelect.value && parseInt(guestsCountSelect.value) > 1) {
        console.log('Инициализируем поля с выбранным значением:', guestsCountSelect.value);
        updateGuestFields();
    }
    
    // Обработчик формы (formspree):
guestForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Отправка...';
    submitBtn.disabled = true;
    
    try {
        // Собираем данные формы
        const formData = {
            name: document.getElementById('name').value.trim(),
            guests_count: guestsCountSelect.value,
            drinks: getSelectedOptions('drinks').join(', '),
            stay: document.getElementById('stay').value,
            car: document.getElementById('car').value,
            track: document.getElementById('track').value.trim(),
            phone: document.getElementById('phone').value.trim()
        };
        
        // Собираем дополнительные имена гостей
        const additionalGuests = [];
        const guestInputs = document.querySelectorAll('#additional-guests input');
        guestInputs.forEach(input => {
            if (input.value.trim()) {
                additionalGuests.push(input.value.trim());
            }
        });
        
        if (additionalGuests.length > 0) {
            formData.additional_guests = additionalGuests.join(', ');
        }
        
        // Проверка обязательных полей
        if (!formData.name || !formData.phone) {
            showFormMessage('❌ Пожалуйста, заполните имя и телефон', 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        // === ОТПРАВКА ЧЕРЕЗ FORMSPREE ===
        const response = await fetch('https://formspree.io/f/mbdlvbkg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                // Эти поля Formspree понимает автоматически
                _subject: `Заявка на свадебную вечеринку от ${formData.name}`,
                _replyto: 'katerine.abramova@gmail.com',
                
                // Все остальные данные
                Имя: formData.name,
                Телефон: formData.phone,
                "Количество гостей": formData.guests_count,
                "Дополнительные гости": formData.additional_guests || 'нет',
                "Что будут пить": formData.drinks,
                "Остаются на ночь": formData.stay,
                "Приезжают на авто": formData.car,
                "Любимый трек": formData.track || 'не указано',
                
                // Полный текст для удобного чтения в почте
                message: `НОВАЯ ЗАЯВКА НА СВАДЕБНУЮ ВЕЧЕРИНКУ!

КТО: ${formData.name}
ТЕЛЕФОН: ${formData.phone}

ГОСТИ:
• Всего: ${formData.guests_count} человека
${additionalGuests.length > 0 ? `• Имена: ${additionalGuests.join(', ')}\n` : ''}

ОТВЕТЫ:
• Напитки: ${formData.drinks}
• Ночевка: ${formData.stay}
• Авто: ${formData.car}
• Трек: ${formData.track || 'не указано'}

ОТПРАВЛЕНО: ${new Date().toLocaleString('ru-RU')}`
            })
        });
        
        if (response.ok) {
            // УСПЕХ!
            showFormMessage('Анкета успешно отправлена! Если ваши планы изменятся, пожалуйста, дайте нам знать', 'success');
            
            // Сбрасываем форму
            guestForm.reset();
            additionalGuestsContainer.style.display = 'none';
            additionalGuestsContainer.innerHTML = '';
            
            // Возвращаем кнопку
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                // Убираем сообщение через 5 сек
                const msg = document.querySelector('.form-message');
                if (msg) {
                    setTimeout(() => msg.remove(), 5000);
                }
            }, 2000);
            
        } else {
            throw new Error('Formspree вернул ошибку');
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        showFormMessage('Ошибка отправки. Попробуйте еще раз.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

    // Функция для получения выбранных опций в мультиселекте
function getSelectedOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];
    
    const selected = [];
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].selected) {
            // Более понятные названия для email
            const value = select.options[i].value;
            const text = select.options[i].text;
            
            // Используем текст опции для лучшей читаемости в email
            selected.push(text);
        }
    }
    return selected;
}
}

// ========== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ (ИСПРАВЛЕННАЯ) ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔥 DOM загружен, инициализируем...');
    
    // === ГАМБУРГЕР МЕНЮ (ДОБАВЬТЕ ЭТОТ БЛОК В НАЧАЛЕ) ===
    const hamburger = document.getElementById('hamburger');
    const menuLinks = document.querySelector('.menu-links');
    
    if (hamburger && menuLinks) {
        hamburger.addEventListener('click', function() {
            menuLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
        
        // Закрытие меню при клике на ссылку
        document.querySelectorAll('.menu-links a').forEach(link => {
            link.addEventListener('click', function() {
                menuLinks.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
        
        // Плавная прокрутка для меню
        document.querySelectorAll('.fixed-menu a, .scroll-down, .logo, .btn[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                if (this.getAttribute('href') && this.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    
                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 80,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
        
        // Управление высотой меню при скролле
        let lastScrollTop = 0;
        const header = document.getElementById('header');
        
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Если меню открыто, закрываем его при скролле
            if (menuLinks.classList.contains('active')) {
                menuLinks.classList.remove('active');
                hamburger.classList.remove('active');
            }
            
            lastScrollTop = scrollTop;
        });
        
        // Закрытие меню при клике вне его области
        document.addEventListener('click', function(event) {
            const isClickInsideMenu = menuLinks.contains(event.target) || hamburger.contains(event.target);
            
            if (!isClickInsideMenu && menuLinks.classList.contains('active')) {
                menuLinks.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
        
        console.log('✅ Гамбургер меню инициализировано');
    } else {
        console.log('⚠️ Элементы меню не найдены (возможно не на всех страницах)');
    }
    // === КОНЕЦ БЛОКА ГАМБУРГЕР МЕНЮ ===
    
    // 1. Запускаем обратный отсчет сразу
    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
    
    // 2. Инициализируем форму ответов (ДОБАВЬТЕ ЭТУ СТРОКУ!)
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

// ========== ТУРНИРНАЯ ТАБЛИЦА ==========

// сохранение результата игры (Firebase REST API)

async function saveResult(name, moves, timeInSeconds) {
    console.log('💾 Сохранение результата:', name, moves, timeInSeconds);
    
    try {
        const saveResultBtn = document.getElementById('save-result-btn');
        if (saveResultBtn) {
            saveResultBtn.disabled = true;
            saveResultBtn.textContent = 'Сохраняем...';
        }

        // ===== ИСПОЛЬЗУЕМ FIREBASE REST API =====
        const result = {
            name: name,
            time: timeInSeconds, // время в секундах для сортировки
            timeDisplay: formatTime(timeInSeconds), // форматированное время
            moves: moves,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('ru-RU'),
            game: 'memory' // метка игры
        };

        // Отправляем в Firebase
        const response = await fetch(`${FIREBASE_URL}/leaderboard.json`, {
            method: 'POST',
            body: JSON.stringify(result),
            headers: { 'Content-Type': 'application/json' }
        });

        const firebaseData = await response.json();
        console.log('✅ Результат сохранен в Firebase! ID:', firebaseData.name);

        // Сохраняем также локально
        saveToLocalStorageMemory(name, moves, timeInSeconds);
        
        // Обновляем таблицу лидеров
        await loadLeaderboard();
        
        // Показываем уведомление
        showNotification('🎉 Результат сохранен в таблице лидеров!');

        // Скрываем форму через 2 секунды
        setTimeout(() => {
            const saveResultForm = document.getElementById('save-result-form');
            if (saveResultForm) saveResultForm.style.display = 'none';
        }, 2000);

    } catch (error) {
        console.error('❌ Ошибка сохранения в Firebase:', error);
        
        // Fallback: сохраняем только локально
        saveToLocalStorageMemory(name, moves, timeInSeconds);
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

// Сохранение в localStorage как запасной вариант
function saveToLocalStorageMemory(name, moves, time) {
    try {
        const result = {
            name: name,
            moves: moves,
            time: time,
            timeDisplay: formatTime(time),
            timestamp: Date.now(),
            source: 'memory_game'
        };
        
        const key = `memory_result_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(result));
        console.log('💾 Результат игры Memory сохранен локально');
        
        // Также сохраняем в общий leaderboard localStorage
        saveToLocalStorage(result);
        
    } catch (e) {
        console.error('❌ Ошибка сохранения в localStorage:', e);
    }
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

// Загрузка турнирной таблицы

async function loadLeaderboard() {
    console.log('📥 Загружаем таблицу лидеров...');
    
    try {
        const response = await fetch(`${FIREBASE_URL}/leaderboard.json`);
        const data = await response.json();
        
        if (!data) {
            console.log('📭 Таблица лидеров пуста');
            // Показываем локальные данные
            const localData = getLocalLeaderboardMemory();
            displayLeaderboard(localData);
            return;
        }
        
        // Преобразуем объект в массив
        const resultsArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
        
        // Фильтруем только результаты игры Memory (если есть метка)
        const memoryResults = resultsArray.filter(item => 
            item.game === 'memory' || !item.game // или все результаты
        );
        
        // Сортируем по времени (меньше = лучше)
        memoryResults.sort((a, b) => a.time - b.time);
        
        console.log(`✅ Загружено ${memoryResults.length} результатов игры Memory`);
        displayLeaderboard(memoryResults);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки таблицы:', error);
        // Fallback: локальные данные
        const localData = getLocalLeaderboardMemory();
        displayLeaderboard(localData);
    }
}

// ========== ФОРМАТИРОВАНИЕ ВРЕМЕНИ ==========

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === null || seconds === undefined) {
        return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ========== ЛОКАЛЬНЫЕ ДАННЫЕ ДЛЯ MEMORY ==========

function getLocalLeaderboardMemory() {
    try {
        const results = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('memory_result_') || key.startsWith('game_result_'))) {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && (data.source === 'memory_game' || !data.source)) {
                    results.push(data);
                }
            }
        }
        // Сортируем по времени
        return results.sort((a, b) => (a.time || 0) - (b.time || 0));
    } catch (e) {
        console.error('❌ Ошибка чтения localStorage:', e);
        return [];
    }
}

// Отображение таблицы лидеров
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
            <p>Пока нет результатов</p>
            <p>Будьте первым!</p>
            <button id="refresh-leaderboard" class="refresh-btn">
                Обновить таблицу
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
