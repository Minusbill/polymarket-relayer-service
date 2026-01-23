# Polymarket Relayer Service

独立后端服务：只负责与 Polymarket Relayer 交互，**不接触私钥**。
前端负责签名交易（Safe 交易签名），服务端仅做 `nonce/submit` 透传并使用 Builder 凭证生成请求头。

## 功能
- `GET /health`：健康检查
- `POST /relayer/nonce`：转发到 relayer `/nonce`，获取 Safe nonce
- `POST /relayer/submit`：转发到 relayer `/submit`，提交已签名的 Safe 交易请求

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
