# ========================================
# СКРИПТ ОЧИСТКИ ПОСЛЕ ИЗМЕНЕНИЙ
# Сохрани как: clean.ps1
# Запуск: .\clean.ps1
# ========================================

$projectRoot = "D:\OSPanel\domains\klinikapechi"
cd $projectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧹 ОЧИСТКА ПРОЕКТА" -ForegroundColor Cyan -BackgroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Очистка временных файлов
Write-Host "Очистка временных файлов..." -ForegroundColor Yellow
$tempPath = "D:\OSPanel\userdata\tmp"
if (Test-Path $tempPath) {
    Remove-Item "$tempPath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Временные файлы удалены" -ForegroundColor Green
}

# Инвалидация кэша скриптов
Write-Host "Инвалидация кэша скриптов..." -ForegroundColor Yellow
$version = Get-Date -Format "yyyyMMddHHmmss"
$indexHtml = Get-Content "index.html" -Raw -Encoding UTF8
$indexHtml = $indexHtml -replace 'src="/script\.js"', "src=`"/script.js?v=$version`""
$indexHtml = $indexHtml -replace 'href="/styles\.css"', "href=`"/styles.css?v=$version`""
[System.IO.File]::WriteAllText("index.html", $indexHtml, (New-Object System.Text.UTF8Encoding $False))
Write-Host "✅ Добавлена версия: ?v=$version" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ ОЧИСТКА ЗАВЕРШЕНА!" -ForegroundColor Green -BackgroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Обнови страницу в браузере: Ctrl+Shift+R" -ForegroundColor Yellow
Write-Host ""