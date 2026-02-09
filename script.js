/**
 * Универсальный скрипт сайта Клиника Печей
 * Полностью совместимый код (без современных операторов)
 * Работает везде: локально, на сервере, на GitHub Pages
 */

// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
var articlesData = null;

// Определяем базовый путь для fetch-запросов
function getBasePath() {
    if (window.location.hostname === 'a7and.github.io') return '/klinikapechi';
    if (window.location.pathname.indexOf('/klinikapechi/') !== -1) return '/klinikapechi';
    return '';
}

var basePath = getBasePath();
console.log('✅ Скрипт загружен. Базовый путь:', basePath);

// ========================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ (доступны из HTML onclick)
// ========================================

// Открытие модального окна
function openApplicationModal() {
    var modal = document.getElementById('applicationModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// Закрытие модального окна
function closeApplicationModal() {
    var modal = document.getElementById('applicationModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        var form = document.getElementById('applicationForm');
        if (form) {
            form.reset();
            var preview = document.getElementById('photoPreview');
            if (preview) preview.innerHTML = '';
        }
    }
}

// Отправка заявки
function submitApplication(form) {
    event.preventDefault();
    
    var messageDiv = document.getElementById('formMessage');
    var submitBtn = form.querySelector('button[type="submit"]');
    
    var name = form.name.value.trim();
    var address = form.address.value.trim();
    var problem = form.problem.value.trim();
    var contacts = form.contacts.value.trim();
    
    if (!name || !address || !problem || !contacts) {
        messageDiv.innerHTML = '<p style="color:#dc3545;">Заполните все обязательные поля (*)</p>';
        return false;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    messageDiv.innerHTML = '<p style="color:#667eea;">Подготовка данных...</p>';
    
    // Обработка фото
    var photoUrl = '';
    var fileInput = form.photoFile;
    var urlInput = form.photoUrl;
    
    if (fileInput && fileInput.files && fileInput.files[0]) {
        messageDiv.innerHTML = '<p style="color:#667eea;">Загружаем фото...</p>';
        
        var file = fileInput.files[0];
        var formData = new FormData();
        formData.append('image', file);
        var apiKey = '91c857e8087827e5a2f8d645dd508331';
        
        fetch('https://api.imgbb.com/1/upload?key=' + apiKey, {
            method: 'POST',
            body: formData
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                photoUrl = data.data.url;
                sendFormData();
            } else {
                throw new Error(data.error ? data.error.message : 'Ошибка загрузки');
            }
        })
        .catch(function(error) {
            console.error('Ошибка загрузки фото:', error);
            messageDiv.innerHTML = '<p style="color:#dc3545;">Ошибка загрузки фото: ' + error.message + '</p>';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить заявку';
        });
        
    } else if (urlInput && urlInput.value.trim()) {
        photoUrl = urlInput.value.trim();
        sendFormData();
    } else {
        sendFormData();
    }
    
    function sendFormData() {
        var data = {
            timestamp: new Date().toISOString(),
            name: name,
            address: address,
            problem: problem,
            photoUrl: photoUrl,
            contacts: contacts,
            page: window.location.href
        };
        
        messageDiv.innerHTML = '<p style="color:#667eea;">Отправка заявки...</p>';
        
        var scriptUrl = 'https://script.google.com/macros/s/AKfycbzDBYv0nbdRBroVAxRIGg9VHWTvCLelYmXYrPmq7PlS6tb58h3ubZQOy5LzL_aHSRdPKg/exec';
        
        fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        messageDiv.innerHTML = '<p style="color:#28a745;font-weight:bold;">✅ Заявка отправлена!</p><p>Скоро свяжемся с вами.</p>';
        
        setTimeout(function() {
            closeApplicationModal();
        }, 2500);
    }
    
    return false;
}

// ========================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded. Путь:', window.location.pathname);
    
    var pathname = window.location.pathname;
    
    if (pathname.indexOf('/article/') !== -1) {
        loadArticlesList().then(function() {
            displayArticle();
        });
    } else if (pathname.indexOf('/articles.html') !== -1) {
        loadArticlesList().then(function() {
            displayAllArticles();
        });
    } else {
        loadArticlesList().then(function() {
            displayLatestArticles();
            initGalleryScroll();
        });
    }
    
    initModalButtons();
    initPhotoPreview();
});

