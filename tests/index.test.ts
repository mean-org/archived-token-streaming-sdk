import {Keypair} from '@solana/web3.js';
import {Connection} from '@solana/web3.js';
import {
  LAMPORTS_PER_SOL,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
  SystemProgram
} from '@solana/web3.js';
import {PublicKey} from "@solana/web3.js";
import {Transaction} from "@solana/web3.js";
import {Constants, MSP, TreasuryType} from '../src';
import {SubCategory} from "../src";
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
      lamports: 2000 * LAMPORTS_PER_SOL,
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
      TimeUnit.Minute,
      0,
      SubCategory.seed,
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
        LAMPORTS_PER_SOL * 1000,
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

    console.log('Withdraw from treasury');
    const withdrawTx = await msp.treasuryWithdraw(user1Wallet.publicKey,
        user1Wallet.publicKey,
        treasury, LAMPORTS_PER_SOL);
    withdrawTx.partialSign(user1Wallet);
    const withdrawTxSerialized = withdrawTx.serialize({
        verifySignatures: true,
    });
    await sendAndConfirmRawTransaction(connection, withdrawTxSerialized, { commitment: 'confirmed' });
    console.log('Withdrew from treasury\n');

    console.log("Waiting 5 seconds...")
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("Withdrawing from stream1");
    const withdrawStreamTx = await msp.withdraw(user2Wallet.publicKey, stream, 0.00000025 * LAMPORTS_PER_SOL);
    await sendAndConfirmTransaction(connection, withdrawStreamTx, [user2Wallet], { commitment: 'confirmed' });
    console.log("Withdraw from stream1 success.");

    console.log("Creating a non-vesting treasury");
    const [createTreasuryTx, treasuryNonVesting] = await msp.createTreasury2(
        user1Wallet.publicKey,
        user1Wallet.publicKey,
        Constants.SOL_MINT,
        "",
        TreasuryType.Open
    );
    const createNonVestingTreasuryTx = await sendAndConfirmTransaction(connection, createTreasuryTx, [user1Wallet], { commitment: 'confirmed' });
    console.log("Non vesting treasury created\n");

    console.log('Adding funds to the treasury');
    const addFundsNonVestingTx = await msp.addFunds(
        user1Wallet.publicKey,
        user1Wallet.publicKey,
        treasuryNonVesting,
        Constants.SOL_MINT,
        LAMPORTS_PER_SOL * 100,
    );
    addFundsNonVestingTx.partialSign(user1Wallet);
    const addFundsNonVestingTxSerialized = addFundsNonVestingTx.serialize({
      verifySignatures: true,
    });
    await sendAndConfirmRawTransaction(connection, addFundsNonVestingTxSerialized, { commitment: 'confirmed' });
    console.log('Funds added\n');

    console.log("Creating a non-vesting stream");
    const [createStreamTx3, nonVestingStream] = await msp.createStream2(
        user1Wallet.publicKey,
        user1Wallet.publicKey,
        treasuryNonVesting,
        user2Wallet.publicKey,
        NATIVE_MINT,
        'test_stream_3',
        10 * LAMPORTS_PER_SOL,
        0.1 * LAMPORTS_PER_SOL,
        1,
        new Date(),
    );
    createStreamTx3.partialSign(user1Wallet);
    const createStreamTx3Serialized = createStreamTx3.serialize({
      verifySignatures: true,
    });
    await sendAndConfirmRawTransaction(connection, createStreamTx3Serialized, { commitment: 'confirmed' });

    console.log("Non vesting stream created\n");

    console.log("Filtering treasury by category");
    const filtered_cat = await msp.listTreasuries(user1Wallet.publicKey, true, false, Category.vesting);
    expect(filtered_cat.length).eq(1);
    expect(filtered_cat.at(0)!.id).eq(treasury.toBase58());

    const filtered_cat_non_vesting = await msp.listTreasuries(user1Wallet.publicKey, true, false, Category.default);
    expect(filtered_cat_non_vesting.length).eq(1);
    expect(filtered_cat_non_vesting.at(0)!.id).eq(treasuryNonVesting.toBase58());
    console.log("Filter by category success.");

    console.log("Filtering treasury by sub category");
    const filtered_sub = await msp.listTreasuries(user1Wallet.publicKey, true, false, undefined, SubCategory.seed);
    expect(filtered_sub.length).eq(1);
    expect(filtered_sub.at(0)!.id).eq(treasury.toBase58());

    const filtered_sub_non_vesting = await msp.listTreasuries(user1Wallet.publicKey, true, false, undefined, SubCategory.default);
    expect(filtered_sub_non_vesting.length).eq(1);
    expect(filtered_sub_non_vesting.at(0)!.id).eq(treasuryNonVesting.toBase58());
    console.log("Filter by sub category success.");

    console.log("Filtering stream by category");
    const filtered_cat_stream = await msp.listStreams({
        treasury,
        category: Category.vesting,
    });
    expect(filtered_cat_stream.length).eq(2);
    const filtered_cat_stream_sorted = filtered_cat_stream.sort((a, b) => a.name.localeCompare(b.name));
    expect(filtered_cat_stream_sorted.at(0)!.id).eq(stream.toBase58());
    expect(filtered_cat_stream_sorted.at(1)!.id).eq(stream2.toBase58());
    const filtered_cat_stream_non_vesting = await msp.listStreams({
        treasury: treasuryNonVesting,
        category: Category.default,
    });
    expect(filtered_cat_stream_non_vesting.length).eq(1);
    expect(filtered_cat_stream_non_vesting.at(0)!.id).eq(nonVestingStream.toBase58());
    console.log("Filter stream by category success.");

    console.log("Filtering stream by sub category");
    const filtered_sub_stream = await msp.listStreams({
        treasury,
        subCategory: SubCategory.seed,
    });
    expect(filtered_sub_stream.length).eq(2);
    expect(filtered_sub_stream.at(0)!.id).eq(stream2.toBase58());
    expect(filtered_sub_stream.at(1)!.id).eq(stream.toBase58());

    const filtered_sub_stream_non_vesting = await msp.listStreams({
          treasury: treasuryNonVesting,
          subCategory: SubCategory.default,
    })
    expect(filtered_sub_stream_non_vesting.length).eq(1);
    expect(filtered_sub_stream_non_vesting.at(0)!.id).eq(nonVestingStream.toBase58());
    console.log("Filter stream by sub category success.");

    console.log("Getting vesting treasury activities");
    const res = await msp.listVestingTreasuryActivity(
        treasury,
        createNonVestingTreasuryTx,
        10,
        'confirmed',
        true
    );
    console.log(JSON.stringify(res, null, 2) + '\n');

    console.log("Getting vesting stream activities");
    const res2 = await msp.listStreamActivity(stream, createNonVestingTreasuryTx, 10, 'confirmed', true);
    console.log(JSON.stringify(res2, null, 2) + '\n');

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
