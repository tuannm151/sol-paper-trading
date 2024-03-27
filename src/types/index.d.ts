interface Social {
    type: string;
    url: string;
}

interface Website {
    label: string,
    url: string;
}

interface Pair {
    chainId: string;
    dexId: string;
    url: string;
    info?: {
        imageUrl?: string;
        socials?: Social[];
        websites?: Website[];
    }
    pairAddress: string;
    baseToken: {
      address: string;
      name: string;
      symbol: string;
    };
    quoteToken: {
      symbol: string;
    };
    priceNative: string;
    priceUsd?: string;
    txns: {
      m5: {
        buys: number;
        sells: number;
      };
      h1: {
        buys: number;
        sells: number;
      };
      h6: {
        buys: number;
        sells: number;
      };
      h24: {
        buys: number;
        sells: number;
      };
    };
    volume: {
      m5: number;
      h1: number;
      h6: number;
      h24: number;
    };
    priceChange: {
      m5: number;
      h1: number;
      h6: number;
      h24: number;
    };
    liquidity?: {
      usd?: number;
      base: number;
      quote: number;
    };
    fdv?: number;
    pairCreatedAt?: number;
}

interface PairsResponse {
    schemaVersion: string;
    /** @deprecated use pairs field instead */
    pair: Pair | null;
    pairs: Pair[] | null;
}

interface TokensResponse {
    schemaVersion: string;
    pairs: Pair[] | null;
}

interface SearchResponse {
    schemaVersion: string;
    pairs: Pair[];
}

interface Transaction {
  quantity: number;
  priceSOL: number;
  totalSOL: number;
  balanceQuantity: number;
  marketCap?: number;
  createdAt: string;
  type: "buy" | "sell";
}

interface Trade {
  id: string;
  pairAddress: string;
  tokenAddress: string;
  balanceQuantity: number;
  transactions: Transaction[];
  status: "open" | "closed";
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
}

interface Wallet {
  address: string;
  name: string;
  balanceSOL: number;
  trades: Trade[];
  createdAt: string;
  updatedAt: string;
}

interface Settings {
  id: string;
  defaultWallet: string;
  buyAmounts: number[];
  sellAmountPercentages: number[];
  slippage: number;
  createdAt: string;
  updatedAt: string;
}

export type { 
  Pair, 
  PairsResponse, 
  TokensResponse, 
  SearchResponse,
  Trade,
  Transaction,
  Wallet,
  Settings 
};