import { Pair } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { DateTime } from 'luxon'
import { formatCurrency, formatShortAddress } from "@/lib/utils";

interface Props {
    pair: Pair;
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const SearchTokenItem = ({ pair, onClick }: Props) => {
  return (
    <div className="p-4 flex text-sm rounded-lg border border-transparent cursor-pointer dark:hover:border-gray-200 hover:border-gray-400 select-none" onClick={onClick}>
        <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
                <div className="flex gap-1">
                    <div className="font-semibold">{pair.baseToken.symbol}</div>
                    <span className="text-gray-400">/</span>
                    <div className="text-gray-400">{pair.quoteToken.symbol}</div>
                </div>
                {pair?.info?.imageUrl && <Avatar className="w-6 h-6">
                    <AvatarImage src={pair.info.imageUrl}/>
                    <AvatarFallback className="text-xs">{'NA'}</AvatarFallback>
                </Avatar>}
                <span className="text-sm">{pair.baseToken.name}</span>
            </div>
            <div className="flex gap-2 justify-between">
                <span className="font-semibold">${pair.priceUsd ?? 'NA'}</span>
                <div className="flex gap-1">
                    <span className="text-gray-400">24h Price Change:</span>
                    <span className={`${pair.priceChange.h24 > 0 ? 'text-green-600' : 'text-red-600'}`}>{pair.priceChange.h24}%</span>
                </div>
                <div className="flex gap-1">
                    <span className="text-gray-400">Liquidty:</span>
                    <span>{formatCurrency(pair?.liquidity?.usd ?? pair?.liquidity?.base)}</span>
                </div>
                <div className="flex gap-1">
                    <span className="text-gray-400">24h Volume:</span>
                    <span>{formatCurrency(pair.volume.h24)}</span>
                </div>
                <div className="flex gap-1">
                    <span className="text-gray-400">Age:</span>
                    <span>{pair.pairCreatedAt ? DateTime.fromMillis(pair.pairCreatedAt).toRelative() : 'NA'}</span>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex gap-1">
                    <span className="text-gray-400">Pair:</span>
                    <span>{formatShortAddress(pair.pairAddress)}</span>
                </div>
                <div className="flex gap-1">
                    <span className="text-gray-400">CA:</span>
                    <span>{formatShortAddress(pair.baseToken.address)}</span>
                </div>
            </div>
        </div>
    </div>
  )
}

export default SearchTokenItem