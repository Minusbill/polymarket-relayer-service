# 后端 IP 代理配置任务书

范围
- 为前端 TASKS_IP.md 提供 owner 级隔离的代理配置 API。
- 配置存储在 `src/ip-config.json`（本地文件持久化）。
- 保证隔离：owner 只能查询/更新自己名下的钱包配置。

当前实现状态（现在已完成）
- 已对齐 action 接口（全部 GET/POST）：
  - POST `/proxy/configs/query`
  - POST `/proxy/configs/sync-owner-wallets`
  - POST `/proxy/wallets/update`
  - POST `/proxy/wallets/remove`
  - POST `/proxy/wallets/batch-sync`
- 仍保留（兼容/可选）：
  - GET `/proxy/configs/:owner`
  - POST `/proxy/configs`

API 基础地址
- 默认：`http://127.0.0.1:4000`
- 端口：环境变量 `PORT`（默认 4000）

API 明细（前端对接）

1) 查询 owner 配置列表
POST `/proxy/configs/query`
请求：
```json
{ "owner": "0x..." }
```
响应：
```json
{
  "items": [
    {
      "address": "0x...",
      "proxy": {
        "protocol": "http",
        "host": "1.2.3.4",
        "port": 8080,
        "username": "",
        "password": ""
      }
    }
  ]
}
```

2) 同步 owner 钱包列表
POST `/proxy/configs/sync-owner-wallets`
请求：
```json
{ "owner": "0x...", "addresses": ["0x...1", "0x...2"] }
```
响应：
```json
{ "ok": true }
```

3) 更新单钱包代理
POST `/proxy/wallets/update`
请求：
```json
{
  "owner": "0x...",
  "address": "0x...",
  "proxy": {
    "protocol": "socks5",
    "host": "10.0.0.20",
    "port": 1080,
    "username": "user",
    "password": "pass"
  }
}
```
响应：
```json
{ "ok": true }
```

4) 删除单钱包代理
POST `/proxy/wallets/remove`
请求：
```json
{ "owner": "0x...", "address": "0x..." }
```
响应：
```json
{ "ok": true }
```

5) 批量同步本地代理配置
POST `/proxy/wallets/batch-sync`
请求：
```json
{
  "owner": "0x...",
  "items": [
    {
      "address": "0x...",
      "proxy": {
        "protocol": "http",
        "host": "1.2.3.4",
        "port": 8080,
        "username": "",
        "password": ""
      }
    }
  ]
}
```
响应：
```json
{ "ok": true }
```
