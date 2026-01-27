import fs from "node:fs";
import path from "node:path";

const DEFAULT_CONFIG_PATH = path.resolve(process.cwd(), "src", "ip-config.json");

const readJson = (filePath) => {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
};

export class IpRouter {
  constructor({ configPath } = {}) {
    this.configPath = configPath || DEFAULT_CONFIG_PATH;
    this.refresh();
  }

  refresh() {
    this.config = readJson(this.configPath);
    return this.config;
  }

  getLocalIp(routeKey = "default") {
    const route = this.config?.routes?.[routeKey] || this.config?.default || {};
    return route.localIp || "127.0.0.1";
  }

  getProxy(routeKey = "default") {
    const route = this.config?.routes?.[routeKey] || this.config?.default || {};
    const proxy = route.proxy || {};
    return {
      protocol: proxy.protocol || "",
      host: proxy.host || "",
      port: Number(proxy.port || 0),
      username: proxy.username || "",
      password: proxy.password || "",
    };
  }

  getWalletRoute(walletAddress) {
    if (!walletAddress) return this.config?.default || {};
    const normalized = String(walletAddress).toLowerCase();
    const route = this.config?.wallets?.[normalized];
    if (route) return route;
    return this.config?.default || {};
  }

  resolve(routeKey = "default") {
    return {
      localIp: this.getLocalIp(routeKey),
      proxy: this.getProxy(routeKey),
    };
  }

  resolveByWallet(walletAddress) {
    const route = this.getWalletRoute(walletAddress);
    const proxy = route.proxy || {};
    return {
      localIp: route.localIp || "127.0.0.1",
      proxy: {
        protocol: proxy.protocol || "",
        host: proxy.host || "",
        port: Number(proxy.port || 0),
        username: proxy.username || "",
        password: proxy.password || "",
      },
    };
  }
}

export const createIpRouter = (options) => new IpRouter(options);
