import {Keypair} from '@solana/web3.js';
import {Connection} from '@solana/web3.js';
import {LAMPORTS_PER_SOL, sendAndConfirmRawTransaction, sendAndConfirmTransaction} from '@solana/web3.js';
import {PublicKey} from "@solana/web3.js";
import {Transaction} from "@solana/web3.js";
import {Constants, MSP, TreasuryType} from '../src';
import {Category} from "../src";

import {NATIVE_MINT} from '@solana/spl-token';
import {TimeUnit} from "../src/types";
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
    connection = new Connection(endpoint, 'confirmed');
    await connection.confirmTransaction(
      await connection.requestAirdrop(
        user1Wallet.publicKey,
        1000 * LAMPORTS_PER_SOL,
      ),
      'confirmed',
    );
    console.log("Balance user1: : ", await connection.getBalance(user1Wallet.publicKey));

    await connection.confirmTransaction(
      await connection.requestAirdrop(
        user2Wallet.publicKey,
        1000 * LAMPORTS_PER_SOL,
      ),
      'confirmed',
    );
    console.log("Balance user2: : ", await connection.getBalance(user2Wallet.publicKey));

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

    console.log("Creating a non-vesting treasury");
    const createTreasuryTx = await msp.createTreasury(
        user1Wallet.publicKey,
        user1Wallet.publicKey,
        Constants.SOL_MINT,
        "",
        TreasuryType.Open
    );
    await sendAndConfirmTransaction(connection, createTreasuryTx, [user1Wallet], { commitment: 'confirmed' });
    console.log("Non vesting treasury created\n");

    console.log("Filtering treasury by category");
    const filtered = await msp.listTreasuries(user1Wallet.publicKey, true, false, Category.vesting);
    expect(filtered.length).eq(1);
    expect(filtered.at(0)!.id).eq(treasury.toBase58());
    console.log("Filter success.");
  });
});

const _printSerializedTx = (tx: Transaction, requireAllSignatures = false, verifySignatures = false) => {
  console.log(tx.serialize({
    requireAllSignatures,
    verifySignatures,
  }).toString('base64'));
}
