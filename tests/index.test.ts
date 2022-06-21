import * as fs from 'fs-extra';
import { join } from 'path';
import { Keypair } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import { LAMPORTS_PER_SOL, sendAndConfirmTransaction, sendAndConfirmRawTransaction} from '@solana/web3.js';
import { Constants, MSP, TreasuryType } from '../src';

import { NATIVE_MINT } from '@solana/spl-token';
import {PublicKey} from "@solana/web3.js";
import {Transaction} from "@solana/web3.js";
import {TimeUnit} from "../src/types";

const endpoint = 'http://localhost:8899';
// deploy msp locally
// todo: find a better approach

let msp: MSP;

describe('Tests creating a vesting treasury\n', async () => {
  let connection: Connection;
  let user1Wallet: Keypair, user2Wallet: Keypair;

  before(async () => {
    user1Wallet = await getKeyPair('test-user-1.json');
    user2Wallet = await getKeyPair('test-user-2.json');

    connection = new Connection(endpoint, 'confirmed');

    await connection.confirmTransaction(
      await connection.requestAirdrop(
        user1Wallet.publicKey,
        10000 * LAMPORTS_PER_SOL,
      ),
      'confirmed',
    );
    await connection.confirmTransaction(
      await connection.requestAirdrop(
        user2Wallet.publicKey,
        100000 * LAMPORTS_PER_SOL,
      ),
      'confirmed',
    );
    msp = new MSP(endpoint, user1Wallet.publicKey.toBase58(), 'confirmed',
        new PublicKey("2nZ8KDGdPBexJwWznPZosioWJzNBSM3doUXUYdo37ndN"));
  });

  it('Creates a vesting treasury and vesting stream\n', async () => {
    console.log('Creating a vesting treasury');
    const [createVestingTreasuryTx, treasury] = await msp.createVestingTreasury(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      '',
      TreasuryType.Open,
      false,
      Constants.SOL_MINT,
      12,
      TimeUnit.Month,
      0,
      new Date(),
    );
    await sendAndConfirmTransaction(connection, createVestingTreasuryTx, [user1Wallet], { commitment: 'confirmed' });
    console.log(`Created a vesting treasury: ${treasury.toBase58()}\n`);

    console.log('Adding funds to the treasury');
    const addFundsTx = await msp.addFunds(
        user1Wallet.publicKey,
        user1Wallet.publicKey,
        treasury,
        Constants.SOL_MINT,
        LAMPORTS_PER_SOL * 500,
    );
    addFundsTx.partialSign(user1Wallet);
    const addFundsTxSerialized = addFundsTx.serialize({
      verifySignatures: true,
    });
    await sendAndConfirmRawTransaction(connection, addFundsTxSerialized, { commitment: 'confirmed' });
    console.log('Funds added\n');

    console.log('Fetching template data');
    const template = await msp.getStreamTemplate(treasury);
    console.log(`Template: ${JSON.stringify(template, null, 2)}\n`);

    console.log('Creating a vesting stream');
    const [createStreamTx, stream] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      user2Wallet.publicKey,
      NATIVE_MINT,
      100 * LAMPORTS_PER_SOL,
      'test_stream',
    );
    createStreamTx.partialSign(user1Wallet);
    const createStreamTxSerialized = createStreamTx.serialize({
      verifySignatures: true,
    });
    await sendAndConfirmRawTransaction(connection, createStreamTxSerialized, { commitment: 'confirmed' });
    console.log(`Stream created: ${stream.toBase58()}\n`);
  });
});

// util functions
const getKeyPair = async (path: string): Promise<Keypair> => {
  const id = await fs.readJSON(join(__dirname, path));
  const bytes = Uint8Array.from(id);
  return Keypair.fromSecretKey(bytes);
};

const _printSerializedTx = (tx: Transaction, requireAllSignatures = false, verifySignatures = false) => {
  console.log(tx.serialize({
    requireAllSignatures,
    verifySignatures,
  }).toString('base64'));
}
