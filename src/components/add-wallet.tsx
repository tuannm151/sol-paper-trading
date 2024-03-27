import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useRef, useState } from "react";
import { useToast } from "./ui/use-toast";
import db from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';
import { PlusCircleIcon } from "lucide-react";

const AddWallet = () => {
  const [name, setName] = useState<string | null>();
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

    const wallet = await db.wallets.where('name').equals(name).first();
    if(wallet) {
        toast({
            title: "Duplicate name",
            description: "A wallet with the same name already exists",
            variant: "destructive"
        });
        return;
    }

    await db.wallets.add({
        address: uuidv4(),
        name, 
        balanceSOL: balance,
        trades: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
    });
    toast({
        title: `Wallet ${name} created`,
        description: "The wallet has been created successfully",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="w-32 flex gap-1 items-center" onClick={() => setOpen(true)}>
            <PlusCircleIcon className="w-4 h-4"/>
            <span>Add wallet</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new wallet:</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              className="col-span-3"
              value={name ?? undefined}
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
              ref={balanceInputRef}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Create wallet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddWallet;