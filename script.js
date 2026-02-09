/**
 * Универсальный скрипт сайта Клиника Печей
 * Работает в корне и в любой подпапке
 */

let articlesData = null;

// Определяем базовый путь из <base href>
const baseElement = document.querySelector('base');
const basePath = baseElement ? baseElement.getAttribute('href') : '/';

document.addEventListener("DOMContentLoaded", async function() {
    const pathname = window.location.pathname;
    
    if (pathname === basePath || pathname === basePath + 'index.html') {
        await loadArticlesList();
        await displayLatestArticles();
        initGalleryScroll();
    } 
    else if (pathname.includes("/article/")) {
        await loadArticlesList();
        await displayArticle();
    }
    else if (pathname === basePath + 'articles.html') {
        await loadArticlesList();
        await displayAllArticles();
    }
    
    initModalButtons();
    initPhotoPreview();
});

// Загрузка статей
async function loadArticlesList() {
    try {
        const response = await fetch("articles_list.json");
        if (!response.ok) throw new Error("Не удалось загрузить список статей");
        const data = await response.json();
        articlesData = data.articles || data;
        return articlesData;
    } catch (error) {
        console.error("Ошибка загрузки статей:", error);
        return [];
    }
}

// Отображение последних статей
async function displayLatestArticles() {
    const container = document.getElementById("articles-container");
    if (!container) return;
    if (!articlesData || articlesData.length === 0) {
        container.innerHTML = "<p class='no-articles'>Статьи пока отсутствуют</p>";
        return;
    }
    
    const latestArticles = articlesData.slice(0, 3);
    container.innerHTML = latestArticles.map(function(article) {
        return `
            <article class="article-card">
                <a href="article/${article.folder}/" class="article-link">
                    ${article.thumbnail ? `<div class="article-image-wrapper"><img src="${article.thumbnail}" alt="${article.alt || article.title}" class="article-image" onerror="this.parentElement.style.display='none'"></div>` : ""}
                    <div class="article-info">
                        <h3 class="article-title">${escapeHtml(article.title)}</h3>
                        <p class="article-date">${article.date ? formatDate(article.date) : ""}</p>
                        <p class="article-description">${escapeHtml(article.description || "")}</p>
                        <span class="article-read-more">Читать далее →</span>
                    </div>
                </a>
            </article>
        `;
    }).join("");
}

