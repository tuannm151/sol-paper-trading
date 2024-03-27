import { Wallet } from "@/types";
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { useState } from "react";
import db from "@/lib/db";
import { useToast } from "./ui/use-toast";

interface Props {
    wallet: Wallet;
}

const ResetWallet = ({ wallet }: Props) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleResetWallet = async () => {
    await db.wallets.update(wallet.address, { balanceSOL: 10, trades: [], transactions: [] });
    setOpen(false);
    toast({
        title: "Wallet reset",
        description: "The wallet has been reset successfully",
    });
  };

  return (
  <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
            <Button size={"sm"} variant={'secondary'}>Reset wallet</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Do you want to reset <span className="font-bold">{wallet.name}</span> wallet?</DialogTitle>
            <DialogDescription className="flex flex-col gap-1">
                <span>This action will:</span>
                <span>• Permanently delete transactions and trades associated with this wallet</span>
                <span>• Reset balance to 10 SOL</span>
            </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button size={"sm"} variant={'secondary'} onClick={() => setOpen(false)}>Cancel</Button>
                <Button size={"sm"} variant={'destructive'} onClick={handleResetWallet}>Reset wallet</Button>
            </DialogFooter>
        </DialogContent>
  </Dialog>
  )
}

export default ResetWallet