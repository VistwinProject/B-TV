# GitHub Pages

公開網址：https://vistwinproject.github.io/B-TV/

發布來源：VistwinProject/B-TV 的 b2.0-20260916 分支，B2.0ver/ 目錄。
GitHub Actions 工作流程：.github/workflows/pages.yml。
先執行 npm ci、npm test，再以 npm run build -- --base=/B-TV/ 建置發布。
本機專案沒有 .git；推送用工作目錄為 /private/tmp/b2-publish-20260921。
