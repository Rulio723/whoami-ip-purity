# WhoAmI 网络与设备指纹检测

一个部署在 Cloudflare 边缘运行时上的 `whoami.moe` 高保真实现：服务端首屏直接输出访问者公网 IP、Cloudflare 边缘地理与 ASN 信息，浏览器端使用 FingerprintJS 5.2.0 计算设备指纹。

## 架构

- **Cloudflare Worker 边缘 SSR**：单次请求生成完整 HTML。
- **真实访问者 IP**：优先读取 Cloudflare 注入且不可由公网客户端伪造的 `CF-Connecting-IP`，其次兼容反向代理头。
- **边缘地理信息**：读取 `request.cf` 的城市、地区、国家、时区、ASN 和网络服务商。
- **浏览器指纹**：锁定 `@fingerprintjs/fingerprintjs@5.2.0`，与目标站当前前端版本一致。
- **速度**：HTML、CSS、字体、图标和指纹库均由同一个 Worker/Cloudflare CDN 提供；无首屏第三方 API 请求。
- **命令行模式**：`curl https://你的域名` 只返回 IP 和换行。
- **隐私**：无数据库、无日志写入、页面响应 `Cache-Control: no-store`。

## 本地验证

```bash
npm install
npm test
```

构建产物为 `dist/server/index.js`，导出 Cloudflare Worker 兼容的 `fetch(request, env, ctx)`。

## 关键文件

- `worker/index.js`：边缘 SSR、真实 IP、UA 解析、API 与静态资源响应。
- `client.js`：FingerprintJS 与浏览器时区填充。
- `assets/main.css`：目标站布局与响应式视觉。
- `tests/worker.test.mjs`：真实 IP、HTML、指纹挂载点和 JSON API 测试。
