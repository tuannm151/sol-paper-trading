import { Button } from "@/components/ui/button";
import {
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TokenInfo } from "@/enums";
import db from "@/lib/db";
import {
  caculateRealizedPnlFIFO,
  caculateSwap,
  getPairsData,
  getTokenDecimals,
  searchToken,
} from "@/lib/utils";
import { Pair, Trade, Transaction } from "@/types";
import { useLiveQuery } from "dexie-react-hooks";
import { BanknoteIcon, DollarSignIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "./ui/use-toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const RESET_PAIR_INTERVAL = 1000;

export default function TokenBalance() {
  const { address } = useParams();
  const [searchParams] = useSearchParams();
  const [pair, setPair] = useState<Pair | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [buyAmount, setBuyAmount] = useState(0);
  const [sellAmountPercentage, setSellAmountPercentage] = useState(0);
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<
    string | undefined
  >(searchParams.get("wallet") || undefined);

  const { toast } = useToast();

  const settings = useLiveQuery(async () => {
    const settings = await db.settings.offset(0).first();
    setBuyAmount(settings?.buyAmounts[0] ?? 0);
    setSellAmountPercentage(settings?.sellAmountPercentages[0] ?? 0);
    return settings;
  });

  const wallets = useLiveQuery(() => db.wallets.toArray());

  const selectedWallet = useMemo(() => {
    if (!wallets?.length || !settings) {
      return null;
    }

    const wallet =
      wallets.find((wallet) => wallet.address === selectedWalletAddress) ||
      wallets.find((wallet) => wallet.address === settings.defaultWallet) ||
      wallets[0];

    return wallet;
  }, [selectedWalletAddress, wallets, settings]);

  const tokenDecimals = useRef<number | null>(null);

  const currentTrade = useLiveQuery(async () => {
    if (!pair?.pairAddress || !selectedWallet) {
      return null;
    }
    const wallet = await db.wallets.get(selectedWallet.address);

    if (!wallet) {
      return null;
    }

    const openTrades = wallet.trades.find(
      (trade) =>
        trade &&
        trade.status === "open" &&
        trade.pairAddress === pair.pairAddress
    );

    return openTrades;
  }, [pair?.pairAddress, selectedWallet]);

  const pnl = useMemo(
    () => currentTrade && caculateRealizedPnlFIFO(currentTrade),
    [currentTrade]
  );

  const unrealizedPnl =
    currentTrade &&
    pair &&
    currentTrade.balanceQuantity *
      (Number(pair.priceNative) -
        currentTrade.transactions[currentTrade.transactions.length - 1]
          .priceSOL);

  const totalPnl = unrealizedPnl
    ? unrealizedPnl + (pnl?.realizedPnl ?? 0)
    : null;
  const totalPnlPercentage =
    totalPnl && pnl?.totalCost ? (totalPnl / pnl.totalCost) * 100 : null;

  const loadTokenData = useCallback(async (address: string) => {
    try {
      setIsLoading(true);
      const response = await searchToken(address);
      const pair = response.pairs.find((pair) => pair.chainId === "solana");
      if (!pair) {
        throw new Error("Token not found");
      }
      return pair;
    } catch {
      setError("Token not found");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const intervalRef = useRef<{
    id: string,
    interval: NodeJS.Timeout
  } | null>(null);

  useEffect(() => {
    if(!pair?.pairAddress) {
      return;
    }

    if (intervalRef.current && intervalRef.current.id !== pair.pairAddress) {
      clearInterval(intervalRef.current.interval);
    }

    intervalRef.current = {
      id: pair.pairAddress,
      interval: setInterval(async () => {
        const response = await getPairsData([pair.pairAddress]);
        if (!response?.pairs?.length) {
          return;
        }
        setPair(response.pairs[0]);
      }, RESET_PAIR_INTERVAL)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current.interval);
      }
    };
  }, [pair?.pairAddress]);

  useEffect(() => {
    if (!address) {
      return navigate("/");
    }

    loadTokenData(address).then(async (pair) => {
      if (!pair) {
        return;
      }
      setPair(pair);
      tokenDecimals.current = await getTokenDecimals(pair.baseToken.address);
    });
  }, [address, navigate, loadTokenData]);

  const handleInputCustom = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedWallet) {
        return;
      }

      let value = Number(e.target.value);
      value = isNaN(value) || value < 0 ? 0 : value;

      if (mode === "buy") {
        if (value > selectedWallet.balanceSOL) {
          return setBuyAmount(selectedWallet.balanceSOL);
        }
        setBuyAmount(value);
      }

      if (mode === "sell") {
        if (value > 100) {
          return setSellAmountPercentage(100);
        }
        setSellAmountPercentage(value);
      }
    },
    [selectedWallet, mode]
  );

  const handleBuy = async () => {
    try {
      if (
        !pair?.baseToken.address ||
        !tokenDecimals.current ||
        !settings ||
        !selectedWallet
      ) {
        return;
      }
      const { outputAmount } = await caculateSwap(
        {
          address: TokenInfo.SOL.mintAddress,
          decimal: TokenInfo.SOL.decimals,
        },
        {
          address: pair.baseToken.address,
          decimal: tokenDecimals.current,
        },
        {
          amount: buyAmount,
          slippage: settings.slippage,
        }
      );
  
      const newBalanceQuantity = currentTrade?.balanceQuantity
        ? currentTrade.balanceQuantity + outputAmount
        : outputAmount;
  
      const transaction: Transaction = {
        quantity: outputAmount,
        priceSOL: buyAmount / outputAmount,
        totalSOL: buyAmount,
        balanceQuantity: newBalanceQuantity,
        marketCap: pair.fdv,
        type: "buy",
        createdAt: new Date().toISOString(),
      };
  
      if (currentTrade) {
        await db.wallets.update(selectedWallet.address, {
          balanceSOL: selectedWallet.balanceSOL - buyAmount,
          trades: [
            ...selectedWallet.trades.filter(
              (trade) => trade.id !== currentTrade.id
            ),
            {
              ...currentTrade,
              balanceQuantity: newBalanceQuantity,
              transactions: [...currentTrade.transactions, transaction],
              updatedAt: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newTrade: Trade = {
          id: uuidv4(),
          pairAddress: pair.pairAddress,
          tokenAddress: pair.baseToken.address,
          balanceQuantity: outputAmount,
          transactions: [transaction],
          status: "open",
          walletAddress: selectedWallet.address,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.wallets.update(selectedWallet.address, {
          balanceSOL: selectedWallet.balanceSOL - buyAmount,
          trades: [...selectedWallet.trades, newTrade],
          updatedAt: new Date().toISOString(),
        });
      }
  
      toast({
        title: "Transaction successful",
        description: `Bought ${outputAmount.toFixed(3)} ${
          pair.baseToken.symbol
        } for ${buyAmount.toFixed(3)} SOL`,
      });
    } catch(e) {
      if(e instanceof Error) {
        toast({
          title: "Transaction failed",
          description: e.message,
          variant: "destructive"
        });
      }
    }
  };

  const handleSell = async () => {
    try {
      if (
        !pair?.baseToken.address ||
        !settings ||
        !selectedWallet ||
        !tokenDecimals.current ||
        !currentTrade
      ) {
        return;
      }
  
      if (currentTrade.balanceQuantity <= 0) {
        return;
      }
  
      const sellAmount =
        currentTrade.balanceQuantity * (sellAmountPercentage / 100);
  
      const { outputAmount } = await caculateSwap(
        {
          address: pair.baseToken.address,
          decimal: tokenDecimals.current,
        },
        {
          address: TokenInfo.SOL.mintAddress,
          decimal: TokenInfo.SOL.decimals,
        },
        {
          amount: sellAmount,
          slippage: settings.slippage,
        }
      );
  
      const newBalanceQuantity = currentTrade.balanceQuantity - sellAmount;
  
      const transaction: Transaction = {
        quantity: sellAmount,
        priceSOL: outputAmount / sellAmount,
        totalSOL: outputAmount,
        balanceQuantity: newBalanceQuantity,
        marketCap: pair.fdv,
        type: "sell",
        createdAt: new Date().toISOString(),
      };
  
      await db.wallets.update(selectedWallet.address, {
        balanceSOL: selectedWallet.balanceSOL + outputAmount,
        trades: [
          ...selectedWallet.trades.filter(
            (trade) => trade.id !== currentTrade.id
          ),
          {
            ...currentTrade,
            balanceQuantity: newBalanceQuantity,
            status: newBalanceQuantity > 0 ? "open" : "closed",
            transactions: [...currentTrade.transactions, transaction],
            updatedAt: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      });
  
      toast({
        title: "Transaction successful",
        description: `Sold ${sellAmount.toFixed(3)} ${
          pair.baseToken.symbol
        } for ${outputAmount.toFixed(3)} SOL`,
      });
    } catch(e) {
      if(e instanceof Error) {
        toast({
          title: "Transaction failed",
          description: e.message,
          variant: "destructive"
        });
      }
    }
  };

  const shouldShowTrade =
    currentTrade && pnl && totalPnlPercentage && totalPnl && unrealizedPnl;

  const getPnlColorClass = (pnl: number) => {
    if (pnl > 0) {
      return "text-green-600";
    }
    if (pnl < 0) {
      return "text-red-600";
    }
    return "";
  };

  if(error) {
    return (
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex flex-col mb-2">
            <div className="font-semibold">Token not found</div>
            <span>Please use search bar to find the token</span>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if(isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex flex-col mb-2">
            <div className="font-semibold">Loading...</div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-1">
            <div className="font-semibold">{pair?.baseToken.symbol}</div>
            <span className="text-gray-400">/</span>
            <div className="text-gray-400">{pair?.quoteToken.symbol}</div>
          </div>
          {shouldShowTrade && (
            <div
              className={`flex justify-end mt-1 gap-1 ${getPnlColorClass(
                totalPnlPercentage
              )}`}
            >
              <span className="text-xs">{totalPnlPercentage.toFixed(3)}%</span>
              <span className="text-xs">({totalPnl.toFixed(3)} SOL)</span>
            </div>
          )}
        </div>
        <Select value={selectedWallet?.address} onValueChange={(value) => setSelectedWalletAddress(value)}>
          <SelectTrigger className="px-2 py-1 text-xs h-8">
            <SelectValue placeholder="Select a wallet" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {wallets?.map((wallet) => (
                <SelectItem
                  key={wallet.address}
                  value={wallet.address}
                >
                  {wallet.name}: {wallet.balanceSOL.toFixed(3)} SOL
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          {shouldShowTrade && (
            <>
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-gray-400">Invested</span>
                <span>{pnl.totalCost.toFixed(3)} SOL</span>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-gray-400">Worth</span>
                <span>
                  {(
                    currentTrade.balanceQuantity * Number(pair.priceNative)
                  ).toFixed(3)}{" "}
                  SOL
                </span>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-gray-400">Unrealized PnL</span>
                <span className={getPnlColorClass(unrealizedPnl)}>
                  {unrealizedPnl.toFixed(3)} SOL
                </span>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-gray-400">Realized PnL</span>
                <span className={getPnlColorClass(pnl.realizedPnl)}>
                  {pnl.realizedPnl.toFixed(3)} SOL
                </span>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-gray-400">Sold</span>
                <span>{pnl.totalSold.toFixed(3)} SOL</span>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-gray-400">Quantity</span>
                <span>{currentTrade.balanceQuantity.toFixed(3)}</span>
              </div>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <Button
            className="flex-1 flex gap-1"
            size={"sm"}
            variant={mode === "buy" ? "secondary" : "outline"}
            onClick={() => setMode("buy")}
          >
            <DollarSignIcon className="w-4 h-4" />
            <span>Buy</span>
          </Button>
          <Button
            className="flex-1 flex gap-1"
            size={"sm"}
            variant={mode === "sell" ? "secondary" : "outline"}
            onClick={() => setMode("sell")}
          >
            <BanknoteIcon className="w-4 h-4" />
            <span>Sell</span>
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {mode === "buy" &&
            settings?.buyAmounts.map((amount) => (
              <Button
                key={amount}
                size={"sm"}
                disabled={
                  selectedWallet?.balanceSOL
                    ? amount > selectedWallet.balanceSOL
                    : true
                }
                className="text-xs border border-[#3d3d5c]"
                variant={buyAmount === amount ? "secondary" : "outline"}
                onClick={() => setBuyAmount(amount)}
              >
                {amount} SOL
              </Button>
            ))}
          {mode === "sell" &&
            settings?.sellAmountPercentages.map((percentage) => (
              <Button
                key={percentage}
                size={"sm"}
                className="text-xs border border-[#3d3d5c]"
                variant={
                  sellAmountPercentage === percentage ? "secondary" : "outline"
                }
                onClick={() => setSellAmountPercentage(percentage)}
              >
                {percentage}%
              </Button>
            ))}
        </div>
        <Input
          className="border border-[#3d3d5c] placeholder-[#a0a3bd]"
          type="number"
          min={0}
          max={mode === "sell" ? 100 : selectedWallet?.balanceSOL}
          placeholder={
            mode === "sell"
              ? "Enter percentage to sell"
              : "Enter SOL amount to buy"
          }
          value={mode === "sell" ? sellAmountPercentage : buyAmount}
          onChange={handleInputCustom}
        />
      </CardContent>
      <CardFooter className="p-4 flex flex-col gap-2">
        <Button
          size={"sm"}
          disabled={mode === "sell" ? !sellAmountPercentage : !buyAmount}
          className="w-full"
          onClick={mode === "sell" ? handleSell : handleBuy}
        >
          {mode === "sell"
            ? `Sell ${sellAmountPercentage}%`
            : `Buy ${buyAmount} SOL`}
        </Button>
      </CardFooter>
    </Card>
  );
}
