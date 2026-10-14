#!/usr/bin/env bash
# Сборка веб-демо и публикация в ветку gh-pages (GitHub Pages).
# Адрес: https://<owner>.github.io/<repo>/
set -euo pipefail

REPO_NAME="$(basename -s .git "$(git config --get remote.origin.url)")"
OUT="$(mktemp -d)"

EXPO_BASE_URL="/${REPO_NAME}" CI=1 npx expo export --platform web --output-dir "$OUT"

# SPA-фолбэк: GitHub Pages отдаёт 404.html на любой неизвестный путь (/event/…, /community/…).
cp "$OUT/index.html" "$OUT/404.html"
# Папка _expo начинается с подчёркивания — без .nojekyll Jekyll её выбросит.
touch "$OUT/.nojekyll"

cd "$OUT"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name || echo deploy)" \
    -c user.email="$(git -C "$OLDPWD" config user.email || echo deploy@localhost)" \
    commit -q -m "Веб-демо $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f "$(git -C "$OLDPWD" config --get remote.origin.url)" gh-pages
echo "Опубликовано: https://$(git -C "$OLDPWD" config --get remote.origin.url | sed -E 's#.*github.com[:/]([^/]+)/.*#\1#').github.io/${REPO_NAME}/"
