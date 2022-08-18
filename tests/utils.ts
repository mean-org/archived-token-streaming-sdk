import * as fs from "fs-extra";
import { join } from "path";
import { homedir } from "os";
import { ConfirmOptions, Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from "@project-serum/anchor";
import { IDL, Msp } from "../src/msp_idl_004";
import { Constants } from "../src/constants";

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

export const createProgram = (
    connection: Connection,
    walletAddress: string | PublicKey,
    _customProgramId?: PublicKey,
): Program<Msp> => {
    const opts: ConfirmOptions = {
        preflightCommitment: 'finalized',
        commitment: 'finalized',
    };

    const wallet: Wallet = {
        publicKey: typeof walletAddress === 'string' ? new PublicKey(walletAddress) : walletAddress,
        signAllTransactions: async (txs) => txs,
        signTransaction: async (tx) => tx,
        payer: Keypair.generate()
    };

    const provider = new AnchorProvider(connection, wallet, opts);

    if (_customProgramId) return new Program(IDL, _customProgramId, provider);
    return new Program(IDL, Constants.MSP, provider);
};