import { RelayClient, RelayerTxType } from "@polymarket/builder-relayer-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { createWalletClient, encodeFunctionData, http, maxUint256, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { COLLATERAL_TOKEN_DECIMALS, getChainContracts } from "./contracts.js";

const erc20Abi = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
];

const DEFAULT_RPC = process.env.RPC_URL || "https://polygon.drpc.org";
const DEFAULT_RELAYER = process.env.POLY_RELAYER_URL || "https://relayer-v2.polymarket.com/";
const CHAIN_ID = 137;
const chainContracts = getChainContracts(CHAIN_ID);
const USDCe_ADDRESS = chainContracts.collateral;
const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const USDT_ADDRESS = "0xC2132D05D31c914a87C6611C10748aEB04B58e8F";

const normalizePrivateKey = (value) => (value.startsWith("0x") ? value : `0x${value}`);

const resolveToken = (value) => {
  if (!value) return USDCe_ADDRESS;
  const normalized = String(value).toLowerCase();
  const tokenMap = {
    "usdc.e": USDCe_ADDRESS,
    usdce: USDCe_ADDRESS,
    usdc: USDC_ADDRESS,
    usdt: USDT_ADDRESS,
  };
  if (tokenMap[normalized]) return tokenMap[normalized];
  if (String(value).startsWith("0x") && String(value).length === 42) return value;
  throw new Error(`未知 token: ${value}`);
};

const resolveSpender = (value) => {
  if (!value) return "";
  const normalized = String(value).toLowerCase();
  const presetMap = {
    ctf: chainContracts.conditionalTokens,
    exchange: chainContracts.exchange,
    "neg-risk-exchange": chainContracts.negRiskExchange,
    "neg-risk-adapter": chainContracts.negRiskAdapter,
  };
  return presetMap[normalized] || value;
};

const buildClient = ({ privateKey, apiKey, secret, passphrase, relayerUrl }) => {
  const account = privateKeyToAccount(normalizePrivateKey(privateKey));
  const walletClient = createWalletClient({
    account,
    chain: polygon,
    transport: http(DEFAULT_RPC),
  });
  const builderConfig = new BuilderConfig({
    localBuilderCreds: {
      key: apiKey,
      secret,
      passphrase,
    },
  });
  const client = new RelayClient(relayerUrl || DEFAULT_RELAYER, CHAIN_ID, walletClient, builderConfig, RelayerTxType.SAFE);
  return { client, account };
};

export const approveToken = async ({ client, token, spender }) => {
  const approveTx = {
    to: token,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, maxUint256],
    }),
    value: "0",
  };
  const response = await client.execute([approveTx], "Approve Token");
  const result = await response.wait();
  return result?.transactionHash || "";
};

export const transferToken = async ({ client, token, to, amount }) => {
  const transferTx = {
    to: token,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, parseUnits(String(amount), COLLATERAL_TOKEN_DECIMALS)],
    }),
    value: "0",
  };
  const response = await client.execute([transferTx], "Transfer Token");
  const result = await response.wait();
  return result?.transactionHash || "";
};

export const buildRelayerContext = ({ privateKey, apiKey, secret, passphrase, relayerUrl }) => {
  const { client, account } = buildClient({ privateKey, apiKey, secret, passphrase, relayerUrl });
  return { client, account };
};

export const parseToken = resolveToken;
export const parseSpender = resolveSpender;