// ========================================
// ЗАГРУЗКА И ОТОБРАЖЕНИЕ СТАТЕЙ
// ========================================

function loadArticlesList() {
    return new Promise(function(resolve) {
        var url = basePath ? basePath + '/articles_list.json' : 'articles_list.json';
        console.log('Загрузка статей:', url);
        
        fetch(url)
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(function(data) {
            articlesData = data.articles || data;
            console.log('✅ Загружено статей:', articlesData ? articlesData.length : 0);
            resolve(articlesData);
        })
        .catch(function(error) {
            console.error('❌ Ошибка загрузки статей:', error);
            resolve([]);
        });
    });
}

function displayLatestArticles() {
    var container = document.getElementById('articles-container');
    if (!container) return;
    
    if (!articlesData || articlesData.length === 0) {
        container.innerHTML = "<p class='no-articles'>Статьи пока отсутствуют</p>";
        return;
    }
    
    var latest = articlesData.slice(0, 3);
    var html = '';
    
    for (var i = 0; i < latest.length; i++) {
        var article = latest[i];
        var thumb = article.thumbnail ? (basePath ? basePath + article.thumbnail : article.thumbnail) : '';
        html += `
            <article class="article-card">
                <a href="${basePath}/article/${article.folder}/" class="article-link">
                    ${article.thumbnail ? '<div class="article-image-wrapper"><img src="' + thumb + '" alt="' + (article.alt || article.title) + '" class="article-image" onerror="this.parentElement.style.display=\'none\'"></div>' : ''}
                    <div class="article-info">
                        <h3 class="article-title">${escapeHtml(article.title)}</h3>
                        <p class="article-date">${article.date ? formatDate(article.date) : ''}</p>
                        <p class="article-description">${escapeHtml(article.description || '')}</p>
                        <span class="article-read-more">Читать далее →</span>
                    </div>
                </a>
            </article>
        `;
    }
    
    container.innerHTML = html;
}

