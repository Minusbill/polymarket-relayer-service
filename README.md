# Polymarket Relayer Service

独立后端服务：只负责与 Polymarket Relayer 交互，**不接触私钥**。
前端负责签名交易（Safe 交易签名），服务端仅做 `nonce/submit` 透传并使用 Builder 凭证生成请求头。

## 功能
- `GET /health`：健康检查
- `POST /relayer/nonce`：转发到 relayer `/nonce`，获取 Safe nonce
- `POST /relayer/submit`：转发到 relayer `/submit`，提交已签名的 Safe 交易请求
- 代理配置管理（用户级隔离）：按 owner 地址返回该 owner 的钱包代理配置

## 环境变量
复制 `.env.example` 为 `.env` 并填写：
```
PORT=4000
RPC_URL=https://polygon.drpc.org
POLY_RELAYER_URL=https://relayer-v2.polymarket.com/
BUILDER_API_KEY=
BUILDER_SECRET=
BUILDER_PASSPHRASE=
```

说明：
- `BUILDER_*` 必填，用于生成 relayer 的 builder 认证头
- `POLY_RELAYER_URL` 可选，默认 `https://relayer-v2.polymarket.com/`

## 启动
```
npm install
npm run dev
```

## 接口

### 1) 获取 nonce
`POST /relayer/nonce`

请求：
```json
{ "address": "0x...", "type": "SAFE" }
```

响应：
```json
{ "nonce": "123" }
```

### 2) 提交已签名的 Safe 交易
`POST /relayer/submit`

请求：
```json
{
  "request": {
    "from": "0x...",
    "to": "0x...",
    "proxyWallet": "0x...",
    "data": "0x...",
    "nonce": "123",
    "signature": "0x...",
    "signatureParams": {
      "gasPrice": "0",
      "operation": "0",
      "safeTxnGas": "0",
      "baseGas": "0",
      "gasToken": "0x0000000000000000000000000000000000000000",
      "refundReceiver": "0x0000000000000000000000000000000000000000"
    },
    "type": "SAFE",
    "metadata": "withdraw"
  }
}
```

响应：
```json
{ "transactionHash": "0x..." }
```

### 3) 查询 owner 的全部代理配置
`GET /proxy/configs/:owner`

说明：
- 只能看到该 owner 绑定的地址配置
- owner 不在配置里会返回空数组

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

### 4) 查询 owner 的全部代理配置（POST）
`POST /proxy/configs`

请求：
```json
{ "owner": "0x..." }
```

响应：
```json
{ "items": [ { "address": "0x...", "proxy": { "protocol": "http", "host": "1.2.3.4", "port": 8080, "username": "", "password": "" } } ] }
```

### 5) 查询 owner 的全部代理配置（action）
`POST /proxy/configs/query`

请求：
```json
{ "owner": "0x..." }
```

响应：
```json
{ "items": [ { "address": "0x...", "proxy": { "protocol": "http", "host": "1.2.3.4", "port": 8080, "username": "", "password": "" } } ] }
```

### 6) 同步 owner 绑定的钱包列表
`POST /proxy/configs/sync-owner-wallets`

请求：
```json
{
  "owner": "0x...",
  "addresses": ["0x...1", "0x...2"]
}
```

响应：
```json
{ "ok": true }
```

### 7) 更新单个钱包的代理配置
`POST /proxy/wallets/update`

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

### 8) 删除单个钱包的代理配置
`POST /proxy/wallets/remove`

请求：
```json
{ "owner": "0x...", "address": "0x..." }
```

响应：
```json
{ "ok": true }
```

### 9) 批量同步钱包代理配置
`POST /proxy/wallets/batch-sync`

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

## 代理配置文件
配置文件：`src/ip-config.json`

结构：
```json
{
  "default": {
    "proxy": {
      "protocol": "http",
      "host": "127.0.0.1",
      "port": 8080,
      "username": "",
      "password": ""
    }
  },
  "owners": {
    "0x...owner": ["0x...wallet1", "0x...wallet2"]
  },
  "wallets": {
    "0x...wallet1": {
      "proxy": {
        "protocol": "http",
        "host": "1.2.3.4",
        "port": 8080,
        "username": "",
        "password": ""
      }
    }
  }
}
```

说明：
- `owners` 控制“一个 owner 看到哪些钱包配置”
- `wallets` 存每个钱包的代理信息
- owner 与钱包地址建议全部小写

## 前端对接
前端需设置：
```
VITE_RELAYER_SERVICE_URL=http://127.0.0.1:4000
```

前端负责：
1) 生成 Safe 交易签名
2) 调用 `/relayer/nonce` 获取 nonce
3) 调用 `/relayer/submit` 提交 request

## 安全说明
- 服务端不接触私钥
- Builder 凭证仅存放在服务端 `.env`
- 建议仅在本机局域网使用（默认 CORS 放开）