// Отображение всех статей
async function displayAllArticles() {
    const container = document.getElementById("articles-container");
    if (!container) return;
    if (!articlesData || articlesData.length === 0) {
        container.innerHTML = "<p class='no-articles'>Статьи пока отсутствуют</p>";
        return;
    }
    
    container.innerHTML = `
        <div class="articles-header">
            <h2>Все статьи (${articlesData.length})</h2>
            <a href="./" class="btn btn-secondary">← На главную</a>
        </div>
        <div class="articles-list">
            ${articlesData.map(function(article) {
                return `
                    <div class="article-item">
                        <a href="article/${article.folder}/" class="article-item-link">
                            <div class="article-item-content">
                                <h3>${escapeHtml(article.title)}</h3>
                                <div class="article-item-meta">
                                    ${article.date ? `<span class="date">${formatDate(article.date)}</span>` : ""}
                                    ${article.category ? `<span class="category">${escapeHtml(article.category)}</span>` : ""}
                                </div>
                                <p class="article-item-desc">${escapeHtml(article.description || "")}</p>
                            </div>
                            ${article.thumbnail ? `<img src="${article.thumbnail}" alt="${article.alt || article.title}" class="article-item-image" onerror="this.style.display='none'">` : ""}
                        </a>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

// Отображение одной статьи
async function displayArticle() {
    const contentDiv = document.getElementById("article-content");
    if (!contentDiv) return;
    
    if (!articlesData || articlesData.length === 0) {
        articlesData = await loadArticlesList();
    }
    
    const pathParts = window.location.pathname.split("/").filter(function(p) { return p; });
    if (pathParts[0] !== "article" || pathParts.length < 3) {
        showError("Статья не найдена");
        return;
    }
    
    const year = pathParts[1];
    const articleFolder = pathParts[2];
    const articlePath = year + "/" + articleFolder;
    
    if (!articlesData || articlesData.length === 0) {
        showError("Не удалось загрузить список статей");
        return;
    }
    
    const article = articlesData.find(function(a) { return a.folder === articlePath; });
    
    if (!article) {
        showError("Статья не найдена в списке");
        return;
    }
    
    try {
        const response = await fetch("articles/" + articlePath + "/content.html");
        if (!response.ok) throw new Error("HTTP " + response.status);
        const htmlContent = await response.text();
        
        document.title = article.title + " — Клиника Печей";
        var metaDesc = document.querySelector("meta[name='description']");
        if (metaDesc) metaDesc.setAttribute("content", article.description || (article.title + " — Клиника Печей"));
        
        contentDiv.innerHTML = `
            <article class="article-full">
                <h1 class="article-full-title">${escapeHtml(article.title)}</h1>
                <div class="article-full-meta">
                    ${article.date ? `<span class="article-full-date">${formatDate(article.date)}</span>` : ""}
                    ${article.author ? `<span class="article-full-author">Автор: ${escapeHtml(article.author)}</span>` : ""}
                    ${article.category ? `<span class="article-full-category">${escapeHtml(article.category)}</span>` : ""}
                </div>
                ${article.thumbnail ? `<div class="article-full-image"><img src="${article.thumbnail}" alt="${article.alt || article.title}" onerror="this.parentElement.style.display='none'"></div>` : ""}
                <div class="article-full-content">${htmlContent}</div>
            </article>
            <div class="article-navigation">
                <a href="./" class="btn btn-secondary">← На главную</a>
                <a href="articles.html" class="btn btn-secondary">← Все статьи</a>
            </div>
        `;
    } catch (error) {
        showError("Не удалось загрузить статью: " + error.message);
    }
}

// Вспомогательные функции
function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
}

function escapeHtml(text) {
    if (!text) return "";
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    var container = document.getElementById("articles-container") || document.getElementById("article-content");
    if (container) container.innerHTML = `<div class="error-message">${message}</div>`;
}

// Модальные окна
function initModalButtons() {
    var buttons = document.querySelectorAll("[href='#'], .btn-application, .btn-call");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function(e) {
            e.preventDefault();
            openApplicationModal();
        });
    }
    
    var closeModalBtn = document.querySelector(".close-modal");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeApplicationModal);
    }
    
    var modal = document.getElementById("applicationModal");
    if (modal) {
        modal.addEventListener("click", function(e) {
            if (e.target === modal) closeApplicationModal();
        });
    }
}

function openApplicationModal() {
    var modal = document.getElementById("applicationModal");
    if (modal) {
        modal.style.display = "block";
        document.body.style.overflow = "hidden";
    }
}

function closeApplicationModal() {
    var modal = document.getElementById("applicationModal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
        var form = document.getElementById("applicationForm");
        if (form) {
            form.reset();
            var preview = document.getElementById("photoPreview");
            if (preview) preview.innerHTML = "";
        }
    }
}

// Предпросмотр фото
function initPhotoPreview() {
    var fileInput = document.getElementById("photoUpload");
    var preview = document.getElementById("photoPreview");
    
    if (fileInput && preview) {
        fileInput.addEventListener("change", function() {
            preview.innerHTML = "";
            if (this.files && this.files[0]) {
                var file = this.files[0];
                if (!file.type.startsWith("image/")) {
                    preview.innerHTML = `<p style="color:red;margin-top:10px;">Только изображения (JPG, PNG)</p>`;
                    this.value = "";
                    return;
                }
                
                var reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Предпросмотр" style="max-width:100%; max-height:150px; margin-top:10px; border-radius:8px;">`;
                };
                reader.readAsDataURL(file);
            }
        });
        
        var container = fileInput.closest(".file-upload-container");
        if (container) {
            container.addEventListener("click", function(e) {
                if (e.target !== fileInput) {
                    fileInput.click();
                }
            });
        }
    }
}