function displayAllArticles() {
    var container = document.getElementById('articles-container');
    if (!container) return;
    
    if (!articlesData || articlesData.length === 0) {
        container.innerHTML = "<p class='no-articles'>Статьи пока отсутствуют</p>";
        return;
    }
    
    var html = `
        <div class="articles-header">
            <h2>Все статьи (${articlesData.length})</h2>
            <a href="${basePath}/" class="btn btn-secondary">← На главную</a>
        </div>
        <div class="articles-list">
    `;
    
    for (var i = 0; i < articlesData.length; i++) {
        var article = articlesData[i];
        var thumb = article.thumbnail ? (basePath ? basePath + article.thumbnail : article.thumbnail) : '';
        html += `
            <div class="article-item">
                <a href="${basePath}/article/${article.folder}/" class="article-item-link">
                    <div class="article-item-content">
                        <h3>${escapeHtml(article.title)}</h3>
                        <div class="article-item-meta">
                            ${article.date ? '<span class="date">' + formatDate(article.date) + '</span>' : ''}
                            ${article.category ? '<span class="category">' + escapeHtml(article.category) + '</span>' : ''}
                        </div>
                        <p class="article-item-desc">${escapeHtml(article.description || '')}</p>
                    </div>
                    ${article.thumbnail ? '<img src="' + thumb + '" alt="' + (article.alt || article.title) + '" class="article-item-image" onerror="this.style.display=\'none\'">' : ''}
                </a>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function displayArticle() {
    var contentDiv = document.getElementById('article-content');
    if (!contentDiv) return;
    
    if (!articlesData || articlesData.length === 0) {
        console.log('Данные статей не загружены');
        return;
    }
    
    var parts = window.location.pathname.split('/');
    var articleIndex = -1;
    for (var i = 0; i < parts.length; i++) {
        if (parts[i] === 'article') {
            articleIndex = i;
            break;
        }
    }
    
    if (articleIndex === -1 || parts.length < articleIndex + 3) {
        showError('Статья не найдена');
        return;
    }
    
    var year = parts[articleIndex + 1];
    var folder = parts[articleIndex + 2];
    var articlePath = year + '/' + folder;
    
    var article = null;
    for (var i = 0; i < articlesData.length; i++) {
        if (articlesData[i].folder === articlePath) {
            article = articlesData[i];
            break;
        }
    }
    
    if (!article) {
        console.error('Статья не найдена:', articlePath);
        showError('Статья не найдена в списке');
        return;
    }
    
    var url = basePath ? basePath + '/articles/' + articlePath + '/content.html' : 'articles/' + articlePath + '/content.html';
    console.log('Загрузка контента:', url);
    
    fetch(url)
    .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
    })
    .then(function(htmlContent) {
        document.title = article.title + ' — Клиника Печей';
        var meta = document.querySelector('meta[name="description"]');
        if (meta) meta.content = article.description || (article.title + ' — Клиника Печей');
        
        var thumb = article.thumbnail ? (basePath ? basePath + article.thumbnail : article.thumbnail) : '';
        
        contentDiv.innerHTML = `
            <article class="article-full">
                <h1 class="article-full-title">${escapeHtml(article.title)}</h1>
                <div class="article-full-meta">
                    ${article.date ? '<span class="article-full-date">' + formatDate(article.date) + '</span>' : ''}
                    ${article.author ? '<span class="article-full-author">Автор: ' + escapeHtml(article.author) + '</span>' : ''}
                    ${article.category ? '<span class="article-full-category">' + escapeHtml(article.category) + '</span>' : ''}
                </div>
                ${article.thumbnail ? '<div class="article-full-image"><img src="' + thumb + '" alt="' + (article.alt || article.title) + '" onerror="this.parentElement.style.display=\'none\'"></div>' : ''}
                <div class="article-full-content">${htmlContent}</div>
            </article>
            <div class="article-navigation">
                <a href="${basePath}/" class="btn btn-secondary">← На главную</a>
                <a href="${basePath}/articles.html" class="btn btn-secondary">← Все статьи</a>
            </div>
        `;
    })
    .catch(function(error) {
        console.error('Ошибка загрузки статьи:', error);
        showError('Не удалось загрузить статью: ' + error.message);
    });
}

// ========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================================

function formatDate(dateStr) {
    if (!dateStr) return '';
    var date = new Date(dateStr);
    var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear() + ' г.';
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(msg) {
    var container = document.getElementById('articles-container') || document.getElementById('article-content');
    if (container) container.innerHTML = '<div class="error-message">' + msg + '</div>';
}

function initModalButtons() {
    var buttons = document.querySelectorAll('[href="#"], .btn-application, .btn-call');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function(e) {
            e.preventDefault();
            openApplicationModal();
        });
    }
    
    var closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeApplicationModal);
    }
    
    var modal = document.getElementById('applicationModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeApplicationModal();
        });
    }
}

function initPhotoPreview() {
    var input = document.getElementById('photoUpload');
    var preview = document.getElementById('photoPreview');
    
    if (!input || !preview) return;
    
    input.addEventListener('change', function() {
        preview.innerHTML = '';
        if (input.files && input.files[0]) {
            var file = input.files[0];
            if (file.type.indexOf('image/') !== 0) {
                preview.innerHTML = '<p style="color:red;margin-top:10px;">Только изображения (JPG, PNG)</p>';
                input.value = '';
                return;
            }
            
            var reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = '<img src="' + e.target.result + '" alt="Предпросмотр" style="max-width:100%; max-height:150px; margin-top:10px; border-radius:8px;">';
            };
            reader.readAsDataURL(file);
        }
    });
    
    var container = input.closest('.file-upload-container');
    if (container) {
        container.addEventListener('click', function(e) {
            if (e.target !== input) {
                input.click();
            }
        });
    }
}

function initGalleryScroll() {
    var container = document.querySelector('.works-slider-container');
    var track = document.querySelector('.works-slider-track');
    if (!container || !track) {
        console.warn('Элементы галереи не найдены');
        return;
    }
    
    var interval = null;
    var slides = track.querySelectorAll('.works-slide');
    var count = Math.min(13, slides.length);
    var width = 0;
    for (var i = 0; i < count; i++) {
        width += slides[i].offsetWidth + 20;
    }
    width -= 20;
    
    function start() {
        if (interval) clearInterval(interval);
        interval = setInterval(function() {
            container.scrollLeft += 1;
            if (container.scrollLeft >= width) {
                container.scrollLeft = 0;
            }
        }, 30);
    }
    
    function stop() {
        if (interval) clearInterval(interval);
    }
    
    start();
    container.addEventListener('mouseenter', stop);
    container.addEventListener('mouseleave', function() {
        setTimeout(start, 2000);
    });
    container.addEventListener('touchstart', stop, { passive: true });
}