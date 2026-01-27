import { IpRouter } from "./ip-router.js";
import { fetchViaProxy } from "./proxy-fetch.js";

export class ProxyRelay {
  constructor({ router } = {}) {
    this.router = router || new IpRouter();
  }

  async fetchByWallet(url, options = {}, walletAddress) {
    const { proxy } = this.router.resolveByWallet(walletAddress);
    return fetchViaProxy(url, options, { proxy });
  }

  async fetchByRoute(url, options = {}, routeKey = "default") {
    const { proxy } = this.router.resolve(routeKey);
    return fetchViaProxy(url, options, { proxy });
  }
}

export const createProxyRelay = (options) => new ProxyRelay(options);
