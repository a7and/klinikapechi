/**
 * Универсальный скрипт — работает и в корне, и в подпапке
 */

// Вспомогательные функции
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ' г.';
}

// Загрузка статей (относительный путь)
function loadArticlesList() {
    return fetch('articles_list.json')
        .then(function(response) {
            if (!response.ok) throw new Error('Ошибка загрузки');
            return response.json();
        })
        .then(function(data) {
            window.articlesData = data.articles || data;
            return window.articlesData;
        })
        .catch(function(error) {
            console.error('Ошибка:', error);
            return [];
        });
}

// Отображение последних статей
function displayLatestArticles() {
    var container = document.getElementById('articles-container');
    if (!container || !window.articlesData || window.articlesData.length === 0) return;
    
    var html = '';
    for (var i = 0; i < Math.min(3, window.articlesData.length); i++) {
        var a = window.articlesData[i];
        html += `
            <article class="article-card">
                <a href="article/${a.folder}/" class="article-link">
                    ${a.thumbnail ? '<div class="article-image-wrapper"><img src="' + a.thumbnail + '" alt="' + (a.alt || a.title) + '" class="article-image"></div>' : ''}
                    <div class="article-info">
                        <h3 class="article-title">${escapeHtml(a.title)}</h3>
                        <p class="article-date">${a.date ? formatDate(a.date) : ''}</p>
                        <p class="article-description">${escapeHtml(a.description || '')}</p>
                        <span class="article-read-more">Читать далее →</span>
                    </div>
                </a>
            </article>
        `;
    }
    container.innerHTML = html;
}

// Отображение всех статей
function displayAllArticles() {
    var container = document.getElementById('articles-container');
    if (!container || !window.articlesData || window.articlesData.length === 0) return;
    
    var html = '<div class="articles-header"><h2>Все статьи (' + window.articlesData.length + ')</h2><a href="./" class="btn btn-secondary">← На главную</a></div><div class="articles-list">';
    
    for (var i = 0; i < window.articlesData.length; i++) {
        var a = window.articlesData[i];
        html += `
            <div class="article-item">
                <a href="article/${a.folder}/" class="article-item-link">
                    <div class="article-item-content">
                        <h3>${escapeHtml(a.title)}</h3>
                        <div class="article-item-meta">
                            ${a.date ? '<span class="date">' + formatDate(a.date) + '</span>' : ''}
                            ${a.category ? '<span class="category">' + escapeHtml(a.category) + '</span>' : ''}
                        </div>
                        <p class="article-item-desc">${escapeHtml(a.description || '')}</p>
                    </div>
                    ${a.thumbnail ? '<img src="' + a.thumbnail + '" alt="' + (a.alt || a.title) + '" class="article-item-image">' : ''}
                </a>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Отображение статьи
function displayArticle() {
    // Скрываем лишние разделы
    var gallery = document.querySelector('.gallery-section');
    var articlesSec = document.querySelector('.articles-section, #articles-container');
    if (gallery) gallery.style.display = 'none';
    if (articlesSec) articlesSec.style.display = 'none';
    
    var container = document.getElementById('article-content');
    if (!container) {
        console.error('Контейнер #article-content не найден!');
        return;
    }
    container.style.display = 'block';
    
    // Получаем путь статьи из URL
    var parts = window.location.pathname.split('/').filter(function(p) { return p; });
    var idx = parts.indexOf('article');
    if (idx === -1 || parts.length < idx + 3) {
        container.innerHTML = '<p class="error-message">Статья не найдена</p>';
        return;
    }
    
    var path = parts[idx + 1] + '/' + parts[idx + 2];
    var article = null;
    for (var i = 0; i < window.articlesData.length; i++) {
        if (window.articlesData[i].folder === path) {
            article = window.articlesData[i];
            break;
        }
    }
    
    if (!article) {
        container.innerHTML = '<p class="error-message">Статья не найдена в списке</p>';
        return;
    }
    
    // Загружаем контент (относительный путь)
    fetch('articles/' + path + '/content.html')
        .then(function(response) {
            if (!response.ok) throw new Error('Ошибка загрузки контента');
            return response.text();
        })
        .then(function(html) {
            document.title = article.title + ' — Клиника Печей';
            
            container.innerHTML = `
                <article class="article-full">
                    <h1 class="article-full-title">${escapeHtml(article.title)}</h1>
                    <div class="article-full-meta">
                        ${article.date ? '<span class="article-full-date">' + formatDate(article.date) + '</span>' : ''}
                        ${article.author ? '<span class="article-full-author">Автор: ' + escapeHtml(article.author) + '</span>' : ''}
                        ${article.category ? '<span class="article-full-category">' + escapeHtml(article.category) + '</span>' : ''}
                    </div>
                    ${article.thumbnail ? '<div class="article-full-image"><img src="' + article.thumbnail + '" alt="' + (article.alt || article.title) + '"></div>' : ''}
                    <div class="article-full-content">${html}</div>
                </article>
                <div class="article-navigation">
                    <a href="./" class="btn btn-secondary">← На главную</a>
                    <a href="articles.html" class="btn btn-secondary">Все статьи</a>
                </div>
            `;
        })
        .catch(function(error) {
            container.innerHTML = '<p class="error-message">Ошибка загрузки статьи: ' + error.message + '</p>';
        });
}

// Галерея работ
function initGalleryScroll() {
    var container = document.querySelector('.works-slider-container');
    var track = document.querySelector('.works-slider-track');
    if (!container || !track) return;
    
    var interval = null;
    var slides = track.querySelectorAll('.works-slide');
    var count = Math.min(13, slides.length);
    var width = 0;
    for (var i = 0; i < count; i++) width += slides[i].offsetWidth + 20;
    width -= 20;
    
    function start() {
        if (interval) clearInterval(interval);
        interval = setInterval(function() {
            container.scrollLeft += 1;
            if (container.scrollLeft >= width) container.scrollLeft = 0;
        }, 30);
    }
    
    function stop() {
        if (interval) clearInterval(interval);
    }
    
    start();
    container.addEventListener('mouseenter', stop);
    container.addEventListener('mouseleave', function() { setTimeout(start, 2000); });
    container.addEventListener('touchstart', stop, { passive: true });
}

// ГЛОБАЛЬНЫЕ ФУНКЦИИ МОДАЛЬНОГО ОКНА
function openApplicationModal() {
    var modal = document.getElementById('applicationModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeApplicationModal() {
    var modal = document.getElementById('applicationModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        var form = document.getElementById('applicationForm');
        if (form) form.reset();
    }
}

function submitApplication(form) {
    alert('Заявка отправлена! Скоро свяжемся с вами по телефону +7 (960) 218-84-00');
    closeApplicationModal();
    return false;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('Скрипт загружен. Путь:', window.location.pathname);
    
    loadArticlesList().then(function() {
        var path = window.location.pathname;
        
        // Определяем, какая страница открыта
        if (path.includes('/article/') && !path.endsWith('/articles.html')) {
            displayArticle();
        } else if (path.endsWith('/articles.html')) {
            displayAllArticles();
        } else {
            displayLatestArticles();
            initGalleryScroll();
        }
    });
    
    // Кнопки модального окна
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
});