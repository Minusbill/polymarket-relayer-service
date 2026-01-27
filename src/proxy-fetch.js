import { ProxyAgent } from "undici";
import nodeFetch from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";

const buildProxyUrl = (proxy) => {
  if (!proxy?.host || !proxy?.port) return "";
  const protocol = proxy.protocol || "http";
  const auth = proxy.username ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password || "")}@` : "";
  return `${protocol}://${auth}${proxy.host}:${proxy.port}`;
};

export const fetchViaProxy = async (url, options = {}, { proxy } = {}) => {
  const proxyUrl = buildProxyUrl(proxy);
  if (!proxyUrl) return fetch(url, options);
  const protocol = String(proxy?.protocol || "http").toLowerCase();
  if (protocol.startsWith("socks")) {
    const agent = new SocksProxyAgent(proxyUrl);
    return nodeFetch(url, { ...options, agent });
  }
  const dispatcher = new ProxyAgent(proxyUrl);
  return fetch(url, { ...options, dispatcher });
};

export const buildProxyUrlString = buildProxyUrl;
