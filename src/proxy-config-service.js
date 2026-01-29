import fs from "node:fs";
import { IpRouter } from "./ip-router.js";

const normalizeProxy = (proxy = {}) => ({
  protocol: proxy.protocol || "",
  host: proxy.host || "",
  port: Number(proxy.port || 0),
  username: proxy.username || "",
  password: proxy.password || "",
});

export class ProxyConfigService {
  constructor({ router } = {}) {
    this.router = router || new IpRouter();
  }

  listAll() {
    this.router.refresh();
    const wallets = this.router.config?.wallets || {};
    return Object.entries(wallets).map(([address, route]) => ({
      address,
      proxy: normalizeProxy(route?.proxy),
    }));
  }

  listByAddresses(addresses = []) {
    this.router.refresh();
    return addresses.map((address) => {
      const resolved = this.router.resolveByWallet(address);
      return {
        address,
        proxy: normalizeProxy(resolved.proxy),
      };
    });
  }

  getByOwner(ownerAddress) {
    if (!ownerAddress) return [];
    this.router.refresh();
    const normalized = String(ownerAddress).toLowerCase();
    const list = this.router.config?.owners?.[normalized] || [];
    return this.listByAddresses(list);
  }

  getOwnerWallets(ownerAddress) {
    if (!ownerAddress) return [];
    this.router.refresh();
    const normalized = String(ownerAddress).toLowerCase();
    return this.router.config?.owners?.[normalized] || [];
  }

  isOwnedBy(ownerAddress, walletAddress) {
    if (!ownerAddress || !walletAddress) return false;
    const normalizedWallet = String(walletAddress).toLowerCase();
    const list = this.getOwnerWallets(ownerAddress);
    return list.includes(normalizedWallet);
  }

  saveConfig(nextConfig) {
    const path = this.router.configPath;
    fs.writeFileSync(path, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf-8");
    this.router.config = nextConfig;
  }

  updateOwner(ownerAddress, walletAddresses = []) {
    if (!ownerAddress) return;
    this.router.refresh();
    const normalizedOwner = String(ownerAddress).toLowerCase();
    const normalizedWallets = walletAddresses.map((item) => String(item).toLowerCase());
    const nextConfig = { ...this.router.config };
    nextConfig.owners = { ...(nextConfig.owners || {}) };
    nextConfig.owners[normalizedOwner] = normalizedWallets;
    this.saveConfig(nextConfig);
  }

  updateWallet(address, proxy = {}) {
    if (!address) return;
    this.router.refresh();
    const normalized = String(address).toLowerCase();
    const nextConfig = { ...this.router.config };
    nextConfig.wallets = { ...(nextConfig.wallets || {}) };
    nextConfig.wallets[normalized] = { proxy: normalizeProxy(proxy) };
    this.saveConfig(nextConfig);
  }

  removeWallet(address) {
    if (!address) return;
    this.router.refresh();
    const normalized = String(address).toLowerCase();
    const nextConfig = { ...this.router.config };
    if (nextConfig.wallets && nextConfig.wallets[normalized]) {
      nextConfig.wallets = { ...nextConfig.wallets };
      delete nextConfig.wallets[normalized];
      this.saveConfig(nextConfig);
    }
  }

  batchSync(ownerAddress, items = []) {
    if (!ownerAddress) return;
    this.router.refresh();
    const normalizedOwner = String(ownerAddress).toLowerCase();
    const nextConfig = { ...this.router.config };
    nextConfig.wallets = { ...(nextConfig.wallets || {}) };
    nextConfig.owners = { ...(nextConfig.owners || {}) };
    const addresses = [];
    for (const item of items) {
      if (!item?.address) continue;
      const address = String(item.address).toLowerCase();
      addresses.push(address);
      nextConfig.wallets[address] = { proxy: normalizeProxy(item.proxy) };
    }
    nextConfig.owners[normalizedOwner] = addresses;
    this.saveConfig(nextConfig);
  }
}

export const createProxyConfigService = (options) => new ProxyConfigService(options);
