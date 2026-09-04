# WhoAmI — npm + MaxMind 版

与 `whoami.moe` 页面保持一致的 Node.js 服务。Cloudflare 负责 CDN、TLS 和真实访客 IP 转发，Node/Express 在源站服务端读取本地 MaxMind MMDB 并渲染完整 HTML，浏览器端使用 htmx 4.0.0、hx-live 和 FingerprintJS 5.2.0。

## 与源站架构的关系

截至 2026-09-02，从源站公开响应可以确认：Cloudflare 位于站点前端，页面是服务端输出的 HTML，浏览器资源包含 htmx 4.0.0、hx-live 和 FingerprintJS 5.2.0。本项目已经对齐这些可观察部分，并实现相同的 `Accept` 分流、真实 IP 展示、MaxMind 字段和浏览器指纹。

2026-09-02 的源站更新也已同步：异步 `/hostname` 反向 DNS、OpenStreetMap 城市链接、`logo.svg`、Open Graph 图片与元数据、Maple Mono 700 Italic 字体、新版加载骨架，以及非浏览器 UA 的 `Bot` 显示。

2026-09-04 增加 IP 纯净度检测：综合 MaxMind ASN、服务商分类和 PTR 反向 DNS 信号生成 0–100 风险系数、纯净度、网络属性、置信度和可解释风险因子。检测通过异步片段加载，不阻塞首屏，也不依赖第三方在线评分接口。

同日最终核验使用相同 Chrome target、viewport、DPR 和浏览器状态依次截图，源站与本地渲染共 `2,967,040` 个像素，差异像素为 `0`；Node 测试为 `9/9` 通过，生产 Docker 镜像构建及容器端点验证通过。

源站没有公开服务端源码，因此无法从外部证明它内部也使用 Node.js、Express 或同一种 MMDB 加载方式。本项目属于“公开行为和可观察前端栈一致、后端实现可独立部署”，不是声称拿到了源站私有后端源码。

## 架构

```text
Browser / curl
      │
      ▼
Cloudflare CDN / Tunnel
      │ CF-Connecting-IP
      ▼
Node.js 22 + Express 5
      ├── GeoLite2-City.mmdb
      ├── GeoLite2-ASN.mmdb
      ├── 服务端 HTML 渲染
      └── Vite 打包并生成带内容哈希的 htmx/hx-live + FingerprintJS 资源
```

## MaxMind 数据

默认生产依赖中包含 GeoLite2 City 和 ASN MMDB，Node 服务通过 MaxMind 官方 `@maxmind/geoip2-node` Reader 查询。也可以通过环境变量换成你自己的 GeoLite2/GeoIP2 数据库：

```dotenv
MAXMIND_CITY_DB=/app/databases/GeoLite2-City.mmdb
MAXMIND_ASN_DB=/app/databases/GeoLite2-ASN.mmdb
```

示例 IP `216.40.85.151` 的本地 MMDB 实测结果：

```text
城市      洛杉矶
邮编      90060
地区      加州
国家      美国
时区      America/Los_Angeles
网络      216.40.84.0/22
ASN       AS1054 ZONT-LLC
服务商    Zont LLC
```

## 本地运行

```powershell
cd D:\Codex\IP
npm ci
npm test
npm start
```

打开 `http://127.0.0.1:3000`。模拟参考截图 IP：

```powershell
$env:DEV_IP_OVERRIDE='216.40.85.151'
npm start
```

接口：

```text
GET /             浏览器返回 HTML；curl 返回纯文本 IP
GET /hostname     异步反向 DNS 主机名查询；无 PTR 时返回空文本
GET /api/info     MaxMind 查询结果 JSON
GET /api/purity   当前 IP 的纯净度、风险系数与风险因子 JSON
GET /purity       页面异步加载的纯净度 HTML 片段
GET /healthz      健康状态
```

## Docker + Cloudflare Tunnel 部署

1. 在 Cloudflare Zero Trust 创建 Tunnel，把公网主机名指向：

   ```text
   http://whoami:3000
   ```

2. 创建 `.env`：

   ```dotenv
   CLOUDFLARE_TUNNEL_TOKEN=你的Tunnel令牌
   MAXMIND_CITY_DB=
   MAXMIND_ASN_DB=
   ```

3. 部署：

   ```bash
   docker compose up -d --build
   docker compose ps
   curl http://127.0.0.1:3000/healthz
   ```

应用端口只绑定 `127.0.0.1`，公网流量通过 Cloudflare Tunnel 进入，避免客户端绕开 Cloudflare 伪造 `CF-Connecting-IP`。

## 使用 MaxMind 官方账户更新数据库

创建 MaxMind GeoLite2 账户和 License Key，然后运行：

```powershell
$env:MAXMIND_ACCOUNT_ID='你的账户ID'
$env:MAXMIND_LICENSE_KEY='你的License Key'
npm run maxmind:update
```

下载结果：

```text
databases/GeoLite2-City.mmdb
databases/GeoLite2-ASN.mmdb
```

随后在 `.env` 中加入：

```dotenv
MAXMIND_CITY_DB=/app/databases/GeoLite2-City.mmdb
MAXMIND_ASN_DB=/app/databases/GeoLite2-ASN.mmdb
```

再执行：

```bash
docker compose up -d --build
```

不要把 MaxMind 账户 ID、License Key 或商业数据库提交到 Git。

## 关键目录

```text
src/app.js          Express 路由和响应头
src/ip.js           CF-Connecting-IP 与 UA 解析
src/hostname.js     有超时保护的反向 DNS 查询
src/maxmind.js      City/ASN MMDB 加载与查询
src/purity.js       IP 纯净度评分、解释因子与查询缓存
src/template.js     与源站一致的服务端 HTML
client.js           htmx/hx-live + FingerprintJS
scripts/build.mjs   浏览器资源构建与内容哈希缓存
Dockerfile          Node 22 生产镜像
compose.yaml        Node 服务 + Cloudflare Tunnel
```
