import * as fs from "fs-extra";
import { join } from "path";
import { homedir } from "os";
import { Keypair, Transaction } from '@solana/web3.js';
import BN from "bn.js";
import BigNumber from "bignumber.js";

export const getDefaultKeyPair = async (): Promise<Keypair> => {
    // const id = await fs.readJSON(join(homedir(), '.config/solana/id.json'));
    // const bytes = Uint8Array.from(id);
    // return Keypair.fromSecretKey(bytes);

    return Keypair.generate();
};

export const _printSerializedTx = (tx: Transaction, requireAllSignatures = false, verifySignatures = false) => {
    console.log(tx.serialize({
        requireAllSignatures,
        verifySignatures,
    }).toString('base64'));
}

export function sleep(ms: number) {
    console.log('Sleeping for', ms / 1000, 'seconds');
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const makeDecimal = (bn: BN, decimals: number): number => {
    return Number(bn.toString()) / Math.pow(10, decimals)
}

export const toTokenAmountBn = (amount: number | string, decimals: number) => {
    // if (!amount || !decimals) {
    //   return new BN(0);
    // }
  
    const multiplier = new BigNumber(10 ** decimals);
    const value = new BigNumber(amount);
    const result = value.multipliedBy(multiplier).integerValue();
    const toFixed = result.toFixed(0);
    return new BN(toFixed);
  }