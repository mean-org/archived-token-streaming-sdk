import {Keypair} from '@solana/web3.js';
import {Connection} from '@solana/web3.js';
import {LAMPORTS_PER_SOL, sendAndConfirmRawTransaction, sendAndConfirmTransaction, SystemProgram} from '@solana/web3.js';
import {PublicKey} from "@solana/web3.js";
import {Transaction} from "@solana/web3.js";
import {Constants, MSP, TreasuryType} from '../src';
import * as fs from 'fs-extra';
import {homedir} from 'os';
import {join} from 'path';

import {NATIVE_MINT} from '@solana/spl-token';
import {Category, TimeUnit} from "../src/types";
import {expect} from "chai";

const endpoint = 'http://localhost:8899';
// deploy msp locally
// todo: find a better approach

let msp: MSP;

describe('Tests creating a vesting treasury\n', async () => {
  let connection: Connection;
  let user1Wallet: Keypair, user2Wallet: Keypair;

  before(async () => {
    user1Wallet = Keypair.generate();
    user2Wallet = Keypair.generate();
    const root = await getDefaultKeyPair();
    connection = new Connection(endpoint, 'confirmed');
    const tx = new Transaction();
    tx.add(SystemProgram.transfer({
      fromPubkey: root.publicKey,
      lamports: 1000 * LAMPORTS_PER_SOL,
      toPubkey: user1Wallet.publicKey
    }));
    tx.add(SystemProgram.transfer({
      fromPubkey: root.publicKey,
      lamports: 1000 * LAMPORTS_PER_SOL,
      toPubkey: user2Wallet.publicKey
    }));
    await sendAndConfirmTransaction(connection, tx, [root], { commitment: 'confirmed' });
    console.log("Balance user1: : ", await connection.getBalance(user1Wallet.publicKey, 'confirmed'));
    console.log("Balance user2: : ", await connection.getBalance(user2Wallet.publicKey, 'confirmed'));

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

    console.log('Creating vesting stream: 1');
    const [createStreamTx, stream] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      user2Wallet.publicKey,
      NATIVE_MINT,
      120 * LAMPORTS_PER_SOL,
      'test_stream',
    );
    createStreamTx.partialSign(user1Wallet);
    const createStreamTxSerialized = createStreamTx.serialize({
      verifySignatures: true,
    });
    await sendAndConfirmRawTransaction(connection, createStreamTxSerialized, { commitment: 'confirmed' });
    console.log(`Stream1 created: ${stream.toBase58()}\n`);

    console.log('Creating vesting stream: 2');
    const [createStreamTx2, stream2] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      user2Wallet.publicKey,
      NATIVE_MINT,
      60 * LAMPORTS_PER_SOL,
      'test_stream_2',
    );
    createStreamTx2.partialSign(user1Wallet);
    const createStreamTx2Serialized = createStreamTx2.serialize({
      verifySignatures: true,
    });
    await sendAndConfirmRawTransaction(connection, createStreamTx2Serialized, { commitment: 'confirmed' });
    console.log(`Stream2 created: ${stream2.toBase58()}\n`);

    console.log("Creating a non-vesting treasury");
    const createTreasuryTx = await msp.createTreasury(
        user1Wallet.publicKey,
        user1Wallet.publicKey,
        Constants.SOL_MINT,
        "",
        TreasuryType.Open
    );
    const createNonVestingTreasuryTx = await sendAndConfirmTransaction(connection, createTreasuryTx, [user1Wallet], { commitment: 'confirmed' });
    console.log("Non vesting treasury created\n");

    console.log("Filtering treasury by category");
    const filtered = await msp.listTreasuries(user1Wallet.publicKey, true, false, Category.vesting);
    expect(filtered.length).eq(1);
    expect(filtered.at(0)!.id).eq(treasury.toBase58());
    console.log("Filter success.");

    console.log("Getting vesting treasury activities");
    const res = await msp.listVestingTreasuryActivity(
        treasury,
        createNonVestingTreasuryTx,
        10,
        'confirmed',
        true
    );
    console.log(JSON.stringify(res, null, 2) + '\n');
    console.log("Getting vesting flow rate");
    const [rate, unit] = await msp.getVestingFlowRate(treasury);
    console.log(`Streaming ${rate/LAMPORTS_PER_SOL} SOL per ${TimeUnit[unit]}`);
  });
});

const getDefaultKeyPair = async (): Promise<Keypair> => {
  const id = await fs.readJSON(join(homedir(), '.config/solana/id.json'));
  const bytes = Uint8Array.from(id);
  return Keypair.fromSecretKey(bytes);
};

const _printSerializedTx = (tx: Transaction, requireAllSignatures = false, verifySignatures = false) => {
  console.log(tx.serialize({
    requireAllSignatures,
    verifySignatures,
  }).toString('base64'));
}
