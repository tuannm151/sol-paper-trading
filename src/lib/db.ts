import { Settings, Wallet } from "@/types";
import Dexie from "dexie";
import crypto from "crypto";
import { v4 as uuidv4 } from 'uuid';

class DB extends Dexie {
    wallets: Dexie.Table<Wallet, string>;
    settings: Dexie.Table<Settings, string>;

    constructor(databaseName: string) {
        super(databaseName);
        this.version(1).stores({
            wallets: "&address, createdAt, updatedAt, name, balanceSOL, trades",
            settings: "&id, createdAt, updatedAt, defaultWallet, buyAmounts, sellAmountPercentages"
         });
        this.wallets = this.table("wallets");
        this.settings = this.table("settings");
    }
}

const db = new DB("tradequest_db");

const seedDB = async () => {
    const walletAddress = crypto.randomBytes(32).toString("hex");
    await db.wallets.add({
        address: walletAddress,
        name: "Default Wallet",
        balanceSOL: 10,
        trades: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    await db.settings.add({
        id: uuidv4(),
        defaultWallet: walletAddress,
        buyAmounts: [0.1, 0.2, 0.5, 1, 2, 5],
        sellAmountPercentages: [10, 20, 50, 70, 90, 100],
        slippage: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    window.location.reload();
};

db.on("populate", seedDB);

export default db;