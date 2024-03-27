import { Wallet } from "@/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useRef, useState } from "react";
import { useToast } from "./ui/use-toast";
import db from "@/lib/db";

interface Props {
    wallet: Wallet;
}

const EditWallet = ({ wallet }: Props) => {
  const [name, setName] = useState(wallet.name);
  const { toast } = useToast();
  const balanceInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  
  const handleSubmit = async () => {
    if(!name?.trim().length) {
      toast({
        title: "Name is required",
        description: "Please enter a name for the wallet",
        variant: "destructive"
      });
      return;
    }
    const balance = parseFloat(balanceInputRef.current?.value || '');
    if(isNaN(balance) || balance < 0) {
      toast({
        title: "Invalid balance number",
        description: "Please enter a positive number",
        variant: "destructive"
      });
      return;
    }

    const existedWallet = await db.wallets.where('name').equals(name).and((wallet) => wallet.address !== wallet.address).first();
    if(existedWallet) {
        toast({
            title: "Duplicate name",
            description: "A wallet with the same name already exists",
            variant: "destructive"
        });
        return;
    }

    await db.wallets.update(wallet.address, { name, balanceSOL: balance });
    toast({
        title: "Wallet updated",
        description: "The wallet has been updated successfully",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size={"sm"} variant={'secondary'} onClick={() => setOpen(true)}>Edit wallet</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit <span className="font-bold">{wallet.name}</span> wallet:</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              className="col-span-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="balance" className="text-right">
              Balance
            </Label>
            <Input
              id="balance"
              type="number"
              className="col-span-3"
              defaultValue={wallet?.balanceSOL.toFixed(3)}
              ref={balanceInputRef}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditWallet;