// Загрузка фото в ImgBB
async function uploadImageToImgBB(file) {
    var formData = new FormData();
    formData.append("image", file);
    var apiKey = "91c857e8087827e5a2f8d645dd508331";
    
    var response = await fetch("https://api.imgbb.com/1/upload?key=" + apiKey, {
        method: "POST",
        body: formData
    });
    
    var data = await response.json();
    if (data.success) return data.data.url;
    throw new Error((data.error && data.error.message) || "Ошибка загрузки");
}

// Отправка заявки в Google Sheets
window.submitApplication = async function(form) {
    event.preventDefault();
    
    const messageDiv = document.getElementById("formMessage");
    const submitBtn = form.querySelector("button[type='submit']");
    
    const name = form.name.value.trim();
    const address = form.address.value.trim();
    const problem = form.problem.value.trim();
    const contacts = form.contacts.value.trim();
    
    if (!name || !address || !problem || !contacts) {
        messageDiv.innerHTML = `<p style="color:#dc3545;">Заполните все обязательные поля (*)</p>`;
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = "Отправка...";
    messageDiv.innerHTML = `<p style="color:#667eea;">Подготовка данных...</p>`;
    
    try {
        let photoUrl = "";
        const fileInput = form.photoFile;
        const urlInput = form.photoUrl;
        
        if (fileInput.files && fileInput.files[0]) {
            messageDiv.innerHTML = `<p style="color:#667eea;">Загружаем фото...</p>`;
            photoUrl = await uploadImageToImgBB(fileInput.files[0]);
        } else if (urlInput.value.trim()) {
            photoUrl = urlInput.value.trim();
        }
        
        const data = {
            timestamp: new Date().toISOString(),
            name: name,
            address: address,
            problem: problem,
            photoUrl: photoUrl,
            contacts: contacts,
            page: window.location.href
        };
        
        messageDiv.innerHTML = `<p style="color:#667eea;">Отправка заявки...</p>`;
        
        const scriptUrl = "https://script.google.com/macros/s/AKfycbzDBYv0nbdRBroVAxRIGg9VHWTvCLelYmXYrPmq7PlS6tb58h3ubZQOy5LzL_aHSRdPKg/exec";
        
        fetch(scriptUrl, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        });
        
        messageDiv.innerHTML = `<p style="color:#28a745;font-weight:bold;">✅ Заявка отправлена!</p>
                               <p>Скоро свяжемся с вами.</p>`;
        
        setTimeout(function() {
            closeApplicationModal();
        }, 2500);
        
    } catch (error) {
        console.error("Ошибка отправки:", error);
        messageDiv.innerHTML = `<p style="color:#dc3545;font-weight:bold;">❌ Ошибка отправки</p>
                               <p>${error.message}</p>
                               <p style="font-size:14px;margin-top:10px;">Попробуйте позже или позвоните:<br>
                               <strong>+7 (960) 218-84-00</strong></p>`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Отправить заявку";
    }
    
    return false;
};

// Галерея работ
function initGalleryScroll() {
    var sliderContainer = document.querySelector(".works-slider-container");
    var sliderTrack = document.querySelector(".works-slider-track");
    if (!sliderContainer || !sliderTrack) return;
    
    var scrollInterval = null;
    var slides = sliderTrack.querySelectorAll(".works-slide");
    var originalCount = 13;
    var totalWidth = 0;
    for (var i = 0; i < originalCount && i < slides.length; i++) {
        totalWidth += slides[i].offsetWidth + 20;
    }
    totalWidth -= 20;
    
    function startScroll() {
        if (scrollInterval) clearInterval(scrollInterval);
        scrollInterval = setInterval(function() {
            sliderContainer.scrollLeft += 1;
            if (sliderContainer.scrollLeft >= totalWidth) {
                sliderContainer.scrollLeft = 0;
            }
        }, 30);
    }
    
    function stopScroll() {
        if (scrollInterval) clearInterval(scrollInterval);
    }
    
    startScroll();
    
    sliderContainer.addEventListener("mouseenter", stopScroll);
    sliderContainer.addEventListener("mouseleave", function() { setTimeout(startScroll, 2000); });
    sliderContainer.addEventListener("touchstart", stopScroll, { passive: true });
}