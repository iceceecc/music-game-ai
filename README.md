# CityPop Tap (GitHub Pages)

一个轻量的网页音乐交互小游戏，玩法灵感来自 Mikutap：点击/触摸网格即可发声，可开启自动演奏。纯前端（HTML/CSS/JS + WebAudio），**无需后端**，适合部署在 GitHub Pages。

## 预览
启用 GitHub Pages 后，访问：`https://<你的用户名>.github.io/<仓库名>/`

## 使用
- `index.html`：页面结构与 UI
- `style.css`：视觉样式（冷色霓虹主题 + 粒子）
- `main.js`：声音合成、鼓点、自动演奏、交互逻辑

## 本地运行
双击 `index.html` 直接打开即可（首次点击页面以激活音频权限）。

## 部署到 GitHub Pages
1. 新建仓库，例如 `citypop-tap`。
2. 上传本仓库内所有文件（或在本地 `git push` 上来）。
3. 打开仓库 **Settings → Pages**：
   - **Source** 选 `Deploy from a branch`
   - **Branch** 选 `main`，路径选 `/(root)`，保存
4. 等 1–2 分钟，访问：`https://<你的用户名>.github.io/<仓库名>/`

> 本仓库包含一个空的 `.nojekyll` 文件，确保 GitHub Pages 不用 Jekyll 处理静态资源。

## 自定义
- 主题切换：右上角下拉（冷霓虹/深海蓝/午夜紫/极光薄荷）
- 曲风切换：City Pop / Synthwave / Lo-Fi
- 参数：速度、视觉强度、自动演奏开关

## 许可
本模板代码以 MIT 许可开放（见 `LICENSE`）。
