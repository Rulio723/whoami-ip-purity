# Who am I? — 静态复刻版

一个粉粉可爱的访客信息展示页（复刻自 [whoami.moe](https://whoami.moe/)），**纯静态**，可直接部署到 GitHub Pages。

它读取访问者的 IP、地理位置和浏览器信息并展示出来。

## 功能

- 🌐 **IP 地址** — 显示访客 IP
- 📍 **Origin 区块** — 国家/地区、时区、ASN、ISP（来自免费 IP 地理 API）
- 🧭 **Browser 区块** — 平台、浏览器、时区、语言（纯前端获取，不发请求）
- 🎨 粉色可爱卡片风格 + 加载骨架动画，等比复刻原站

## 技术栈

- 纯 HTML + CSS + JS，**零构建、零依赖**
- IP 地理位置：免费 API（`ipapi.co`，备选 `ip-api.com`）
- 字体/图标：已本地化（Open Runde、Maple Mono、Twemoji 国旗、自定义 icon）
- 所有资源用**相对路径**，兼容 GitHub Pages 子路径部署

## 部署到 GitHub Pages（两种方式）

### 方式一：GitHub Actions（自动，推荐）

1. 把这个文件夹作为仓库**根目录**（`index.html` 在根上）
2. 推送到 GitHub 的 `main` 分支
3. 仓库 **Settings → Pages** → Source 选 **GitHub Actions**
4. 推送后 Action 自动构建部署，几分钟后上线

`.github/workflows/deploy.yml` 已配置好。

### 方式二：手动上传（最简单）

1. Settings → Pages → Source 选 **Deploy from a branch** → `main` / `/(root)`
2. 把 `index.html` + `assets/` 提交推送到 main 分支
3. 完成，访问 `https://<用户名>.github.io/<仓库名>/`

## 自定义

- **改文案**：编辑 `index.html`
- **改配色**：编辑 `assets/main.css` 顶部的 `--pink-*` 变量
- **换图标**：替换 `assets/icon.svg`
- **改 API**：编辑 `assets/main.js` 顶部的 `IP_API_URL`（当前 `https://ipapi.co/json/`）

## ⚠️ 重要说明（IP 地理 API 限制）

GitHub Pages 是纯静态托管，**没有后端**，所以 IP 地理位置靠浏览器直接调用第三方免费 API：

| API | 免费额度 | 要求 |
|---|---|---|
| `ipapi.co/json/`（当前默认）| 每天 1000 次 | HTTPS，无需 key |
| `ip-api.com`（备选 fallback）| 每分钟 15 次 / 每 IP | **免费版不支持 HTTPS**（仅 HTTP） |

> ⚠️ **GitHub Pages 是 HTTPS**，浏览器会阻止混合内容（HTTP 请求）。所以：
> - 默认用 **ipapi.co**（HTTPS，稳定）
> - ip-api.com 的 fallback 在 HTTPS 页面上会失败，这是已知限制
> - 如果访客量大或需要更精确的地理定位，建议：
>   1. 在 [ipapi.co](https://ipapi.co) 注册免费/付费 key
>   2. 或只做「显示 IP」功能（可改用 Cloudflare Trace 等 HTTPS 免费接口）

## 隐私

页面**不存储**任何访客数据。IP 地理查询由浏览器直接发给第三方 API（ipapi.co），这些服务的隐私政策适用。

## 与原站差异

- 原站用服务端渲染（MaxMind 精确库 + hostname 反查），本版用浏览器端免费 API，地理精度略低
- 移除了原站的访问统计脚本（track.ecchi.cx），本版无追踪
- 原站版权归 whoami.moe 所有；本版为个人学习/自用复刻，请勿用于商业
