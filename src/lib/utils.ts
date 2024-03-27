import { PairsResponse, SearchResponse, Trade, Transaction } from "@/types";
import axios from "axios";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import numbro from "numbro";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const searchToken = async (query: string) : Promise<SearchResponse> => {
  const response = await axios.get(`https://api.dexscreener.com/latest/dex/search/?q=${query}`);
  return response.data;
}

const getPairsData = async (pairs: string[]) : Promise<PairsResponse> => {
  const response = await axios.get(`https://api.dexscreener.com/latest/dex/pairs/solana/${pairs.join(',')}`);
  return response.data;
};

const getTokenDecimals = async (tokenAddress: string) => {
  const response = await axios.post('https://mainnet.helius-rpc.com/?api-key=6d051a66-6b5b-41ba-ae35-b1828a4c12ed', {
    jsonrpc: '2.0',
    id: 1,
    method: 'getTokenSupply',
    params: [tokenAddress]
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data.result.value.decimals as number;
};

type TokenSwap = {
  address: string,
  decimal: number,
}

const caculateSwap = async (
  from: TokenSwap,
  to: TokenSwap,
  {
    amount,
    slippage,
  }: {
    amount: number,
    slippage: number,
  }
) => {
  const amountIn = Math.floor(amount * (10 ** from.decimal));
  const slippageBps = slippage * 100;

  const response = await axios.get(`https://quote-api.jup.ag/v6/quote?inputMint=${from.address}&outputMint=${to.address}&amount=${amountIn}&slippageBps=${slippageBps}`);
  const outputAmount = Number(response.data.outAmount) / (10 ** to.decimal);

  return {
    outputAmount
  }
};

const caculateRealizedPnlFIFO = (currentTrade: Trade) => {
  const buys: Transaction[] = [];
  const sells: Transaction[] = [];
  let realizedPnl = 0;

  currentTrade.transactions.forEach((transaction) => {
    if (transaction.type === "buy") {
      buys.push(transaction);
    }
    if (transaction.type === "sell") {
      sells.push(transaction);
    }
  });

  const totalCost = buys.reduce((acc, buy) => acc + buy.totalSOL, 0);

  sells.forEach((sell) => {
    let remainingQuantity = sell.quantity;
    while (remainingQuantity > 0) {
      const buy = buys.shift();
      if (!buy) {
        break;
      }
      const quantity = Math.min(remainingQuantity, buy.balanceQuantity);
      realizedPnl += (sell.priceSOL - buy.priceSOL) * quantity;
      remainingQuantity -= quantity;
      buy.balanceQuantity -= quantity;
      if (buy.balanceQuantity > 0) {
        buys.unshift(buy);
      }
    }
  });

  const realizedPnlPercentage = (realizedPnl / totalCost) * 100;
  const totalSold = sells.reduce((acc, sell) => acc + sell.totalSOL, 0);

  return {
    realizedPnl,
    realizedPnlPercentage,
    totalCost,
    totalSold,
  };
};

const getColorClass = (num: number) => {
  if (num > 0) {
    return "text-green-600";
  } else if (num < 0) {
    return "text-red-600";
  }
  return "";
};

const formatCurrency = (value: number | undefined) => {
  if (!value) {
      return 'NA';
  }
  return numbro(value).formatCurrency({
      average: true,
      spaceSeparated: false,
      optionalMantissa: true, // removes insignificant trailing zeros
      mantissa: 2,
  }).toUpperCase();
};

const formatShortAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export {
  cn,
  searchToken,
  getPairsData,
  getTokenDecimals,
  caculateSwap,
  caculateRealizedPnlFIFO,
  getColorClass,
  formatCurrency,
  formatShortAddress,
}
