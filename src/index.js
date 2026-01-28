import "dotenv/config";
import express from "express";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { ProxyConfigService } from "./proxy-config-service.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

const RELAYER_URL = process.env.POLY_RELAYER_URL || "https://relayer-v2.polymarket.com/";

const resolveCreds = (payload) => {
  const apiKey = payload.builderApiKey || process.env.BUILDER_API_KEY || "";
  const secret = payload.builderSecret || process.env.BUILDER_SECRET || "";
  const passphrase = payload.builderPassphrase || process.env.BUILDER_PASSPHRASE || "";
  const relayerUrl = payload.relayerUrl || process.env.POLY_RELAYER_URL || "";
  return { apiKey, secret, passphrase, relayerUrl };
};

const ensureCreds = (creds) => {
  if (!creds.apiKey || !creds.secret || !creds.passphrase) {
    throw new Error("缺少 builderApiKey/builderSecret/builderPassphrase");
  }
};

const proxyConfigService = new ProxyConfigService();

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.get("/proxy/configs/:owner", (req, res) => {
  const { owner } = req.params || {};
  if (!owner) {
    res.status(400).json({ message: "缺少 owner" });
    return;
  }
  const items = proxyConfigService.getByOwner(owner);
  res.json({ items });
});

app.post("/proxy/configs", (req, res) => {
  const { owner } = req.body || {};
  if (!owner) {
    res.status(400).json({ message: "缺少 owner" });
    return;
  }
  const items = proxyConfigService.getByOwner(owner);
  res.json({ items });
});

app.post("/proxy/configs/query", (req, res) => {
  const { owner } = req.body || {};
  if (!owner) {
    res.status(400).json({ message: "缺少 owner" });
    return;
  }
  const items = proxyConfigService.getByOwner(owner);
  res.json({ items });
});

app.post("/proxy/configs/sync-owner-wallets", (req, res) => {
  const { owner, addresses } = req.body || {};
  if (!owner) {
    res.status(400).json({ message: "缺少 owner" });
    return;
  }
  if (!Array.isArray(addresses)) {
    res.status(400).json({ message: "缺少 addresses" });
    return;
  }
  proxyConfigService.updateOwner(owner, addresses);
  res.json({ ok: true });
});

app.post("/proxy/wallets/update", (req, res) => {
  const { owner, address, proxy } = req.body || {};
  if (!owner) {
    res.status(400).json({ message: "缺少 owner" });
    return;
  }
  if (!address) {
    res.status(400).json({ message: "缺少 address" });
    return;
  }
  if (!proxyConfigService.isOwnedBy(owner, address)) {
    res.status(403).json({ message: "无权限" });
    return;
  }
  if (!proxy || typeof proxy !== "object") {
    res.status(400).json({ message: "缺少 proxy" });
    return;
  }
  proxyConfigService.updateWallet(address, proxy);
  res.json({ ok: true });
});

app.post("/proxy/wallets/remove", (req, res) => {
  const { owner, address } = req.body || {};
  if (!owner) {
    res.status(400).json({ message: "缺少 owner" });
    return;
  }
  if (!address) {
    res.status(400).json({ message: "缺少 address" });
    return;
  }
  if (!proxyConfigService.isOwnedBy(owner, address)) {
    res.status(403).json({ message: "无权限" });
    return;
  }
  proxyConfigService.removeWallet(address);
  res.json({ ok: true });
});

app.post("/proxy/wallets/batch-sync", (req, res) => {
  const { owner, items } = req.body || {};
  if (!owner) {
    res.status(400).json({ message: "缺少 owner" });
    return;
  }
  if (!Array.isArray(items)) {
    res.status(400).json({ message: "缺少 items" });
    return;
  }
  proxyConfigService.batchSync(owner, items);
  res.json({ ok: true });
});

app.post("/relayer/nonce", async (req, res) => {
  try {
    const { address, type } = req.body || {};
    if (!address) {
      res.status(400).json({ message: "缺少 address" });
      return;
    }
    const url = new URL(`${RELAYER_URL.replace(/\/$/, "")}/nonce`);
    url.searchParams.set("address", address);
    url.searchParams.set("type", type || "SAFE");
    const resp = await fetch(url.toString());
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      res.status(resp.status).json({ message: data?.message || "nonce 获取失败" });
      return;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error?.message || String(error) });
  }
});

app.post("/relayer/submit", async (req, res) => {
  try {
    const { request } = req.body || {};
    if (!request) {
      res.status(400).json({ message: "缺少 request" });
      return;
    }
    const creds = resolveCreds(req.body || {});
    ensureCreds(creds);
    const builderConfig = new BuilderConfig({
      localBuilderCreds: {
        key: creds.apiKey,
        secret: creds.secret,
        passphrase: creds.passphrase,
      },
    });
    const body = JSON.stringify(request);
    const headers = await builderConfig.generateBuilderHeaders("POST", "/submit", body);
    const resp = await fetch(`${RELAYER_URL.replace(/\/$/, "")}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      res.status(resp.status).json({ message: data?.message || "提交失败" });
      return;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error?.message || String(error) });
  }
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`[relayer-service] listening on http://127.0.0.1:${port}`);
});
