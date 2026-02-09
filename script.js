/**
 * Рабочий скрипт с правильными путями
 * Работает и в корне, и в подпапке /klinikapechi/
 */

// Определяем базовый путь ДИНАМИЧЕСКИ
const getBasePath = () => {
    // Если на GitHub Pages
    if (window.location.hostname === 'a7and.github.io') {
        return '/klinikapechi';
    }
    // Если на удаленном сервере в папке /klinikapechi/
    if (window.location.pathname.startsWith('/klinikapechi/')) {
        return '/klinikapechi';
    }
    // По умолчанию — корень
    return '';
};

const basePath = getBasePath();
console.log('✅ Базовый путь:', basePath);

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

// Загрузка статей (с защитой от ошибок)
async function loadArticlesList() {
    try {
        const url = basePath + '/articles_list.json';
        console.log('📥 Загружаем:', url);
        
        const response = await fetch(url);
        
        // Проверяем тип контента
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
            console.error('❌ Получен не JSON:', contentType);
            console.error('💡 Проверьте, существует ли файл:', url);
            return [];
        }
        
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        
        const data = await response.json();
        window.articlesData = data.articles || data;
        console.log('✅ Загружено статей:', window.articlesData ? window.articlesData.length : 0);
        return window.articlesData;
    } catch (error) {
        console.error('❌ Ошибка загрузки статей:', error);
        console.error('💡 Возможные причины:');
        console.error('   1. Файл articles_list.json отсутствует');
        console.error('   2. Неправильный путь к файлу');
        console.error('   3. Сервер возвращает HTML вместо JSON (404 ошибка)');
        return [];
    }
}

