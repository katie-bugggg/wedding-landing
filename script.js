// Основной файл скриптов для свадебного лендинга

document.addEventListener('DOMContentLoaded', function() {
    // 1. Инициализация Яндекс Карты
    initYandexMap();
    
    // 2. Обратный отсчет до свадьбы
    initCountdownTimer();
    
    // 3. Обработка формы RSVP
    initRSVPForm();
    
    // 4. Динамические поля для дополнительных гостей
    initAdditionalGuests();
    
    // 5. Маска для телефона
    initPhoneMask();
    
    // 6. Переключение игры Memory
    initGameToggle();
    
    // 7. Плавный скролл для якорных ссылок
    initSmoothScroll();
    
    // 8. Анимация появления элементов при скролле
    initScrollAnimation();
});

// ===== 1. Яндекс Карта =====
function initYandexMap() {
    // Ждем загрузки API Яндекс.Карт
    if (typeof ymaps !== 'undefined') {
        ymaps.ready(function() {
            try {
                // Координаты пос. Ладыгино, Калининградская обл.
                const map = new ymaps.Map('map-yandex', {
                    center: [54.715, 20.134], // Примерные координаты
                    zoom: 12,
                    controls: ['zoomControl', 'fullscreenControl']
                });
                
                // Добавляем метку
                const placemark = new ymaps.Placemark([54.715, 20.134], {
                    balloonContent: 'Гостевой дом "Сосны, ели и залив"<br>пос. Ладыгино, Калининградская обл.'
                }, {
                    preset: 'islands#greenDotIconWithCaption'
                });
                
                map.geoObjects.add(placemark);
                
                // Открываем балун при загрузке
                placemark.balloon.open();
            } catch (error) {
                console.error('Ошибка инициализации карты:', error);
                document.getElementById('map-yandex').innerHTML = 
                    '<div class="map-error" style="text-align: center; padding: 50px; background: #f8f8f8; border-radius: 8px;">' +
                    '<p>Карта временно недоступна</p>' +
                    '<p>Координаты: пос. Ладыгино, Калининградская область</p>' +
                    '</div>';
            }
        });
    }
}

// ===== 2. Таймер обратного отсчета =====
function initCountdownTimer() {
    const weddingDate = new Date('June 13, 2026 16:00:00 GMT+3:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const timeLeft = weddingDate - now;
        
        if (timeLeft < 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    // Обновляем сразу и затем каждую секунду
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ===== 3. Обработка формы RSVP =====
function initRSVPForm() {
    const form = document.getElementById('wedding-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Проверка reCAPTCHA
        const recaptchaResponse = grecaptcha.getResponse();
        if (!recaptchaResponse) {
            showFormMessage('Пожалуйста, подтвердите, что вы не робот', 'error');
            return;
        }
        
        // Сбор данных формы
        const formData = new FormData(form);
        const data = {
            timestamp: new Date().toLocaleString('ru-RU'),
            name: formData.get('guest-name'),
            guestCount: formData.get('guest-count'),
            allergies: formData.get('allergies'),
            drinks: Array.from(form.querySelectorAll('input[name="drinks"]:checked')).map(cb => cb.value).join(', '),
            stayOption: formData.get('stay-option'),
            car: formData.get('car'),
            track: formData.get('track'),
            phone: formData.get('phone'),
            'g-recaptcha-response': recaptchaResponse
        };
        
        // Добавляем имена дополнительных гостей
        const additionalGuests = document.querySelectorAll('.additional-guest-field input');
        if (additionalGuests.length > 0) {
            data.additionalGuests = Array.from(additionalGuests).map(input => input.value).join('; ');
        }
        
        // Отправка данных (заглушка - здесь нужно подключить Google Apps Script)
        sendFormData(data);
    });
}

// Заглушка для отправки формы (реализация через Google Apps Script)
function sendFormData(data) {
    // Показываем индикатор загрузки
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    submitBtn.disabled = true;
    
    // В реальном проекте здесь будет fetch запрос к Google Apps Script
    // Пример:
    // fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
    //     method: 'POST',
    //     body: JSON.stringify(data)
    // })
    
    // Имитация отправки
    setTimeout(() => {
        showFormMessage('Спасибо! Ваша анкета успешно отправлена. Ждем вас на нашей свадьбе!', 'success');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Сброс reCAPTCHA
        grecaptcha.reset();
        
        // Очистка формы (кроме некоторых полей)
        document.getElementById('wedding-form').reset();
        document.getElementById('additional-guests').innerHTML = '';
    }, 1500);
}

function showFormMessage(message, type) {
    const messageDiv = document.getElementById('form-message');
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'form-message';
    }, 5000);
}

// ===== 4. Динамические поля для дополнительных гостей =====
function initAdditionalGuests() {
    const guestCountSelect = document.getElementById('guest-count');
    if (!guestCountSelect) return;
    
    guestCountSelect.addEventListener('change', function() {
        const count = parseInt(this.value);
        const container = document.getElementById('additional-guests');
        container.innerHTML = '';
        
        if (count > 1) {
            for (let i = 2; i <= count; i++) {
                const field = document.createElement('div');
                field.className = 'additional-guest-field';
                field.innerHTML = `
                    <label>Имя и фамилия гостя ${i}:</label>
                    <input type="text" name="guest-${i}" placeholder="Имя и фамилия" required>
                `;
                container.appendChild(field);
            }
        }
    });
}

// ===== 5. Маска для телефона =====
function initPhoneMask() {
    const phoneInput = document.getElementById('phone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', function(e) {
        let value = this.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value[0] === '7' || value[0] === '8') {
                value = value.substring(1);
            }
            
            let formatted = '+7 ';
            
            if (value.length > 0) {
                formatted += '(' + value.substring(0, 3);
            }
            if (value.length >= 4) {
                formatted += ') ' + value.substring(3, 6);
            }
            if (value.length >= 7) {
                formatted += '-' + value.substring(6, 8);
            }
            if (value.length >= 9) {
                formatted += '-' + value.substring(8, 10);
            }
            
            this.value = formatted;
        }
    });
}

// ===== 6. Переключение игры Memory =====
function initGameToggle() {
    const toggleBtn = document.getElementById('toggle-game');
    const gameContainer = document.getElementById('memory-game-container');
    
    if (!toggleBtn || !gameContainer) return;
    
    toggleBtn.addEventListener('click', function() {
        if (gameContainer.style.display === 'none') {
            gameContainer.style.display = 'block';
            toggleBtn.innerHTML = 'Скрыть игру <i class="fas fa-times"></i>';
            
            // Инициализируем игру при первом открытии
            if (!window.gameInitialized) {
                window.gameInitialized = true;
                // Инициализация игры будет в game.js
            }
        } else {
            gameContainer.style.display = 'none';
            toggleBtn.innerHTML = 'Сыграть в Memory <i class="fas fa-gamepad"></i>';
        }
    });
}

// ===== 7. Плавный скролл =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;
            
            e.preventDefault();
            const targetElement = document.querySelector(href);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== 8. Анимация появления при скролле =====
function initScrollAnimation() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Наблюдаем за всеми секциями
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
}
