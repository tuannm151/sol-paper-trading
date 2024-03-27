import { PairsResponse, Trade } from "@/types";
import TradingCard from "./trading-card";
import { useEffect, useMemo, useState } from "react";
import { getPairsData } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import db from "@/lib/db";

const TradingGroup = () => {
  const [pairsData, setPairsData] = useState<PairsResponse | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wallets = useLiveQuery(() => db.wallets.toArray());

  const openTrades = useMemo(() => {
    if (!wallets) {
      return [];
    }

    const result = wallets.reduce((acc, wallet) => {
      const walletOpenTrades = wallet.trades.filter(
        (trade) => trade.status === "open" && trade.balanceQuantity > 0
      );
      return acc.concat(walletOpenTrades);
    }, [] as Trade[]);
    if(!result.length) {
      setIsFirstLoad(false);
    }
    return result;
  }, [wallets]);

  useEffect(() => {
    if (!openTrades?.length) {
      return;
    }

    const pairs = [...new Set(openTrades.map((trade) => trade.pairAddress))];

    const interval = setInterval(async () => {
      try {
        const response = await getPairsData(pairs);
        setPairsData(response);
        setError(null);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      } finally {
        setIsFirstLoad(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [openTrades]);

  if(isFirstLoad || error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex gap-2 flex-col items-center">
          <span>{error ? error : 'Loading...'}</span>
        </div>
      </div>
    )
  }

  const hasOpenTrade = pairsData?.pairs?.length && openTrades.length;

  if(!hasOpenTrade) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex gap-2 flex-col items-center">
          <span>You don't have any open trades</span>
          <span>Use the search bar to find tokens and open a trade</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {hasOpenTrade && (
        <div className="grid grid-cols-3 p-6 gap-8 w-full">
          {openTrades.map((trade) => {
            if (!pairsData.pairs) {
              return null;
            }
            const pair = pairsData.pairs.find(
              (pair) => pair.pairAddress === trade.pairAddress
            );
            if (!pair) {
              return null;
            }
            return <TradingCard key={trade.id} trade={trade} pair={pair} />;
          })}
        </div>
      )}
    </>
  );
};

export default TradingGroup;
