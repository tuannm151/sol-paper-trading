import AddWallet from "@/components/add-wallet";
import DeleteWallet from "@/components/delete-wallet";
import EditWallet from "@/components/edit-wallet";
import ResetWallet from "@/components/reset-wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-underline"
import { useToast } from "@/components/ui/use-toast";
import db from "@/lib/db"
import { formatShortAddress } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks"
import { Coins, Percent, Wallet } from "lucide-react";
import { useCallback, useState } from "react";

const Settings = () => {
  const [buysAmounts, setBuysAmounts] = useState<number[] | null>(null);
  const [sellAmountPercentages, setSellAmounts] = useState<number[] | null>(null);

  const settings = useLiveQuery(async () => {
    const settingsData = await db.settings.toArray();
    const settings = settingsData?.[0];
    if(!settings) {
      return;
    }
    setBuysAmounts(settings.buyAmounts);
    setSellAmounts(settings.sellAmountPercentages);
    return settings;
  });
  
  const wallets = useLiveQuery(() => db.wallets.toArray());

  const { toast } = useToast();

  const handleUpdateBuyAmount = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if(!buysAmounts) {
      return;
    }
    const value = parseFloat(e.target.value);
    if(!isNaN(value)) {
      const newBuyAmounts = buysAmounts.slice();
      newBuyAmounts[index] = value;
      setBuysAmounts(newBuyAmounts);
    }
  }, [buysAmounts]);

  const handleUpdateSellAmount = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if(!sellAmountPercentages) {
      return;
    }
    const value = parseFloat(e.target.value);
    if(!isNaN(value)) {
      const newSellAmounts = sellAmountPercentages.slice();
      newSellAmounts[index] = value;
      setSellAmounts(newSellAmounts);
    }
  }, [sellAmountPercentages]);

  const handleSaveChanges: () => Promise<void> = useCallback(async () => {
    if(!buysAmounts || !sellAmountPercentages || !settings) {
      return;
    }
    await db.settings.update(settings.id, {
      buyAmounts: buysAmounts,
      sellAmountPercentages: sellAmountPercentages
    });
    toast({
      title: "Settings saved",
      description: "Your settings have been saved"
    });
  }, [buysAmounts, sellAmountPercentages, settings, toast]) as () => Promise<void>;

  console.log(wallets);

  return (
    <div className="p-12 w-full h-full">
        <Tabs defaultValue="general" className="w-full h-full">
            <TabsList variant={"underline"} className="w-full">
                <TabsTrigger className="w-full" variant={'underline'} value={'general'}>General</TabsTrigger>
                <TabsTrigger className="w-full" variant={'underline'} value={'wallets'}>Wallets</TabsTrigger>
            </TabsList>
            <TabsContent value={'general'} className="mt-4 flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <h2 className="uppercase font-bold">Buy presets</h2>
                <span className="text-xs">Customize Quick Buy buttons with your own presets</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {buysAmounts?.map((amount, index) => (
                    <div key={`buy-${index}`} className="relative">
                      <Coins className="w-5 h-5 -translate-x-1/2 -translate-y-1/2 top-1/2 absolute left-4 "/>
                      <Input required className="w-24 pl-8" defaultValue={amount} onChange={(e) => handleUpdateBuyAmount(index, e)} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="uppercase font-bold">Sell presets</h2>
                <span className="text-xs">Customize Quick Sell buttons with your own presets</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {sellAmountPercentages?.map((amount, index) => (
                    <div key={`sell-${index}`} className="relative">
                      <Percent className="w-5 h-5 -translate-x-1/2 -translate-y-1/2 top-1/2 absolute left-4 "/>
                      <Input required className="w-24 pl-8" defaultValue={amount} onChange={(e) => handleUpdateSellAmount(index, e)} />
                    </div>
                  ))}
                </div>
              </div>
              <Button className="self-start w-32" onClick={handleSaveChanges}>Save changes</Button>
            </TabsContent>
            <TabsContent value={'wallets'} className="mt-4 h-full">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <div className="flex flex-col gap-2">
                    <h2 className="uppercase font-bold">Wallets</h2>
                    <span className="text-xs">Manage your wallets</span>
                  </div>
                  <AddWallet/>
                </div>
                <div className="mt-2">
                  {wallets?.map((wallet) => (
                    <div key={wallet.address} className="flex gap-2 items-center text-xs justify-between p-4 border-2 rounded-xl cursor-pointer">
                      <div className="flex gap-2 items-center">
                        <Wallet className="w-5 h-5"/>
                        <div className="flex flex-col gap-2">
                          <span className="font-bold">{wallet.name}</span>
                          <span>Address: {formatShortAddress(wallet.address)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-400">Open trades:</span>
                        <span>{wallet.trades.filter((trade) => trade.status === 'open').length}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-400">Total trades:</span>
                        <span>{wallet.trades.length}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-400">Balance:</span>
                        <span>{wallet.balanceSOL.toFixed(3)} SOL</span>
                      </div>
                      <div className="flex gap-2">
                        <EditWallet wallet={wallet}/>
                        <ResetWallet wallet={wallet}/>
                        <DeleteWallet wallet={wallet}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
        </Tabs>
    </div>
  )
}

export default Settings