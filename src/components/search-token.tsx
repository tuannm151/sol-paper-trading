import { Pair } from "@/types"
import { Input } from "./ui/input";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import SearchTokenItem from "./search-token-item";
import { SearchIcon } from "lucide-react";

import { searchToken } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
const SearchToken = () => {
  const [resultPairs, setResultPairs] = useState<Pair[] | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if(inputValue.length < 3) {
      return;
    }
    const timeout = setTimeout(async () => {
      const response = await searchToken(inputValue);
      const pairs = response.pairs.filter((pair) => pair.chainId === 'solana');
      setResultPairs(pairs);
    }, 300);
    return () => clearTimeout(timeout);
   }, [inputValue]);

   const handleClickItem = useCallback((pair: Pair) => {
    navigate(`/token/${pair.baseToken.address}`);
    setOpen(false);
    setInputValue('');
    setResultPairs(null);
  }, [navigate]);

  return (
     <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
           <div className="flex items-center relative">
            <SearchIcon className="w-4 h-4 text-primary absolute left-2"/>
            <Input className="w-[280px] pl-8 dark:border-gray-500 focus:dark:border-none" placeholder="Search by name, address" type="search"/>
           </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] p-0">
            <div className="w-full p-2 pb-0">
            <Input className="w-full dark:border-gray-500 focus:dark:border-none" placeholder="Search by token name, address, ..." type="search" value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
            </div>
            <div className="min-h-[300px] max-h-[500px] overflow-auto px-4 py-2 pt-0 flex flex-col gap-2">
              {resultPairs ? resultPairs.map((pair) => (
                <SearchTokenItem pair={pair} onClick={() => handleClickItem(pair)} key={pair.pairAddress}/>
              )) : <div className="text-center">No results</div>}
            </div>
        </DialogContent>
     </Dialog>
  )
}

export default SearchToken;