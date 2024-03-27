import { Wallet } from "@/types";
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { useState } from "react";
import db from "@/lib/db";
import { useToast } from "./ui/use-toast";

interface Props {
    wallet: Wallet;
}

const DeleteWallet = ({ wallet }: Props) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleDeleteWallet = async () => {
    await db.wallets.delete(wallet.address);
    setOpen(false);
    toast({
        title: "Wallet deleted",
        description: "The wallet has been deleted successfully",
    });
  };

  return (
  <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
            <Button size={"sm"} variant={'destructive'}>Delete wallet</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Do you want to delete <span className="font-bold">{wallet.name}</span> wallet?</DialogTitle>
            <DialogDescription className="flex flex-col gap-1">
                <span>This action will:</span>
                <span>• Permanently delete transactions and trades associated with this wallet</span>
                <span>• Delete wallet and balance</span>
            </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button size={"sm"} variant={'secondary'} onClick={() => setOpen(false)}>Cancel</Button>
                <Button size={"sm"} variant={'destructive'} onClick={handleDeleteWallet}>Delete wallet</Button>
            </DialogFooter>
        </DialogContent>
  </Dialog>
  )
}

export default DeleteWallet