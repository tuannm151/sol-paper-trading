import { Badge } from "@/components/ui/badge";
import { CardHeader, CardContent, Card } from "@/components/ui/card";
import { Pair, Trade } from "@/types";
import { ArrowDownCircleIcon, ArrowUpCircleIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useMemo } from "react";
import {
  caculateRealizedPnlFIFO,
  formatCurrency,
  getColorClass,
} from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import db from "@/lib/db";

interface Props {
  pair: Pair;
  trade: Trade;
}

export default function TradingCard({ pair, trade }: Props) {
  const pnl = useMemo(() => caculateRealizedPnlFIFO(trade), [trade]);

  const wallet = useLiveQuery(
    () => db.wallets.get(trade.walletAddress),
    [trade.walletAddress]
  );

  const unrealizedPnl =
    trade.balanceQuantity *
    (Number(pair.priceNative) -
      trade.transactions[trade.transactions.length - 1].priceSOL);

  const totalPnl = unrealizedPnl + pnl.realizedPnl;

  const totalPnlPercentage = (totalPnl / pnl.totalCost) * 100;

  const navigate = useNavigate();

  return (
    <Card
      className="dark:bg-secondary cursor-pointer"
      onClick={() => navigate(`/token/${pair.baseToken.address}?wallet=${trade.walletAddress}`)}
    >
      <CardHeader className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage src={pair?.info?.imageUrl} />
              <AvatarFallback>
                {pair.baseToken.symbol.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm">
                {pair.baseToken.symbol.toUpperCase()}
              </div>
              <div className="text-xs ">{pair.baseToken.name}</div>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
          {wallet && <Badge variant="outline">{wallet.name}</Badge>}
            <Badge className={getColorClass(totalPnl)} variant="secondary">
              {totalPnlPercentage.toFixed(3)}% ({totalPnl.toFixed(3)} SOL)
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col space-y-4">
          <div className="text-xl font-semibold">${pair.priceUsd}</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Invested</div>
              <span>{pnl.totalCost.toFixed(3)}</span>
            </div>
            <div>
              <div className=" text-gray-400">Unrealized PnL</div>
              <span className={getColorClass(unrealizedPnl)}>
                {unrealizedPnl.toFixed(3)}
              </span>
            </div>
            <div>
              <div className="text-gray-400">Worth</div>
              <span>
                {(trade.balanceQuantity * Number(pair.priceNative)).toFixed(3)}
              </span>
            </div>
            <div>
              <div className="text-gray-400">Sold</div>
              <span>{pnl.totalSold.toFixed(3)}</span>
            </div>
            <div>
              <div className=" text-gray-400">Realized PnL</div>
              <span className={getColorClass(pnl.realizedPnl)}>
                {pnl.realizedPnl.toFixed(3)}
              </span>
            </div>
            <div>
              <div className=" text-gray-400">Quantity</div>
              <span>{trade.balanceQuantity.toFixed(3)}</span>
            </div>
            <div>
              <div className="text-gray-400">Liquidity</div>
              <div>{formatCurrency(pair?.liquidity?.usd)}</div>
            </div>
            <div>
              <div className=" text-gray-400">Market cap</div>
              <div>{formatCurrency(pair.fdv)}</div>
            </div>
            <div className={getColorClass(pair.priceChange.m5)}>
              <div className={`text-gray-400`}>5m change</div>
              <div className="flex gap-2 items-center">
                <span>{pair.priceChange.m5}%</span>
                {pair.priceChange.m5 !== 0 && pair.priceChange.m5 > 0 ? (
                  <ArrowUpCircleIcon className="w-4 h-4" />
                ) : (
                  <ArrowDownCircleIcon className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
