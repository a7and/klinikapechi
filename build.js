#!/usr/bin/env node
/**
 * Скрипт сканирования папки articles и генерации articles_list.json
 * С правильной кодировкой UTF-8
 */

const fs = require('fs').promises;
const path = require('path');

console.log('🔍 Сканирую папку articles...\n');

async function scanArticles() {
    const articlesDir = path.join(__dirname, 'articles');
    const articlesList = [];
    
    try {
        await fs.access(articlesDir);
    } catch {
        console.log('⚠️  Папка articles не найдена');
        return [];
    }
    
    const yearDirs = await fs.readdir(articlesDir, { withFileTypes: true });
    
    for (const yearDir of yearDirs.filter(d => d.isDirectory())) {
        const yearPath = path.join(articlesDir, yearDir.name);
        const articleDirs = await fs.readdir(yearPath, { withFileTypes: true });
        
        console.log(`📁 Год: ${yearDir.name} (${articleDirs.filter(d => d.isDirectory()).length} статей)`);
        
        for (const articleDir of articleDirs.filter(d => d.isDirectory())) {
            const articlePath = path.join(yearPath, articleDir.name);
            const metaPath = path.join(articlePath, 'metadata.json');
            const contentPath = path.join(articlePath, 'content.html');
            
            try {
                const metaContent = await fs.readFile(metaPath, 'utf-8');
                const metadata = JSON.parse(metaContent);
                
                await fs.access(contentPath);
                
                const article = {
                    id: metadata.id || 0,
                    slug: metadata.slug?.trim() || articleDir.name,
                    title: metadata.title?.trim() || 'Без названия',
                    description: metadata.description?.trim() || '',
                    thumbnail: metadata.thumbnail?.trim() || '',
                    alt: metadata.alt?.trim() || '',
                    folder: `${yearDir.name}/${articleDir.name}`,
                    path: `/article/${yearDir.name}/${articleDir.name}/`,
                    ...metadata
                };
                
                articlesList.push(article);
                console.log(`✅ ${article.title} (${article.date || 'без даты'})`);
                
            } catch (err) {
                if (err.code === 'ENOENT') {
                    console.log(`⚠️  В статье "${articleDir.name}" отсутствует metadata.json или content.html`);
                } else {
                    console.log(`❌ Ошибка в статье "${articleDir.name}": ${err.message}`);
                }
            }
        }
    }
    
    return articlesList.sort((a, b) => {
        if (a.date && b.date) {
            return new Date(b.date) - new Date(a.date);
        }
        return (b.id || 0) - (a.id || 0);
    });
}

async function generateArticlesJSON(articles) {
    const outputPath = path.join(__dirname, 'articles_list.json');
    const data = {
        total: articles.length,
        lastUpdated: new Date().toISOString(),
        articles: articles
    };
    
    // Сохраняем с правильной кодировкой
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n✅ Сгенерирован articles_list.json (${articles.length} статей)`);
}

(async () => {
    try {
        const articles = await scanArticles();
        await generateArticlesJSON(articles);
        
        if (articles.length === 0) {
            console.log('\n⚠️  Статьи не найдены.');
        } else {
            console.log('\n🎉 Готово!');
        }
        
    } catch (err) {
        console.error(`\n❌ Ошибка: ${err.message}`);
        process.exit(1);
    }
})();