// Отображение последних статей
function displayLatestArticles() {
    const container = document.getElementById('articles-container');
    if (!container || !window.articlesData || window.articlesData.length === 0) return;
    
    let html = '';
    for (let i = 0; i < Math.min(3, window.articlesData.length); i++) {
        const a = window.articlesData[i];
        html += `
            <article class="article-card">
                <a href="${basePath}/article/${a.folder}/" class="article-link">
                    ${a.thumbnail ? `<div class="article-image-wrapper"><img src="${a.thumbnail}" alt="${a.alt || a.title}" class="article-image"></div>` : ''}
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
    const container = document.getElementById('articles-container');
    if (!container || !window.articlesData || window.articlesData.length === 0) return;
    
    let html = `<div class="articles-header"><h2>Все статьи (${window.articlesData.length})</h2><a href="${basePath}/" class="btn btn-secondary">← На главную</a></div><div class="articles-list">`;
    
    for (let i = 0; i < window.articlesData.length; i++) {
        const a = window.articlesData[i];
        html += `
            <div class="article-item">
                <a href="${basePath}/article/${a.folder}/" class="article-item-link">
                    <div class="article-item-content">
                        <h3>${escapeHtml(a.title)}</h3>
                        <div class="article-item-meta">
                            ${a.date ? `<span class="date">${formatDate(a.date)}</span>` : ''}
                            ${a.category ? `<span class="category">${escapeHtml(a.category)}</span>` : ''}
                        </div>
                        <p class="article-item-desc">${escapeHtml(a.description || '')}</p>
                    </div>
                    ${a.thumbnail ? `<img src="${a.thumbnail}" alt="${a.alt || a.title}" class="article-item-image">` : ''}
                </a>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Отображение статьи
async function displayArticle() {
    // Скрываем лишние разделы
    const gallery = document.querySelector('.gallery-section');
    const articlesSec = document.querySelector('.articles-section, #articles-container');
    if (gallery) gallery.style.display = 'none';
    if (articlesSec) articlesSec.style.display = 'none';
    
    const container = document.getElementById('article-content');
    if (!container) {
        console.error('❌ Контейнер #article-content не найден!');
        return;
    }
    container.style.display = 'block';
    
    // Получаем путь статьи из URL
    const parts = window.location.pathname.split('/').filter(p => p);
    const idx = parts.indexOf('article');
    if (idx === -1 || parts.length < idx + 3) {
        container.innerHTML = '<p class="error-message">Статья не найдена</p>';
        return;
    }
    
    const path = parts[idx + 1] + '/' + parts[idx + 2];
    const article = window.articlesData?.find(a => a.folder === path);
    
    if (!article) {
        container.innerHTML = '<p class="error-message">Статья не найдена в списке</p>';
        console.error('❌ Статья не найдена:', path);
        console.error('📊 Доступные статьи:', window.articlesData?.map(a => a.folder));
        return;
    }
    
    // Загружаем контент
    try {
        const url = basePath + '/articles/' + path + '/content.html';
        console.log('📥 Загружаем контент:', url);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        const html = await response.text();
        document.title = article.title + ' — Клиника Печей';
        
        container.innerHTML = `
            <article class="article-full">
                <h1 class="article-full-title">${escapeHtml(article.title)}</h1>
                <div class="article-full-meta">
                    ${article.date ? `<span class="article-full-date">${formatDate(article.date)}</span>` : ''}
                    ${article.author ? `<span class="article-full-author">Автор: ${escapeHtml(article.author)}</span>` : ''}
                    ${article.category ? `<span class="article-full-category">${escapeHtml(article.category)}</span>` : ''}
                </div>
                ${article.thumbnail ? `<div class="article-full-image"><img src="${article.thumbnail}" alt="${article.alt || article.title}"></div>` : ''}
                <div class="article-full-content">${html}</div>
            </article>
            <div class="article-navigation">
                <a href="${basePath}/" class="btn btn-secondary">← На главную</a>
                <a href="${basePath}/articles.html" class="btn btn-secondary">Все статьи</a>
            </div>
        `;
    } catch (error) {
        console.error('❌ Ошибка загрузки статьи:', error);
        container.innerHTML = `<p class="error-message">Ошибка загрузки статьи: ${error.message}</p>`;
    }
}

// Галерея работ
function initGalleryScroll() {
    const container = document.querySelector('.works-slider-container');
    const track = document.querySelector('.works-slider-track');
    if (!container || !track) return;
    
    let interval = null;
    const slides = track.querySelectorAll('.works-slide');
    const count = Math.min(13, slides.length);
    let width = 0;
    for (let i = 0; i < count; i++) width += slides[i].offsetWidth + 20;
    width -= 20;
    
    function start() {
        if (interval) clearInterval(interval);
        interval = setInterval(() => {
            container.scrollLeft += 1;
            if (container.scrollLeft >= width) container.scrollLeft = 0;
        }, 30);
    }
    
    function stop() {
        if (interval) clearInterval(interval);
    }
    
    start();
    container.addEventListener('mouseenter', stop);
    container.addEventListener('mouseleave', () => setTimeout(start, 2000));
    container.addEventListener('touchstart', stop, { passive: true });
}

// ГЛОБАЛЬНЫЕ ФУНКЦИИ МОДАЛЬНОГО ОКНА
function openApplicationModal() {
    const modal = document.getElementById('applicationModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeApplicationModal() {
    const modal = document.getElementById('applicationModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        const form = document.getElementById('applicationForm');
        if (form) form.reset();
    }
}

function submitApplication(form) {
    alert('Заявка отправлена! Скоро свяжемся с вами по телефону +7 (960) 218-84-00');
    closeApplicationModal();
    return false;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ Скрипт загружен. Путь:', window.location.pathname);
    
    await loadArticlesList();
    
    const path = window.location.pathname;
    
    if (path.includes('/article/') && !path.endsWith('/articles.html')) {
        await displayArticle();
    } else if (path.endsWith('/articles.html')) {
        displayAllArticles();
    } else {
        displayLatestArticles();
        initGalleryScroll();
    }
    
    // Кнопки модального окна
    document.querySelectorAll('[href="#"], .btn-application, .btn-call').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            openApplicationModal();
        });
    });
    
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeApplicationModal);
    
    const modal = document.getElementById('applicationModal');
    if (modal) modal.addEventListener('click', e => {
        if (e.target === modal) closeApplicationModal();
    });
});