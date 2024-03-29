// How to use
// 1. Start local validator
//    solana-test-validator [-r]
// 2. Deploy msp locally:
//    cd mean-msp
//    anchor build --provider.cluster localnet -- --features test
//    anchor deploy --provider.cluster localnet
// 3. Deploy IDL for better debugging experience
//    anchor idl init --provider.cluster localnet --filepath target/idl/msp.json MSPdQo5ZdrPh6rU1LsvUv5nRhAnj1mj6YQEqBUq8YwZ
// 4. Run tests
//    cd mean-msp-sdk
//    yarn build
//    yarn test

import { expect } from "chai";
import { AnchorError, Program, ProgramError } from '@project-serum/anchor';
import {
  Keypair,
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
  Transaction,
  Signer
} from '@solana/web3.js';

import {
  Constants,
  Msp,
  MSP,
  getFilteredStreamAccounts,
  getStreamStartUtcInSeconds,
  getStreamEstDepletionDate,
  getStreamStatus,
  getStreamRemainingAllocation,
  isStreamManuallyPaused,
  getStreamUnitsPerSecond,
  getStreamCliffAmount,
  createProgram,
  sleep
} from '../src';
import { Category, STREAM_STATUS, SubCategory, TimeUnit, TreasuryType } from "../src/types";
import { BN } from "bn.js";
import { toTokenAmountBn } from "./utils";

interface LooseObject {
  [key: string]: any
}

const endpoint = 'http://127.0.0.1:8899';
// const endpoint = clusterApiUrl('devnet');

let msp: MSP;

async function sendRawTestTransaction(connection: Connection, tx: Buffer): Promise<string> {
  try {
    return await sendAndConfirmRawTransaction(connection, tx, { commitment: 'confirmed' });
  } catch (error) {
    // console.log('error');
    // console.log(error);
    // console.log();

    const e = error as ProgramError;

    if (e.logs) {
      const anchorError = AnchorError.parse(e.logs);
      // console.log('anchorError');
      // console.log(anchorError);
      // console.log();

      if (anchorError) {
        // console.log(anchorError.error);
        throw anchorError;
      }

    }
    throw error;
  }
}

async function sendTestTransaction(connection: Connection, tx: Transaction, signers: Signer[]): Promise<string> {
  try {
    return await sendAndConfirmTransaction(connection, tx, signers, { commitment: 'confirmed' });
  } catch (error) {
    // console.log('error');
    // console.log(error);
    // console.log();

    const e = error as ProgramError;

    if (e.logs) {
      const anchorError = AnchorError.parse(e.logs);
      // console.log('anchorError');
      // console.log(anchorError);
      // console.log();

      if (anchorError) {
        // console.log(anchorError.error);
        throw anchorError;
      }

    }
    throw error;
  }
}

describe('MSP Tests\n', async () => {
  let connection: Connection;
  let program: Program<Msp>;
  let user1Wallet: Keypair;
  let user2Wallet: Keypair;
  const userWalletAddress = new PublicKey('4esXsAJjoExvhPZf1EMvDaajJeCTm72EYt3aurn3fFUG');
  const programId = 'MSPdQo5ZdrPh6rU1LsvUv5nRhAnj1mj6YQEqBUq8YwZ';
  let debugObject: LooseObject;

  before(async () => {
    console.log('Entering before..');
    user1Wallet = Keypair.generate();

    user2Wallet = Keypair.generate();

    debugObject = {};
    connection = new Connection(endpoint, 'confirmed');

    // airdrop some rent sol to the fee account
    console.log('before airdrop to fee account to pay rent');
    await connection.confirmTransaction(await connection.requestAirdrop(Constants.FEE_TREASURY, LAMPORTS_PER_SOL), 'confirmed');

    // airdrop some rent sol to the read on-chain data account
    console.log('before airdrop to fee account to pay rent');
    await connection.confirmTransaction(await connection.requestAirdrop(Constants.READONLY_PUBKEY, LAMPORTS_PER_SOL), 'confirmed');

    console.log('before airdrop to wallet #1');
    await connection.confirmTransaction(await connection.requestAirdrop(user1Wallet.publicKey, 20 * LAMPORTS_PER_SOL), 'confirmed');
    // await sleep(2000);
    console.log('before airdrop wallet 2');
    await connection.confirmTransaction(await connection.requestAirdrop(user2Wallet.publicKey, 20 * LAMPORTS_PER_SOL), 'confirmed');

    program = createProgram(connection, programId);

    console.log("Balance wallet1: : ", await connection.getBalance(user1Wallet.publicKey, 'confirmed'));
    console.log("Balance wallet2: : ", await connection.getBalance(user2Wallet.publicKey, 'confirmed'));
    msp = new MSP(endpoint, programId, 'confirmed');
  });

  xit('Test stream running', async () => {
    const strmId = new PublicKey('FEsT4HG1WG24sb785x9WvrnFPZuG4ic8fvg28aKKzFn1');
    const strmId2 = new PublicKey('4tA5bz8Ky3fAjyycvmNUFciUGgtS1qWZpnN8ii6MguRB');
    const data = await msp.getStream(strmId);
    console.log(data);
    const data2 = await msp.getStreamRaw(strmId2);
    console.log(data2);
    const data4 = await msp.listStreams({ treasurer: new PublicKey('468Z5p52439dAqjLzBm2FCNxvDSnpbMsNx85b7Kmz3TQ'), commitment: "confirmed" });
    console.log(data4);

  });

  it('Enum casting', () => {
    const scheduled = 'Scheduled';
    const scheduledEnum = STREAM_STATUS[scheduled];
    console.log(scheduled, scheduledEnum);

    const running = 'Running';
    const runningEnum = STREAM_STATUS[running];
    console.log(running, runningEnum);

    const paused = 'Paused';
    const pausedEnum = STREAM_STATUS[paused];
    console.log(paused, pausedEnum);
  });

  xit('BN & Bignumber', async () => {
    const strmId = new PublicKey('7uGiMnnnJdr28DPsCioeKLSF5uJjWP3wxYFGVmK3SEJh');
    const stream = await msp.getStreamRaw(strmId);
    if(!stream) throw new Error(`Stream ${strmId} was not found`);

    const slot = await program.provider.connection.getSlot('finalized');
    const blockTime = (await program.provider.connection.getBlockTime(slot)) as number;
    const timeDiff = Math.round((Date.now() / 1_000) - blockTime);

    let startUtcInSeconds = 0;
    if (stream.startUtc.gt(new BN(0))) {
      startUtcInSeconds = stream.startUtc.toNumber();
      console.log('startUtcInSeconds:1', startUtcInSeconds);
    }
    if (stream.startUtc.toString().length > 10) {
      startUtcInSeconds = parseInt(stream.startUtc.toString().substr(0, 10));
      console.log('startUtcInSeconds:2', startUtcInSeconds);
    }
    const result = stream.startUtc.toNumber();
    console.log('startUtcInSeconds:3', result);


    const totalSecondsPaused = stream.lastKnownTotalSecondsInPausedStatus.toString().length >= 10
      ? parseInt((stream.lastKnownTotalSecondsInPausedStatus.toNumber() / 1_000).toString())
      : stream.lastKnownTotalSecondsInPausedStatus.toNumber();

    let cliffUnits = new BN(0);
    if (stream.cliffVestPercent.gtn(0)) {
      const cliffVestPercent = stream.cliffVestPercent;
      const allocationAssignedUnits = stream.allocationAssignedUnits;
      cliffUnits = new BN(cliffVestPercent).mul(allocationAssignedUnits).div(new BN(Constants.CLIFF_PERCENT_DENOMINATOR));
      console.log('cliff:', cliffUnits.toString());
    }

    const secondsSinceStart = timeDiff - startUtcInSeconds;
    const streamedUnitsPerSecond = getStreamUnitsPerSecond(stream.rateAmountUnits, stream.rateIntervalInSeconds);
    const mult = streamedUnitsPerSecond * secondsSinceStart;
    const nonStopEarningUnits = cliffUnits.add(new BN(mult));
    const missedEarningUnitsWhilePaused = streamedUnitsPerSecond * totalSecondsPaused;

    console.log('nonStopEarningUnits and more: ', nonStopEarningUnits.toString(), missedEarningUnitsWhilePaused.toString());

  });

  // xit('Cliff calculation limit', () => {
  //   const PERCENT_DENOMINATOR = 1_000_000;
  //   const rateAmount = "29207750000000";
  //   const allocationAssigned = "368940000000000";
  //   const cliffMul = new BigNumber(rateAmount).multipliedBy(new BigNumber(allocationAssigned));
  //   console.log(`effective_cliff_units multiplied: ${cliffMul.toFixed(0)}, length: ${cliffMul.toFixed(0).length}`);
  //   const cliff = cliffMul.dividedBy(new BigNumber(PERCENT_DENOMINATOR));
  //   console.log(`effective_cliff_units final result: ${cliff.toFixed(0)}, length: ${cliff.toFixed(0).length}`);

  //   const cliffMulBn = new BN(rateAmount).mul(new BN(allocationAssigned));
  //   console.log(`multiplied: ${cliffMulBn.toString()}, length: ${cliffMulBn.toString().length}`);
  //   const cliffBn = cliffMulBn.div(new BN(PERCENT_DENOMINATOR));
  //   console.log(`final result: ${cliffBn.toString()}, length: ${cliffBn.toString().length}`);
  // });

  xit('Withdraw VC funds from 12-decimals token', async () => {
    const decimals = 12;
    const fundingAmount = 1_000_000;
    const fundingAmountRaw = toTokenAmountBn(fundingAmount, decimals);
    const streamPk = new PublicKey('78BH68vvd5B2WKpWckiSaohko8T8jwnYTFeW1QAx5DK7');

    console.log("Withdrawing from stream1");
    const withdrawStreamTx = await msp.treasuryWithdraw(user1Wallet.publicKey, user1Wallet.publicKey, streamPk, fundingAmountRaw.toString());
    const withdrawStreamTxId = await sendAndConfirmTransaction(connection, withdrawStreamTx, [user1Wallet], { commitment: 'confirmed' });
    console.log(`Withdraw from stream1 success. TX_ID: ${withdrawStreamTxId}\n`);
  });

  xit('Create VC for 12-decimals token', async () => {
    const decimals = 12;
    const fundingAmount = 1_000_000;
    const fundingAmountRaw = toTokenAmountBn(fundingAmount, decimals);
    const mint12Decimals = new PublicKey('Dma8Hv94ByVHMXDU8ioh6iW3P1gWTYk6PerAnGCtZMpv');

    console.log('Creating a vesting treasury');
    const [createVestingTreasuryTx, treasury] = await msp.createVestingTreasury(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      `${decimals}D CreateVestingTreasury ${Date.now()}`.slice(0, 32),
      TreasuryType.Open,
      false,
      mint12Decimals,
      12,
      TimeUnit.Minute,
      fundingAmountRaw.toString(),
      SubCategory.seed,
      new Date(),
    );
    createVestingTreasuryTx.partialSign(user1Wallet);
    const createVestingTreasuryTxSerialized = createVestingTreasuryTx.serialize({ verifySignatures: true });
    console.log(createVestingTreasuryTxSerialized.toString('base64'));
    const createVestingTreasuryTxId = await sendAndConfirmRawTransaction(connection, createVestingTreasuryTxSerialized, { commitment: 'confirmed' });
    console.log(`Created a vesting treasury: ${treasury.toBase58()} TX_ID: ${createVestingTreasuryTxId}\n`);

    console.log('Adding funds to the treasury');
    const addFundsTx = await msp.addFunds(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      mint12Decimals,
      fundingAmountRaw.toString(),
    );
    addFundsTx.partialSign(user1Wallet);
    const addFundsTxSerialized = addFundsTx.serialize({ verifySignatures: true });
    console.log(addFundsTxSerialized.toString('base64'));
    const addFundsTxId = await sendAndConfirmRawTransaction(connection, addFundsTxSerialized, { commitment: 'confirmed' });
    console.log(`Funds added TX_ID: ${addFundsTxId}\n`);

    console.log('Creating vesting stream...');
    const [createStreamTx, stream] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      user2Wallet.publicKey,
      fundingAmountRaw.toString(),
      `${decimals}D StreamWithTemplate at ${Date.now()}`.slice(0, 30)
    );
    createStreamTx.partialSign(user1Wallet);
    const createStreamTxSerialized = createStreamTx.serialize({ verifySignatures: true });
    console.log(createStreamTxSerialized.toString('base64'));
    const createStreamTxId = await sendAndConfirmRawTransaction(connection, createStreamTxSerialized, { commitment: 'confirmed' });
    console.log(`Stream created: ${stream.toBase58()} TX_ID: ${createStreamTxId}\n`);
  });

  xit('Create VC Stream for 12-decimals token', async () => {
    const decimals = 12;
    const fundingAmount = 368.94;
    const fundingAmountRaw = toTokenAmountBn(fundingAmount, decimals);
    const treasury = new PublicKey("CRNkS5tdh5w4DubU1jX7XDAMjLYnxYgw6Ey1Hfs35Sx5");

    console.log('Creating vesting stream...');
    const [createStreamTx, stream] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      user2Wallet.publicKey,
      fundingAmountRaw.toString(),
      `${decimals}D StreamWithTemplate at ${Date.now()}`.slice(0, 30)
    );
    createStreamTx.partialSign(user1Wallet);
    const createStreamTxSerialized = createStreamTx.serialize({ verifySignatures: true });
    console.log(createStreamTxSerialized.toString('base64'));
    const createStreamTxId = await sendAndConfirmRawTransaction(connection, createStreamTxSerialized, { commitment: 'confirmed' });
    console.log(`Stream created: ${stream.toBase58()} TX_ID: ${createStreamTxId}\n`);
  })

  xit('Create VC for 9-decimals token', async () => {
    const decimals = 9;
    const fundingAmount = 1_000_000;
    const fundingAmountRaw = toTokenAmountBn(fundingAmount, decimals);
    const mint12Decimals = new PublicKey('G1QahEecVmBhYibu8ZxPRqBSZQNYF8PRAXBLZpuVzRk9');

    console.log('Creating a vesting treasury');
    const [createVestingTreasuryTx, treasury] = await msp.createVestingTreasury(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      `MSP createVestingTreasury ${Date.now()}`.slice(0, 32),
      TreasuryType.Open,
      false,
      mint12Decimals,
      12,
      TimeUnit.Minute,
      fundingAmountRaw.toString(),
      SubCategory.seed,
      new Date(),
    );
    createVestingTreasuryTx.partialSign(user1Wallet);
    const createVestingTreasuryTxSerialized = createVestingTreasuryTx.serialize({ verifySignatures: true });
    console.log(createVestingTreasuryTxSerialized.toString('base64'));
    const createVestingTreasuryTxId = await sendAndConfirmRawTransaction(connection, createVestingTreasuryTxSerialized, { commitment: 'confirmed' });
    console.log(`Created a vesting treasury: ${treasury.toBase58()} TX_ID: ${createVestingTreasuryTxId}\n`);

    console.log('Adding funds to the treasury');
    const addFundsTx = await msp.addFunds(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      mint12Decimals,
      fundingAmountRaw.toString(),
    );
    addFundsTx.partialSign(user1Wallet);
    const addFundsTxSerialized = addFundsTx.serialize({ verifySignatures: true });
    console.log(addFundsTxSerialized.toString('base64'));
    const addFundsTxId = await sendAndConfirmRawTransaction(connection, addFundsTxSerialized, { commitment: 'confirmed' });
    console.log(`Funds added TX_ID: ${addFundsTxId}\n`);

    console.log('Creating vesting stream...');
    const [createStreamTx, stream] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      user2Wallet.publicKey,
      fundingAmountRaw.toString(),
      `MSP StreamWithTemplate at ${Date.now()}`.slice(0, 32)
    );
    createStreamTx.partialSign(user1Wallet);
    const createStreamTxSerialized = createStreamTx.serialize({ verifySignatures: true });
    const createStreamTxId = await sendAndConfirmRawTransaction(connection, createStreamTxSerialized, { commitment: 'confirmed' });
    console.log(`Stream created: ${stream.toBase58()} TX_ID: ${createStreamTxId}\n`);

  });

  it('Creates a vesting treasury and vesting stream', async () => {
    console.log('Creating a vesting treasury');
    const [createVestingTreasuryTx, treasury] = await msp.createVestingTreasury(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      `MSP Testing #${Date.now()}`,
      TreasuryType.Open,
      false,
      Constants.SOL_MINT,
      12,
      TimeUnit.Minute,
      10 * LAMPORTS_PER_SOL,
      SubCategory.seed,
      new Date(),
    );
    createVestingTreasuryTx.partialSign(user1Wallet);
    const createVestingTreasuryTxSerialized = createVestingTreasuryTx.serialize({ verifySignatures: true });
    console.log(createVestingTreasuryTxSerialized.toString('base64'));
    const createVestingTreasuryTxId = await sendAndConfirmRawTransaction(connection, createVestingTreasuryTxSerialized, { commitment: 'confirmed' });
    console.log(`Created a vesting treasury: ${treasury.toBase58()} TX_ID: ${createVestingTreasuryTxId}\n`);

    console.log('Adding funds to the treasury');
    const addFundsTx = await msp.addFunds(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      Constants.SOL_MINT,
      LAMPORTS_PER_SOL * 2,
    );
    addFundsTx.partialSign(user1Wallet);
    const addFundsTxSerialized = addFundsTx.serialize({ verifySignatures: true });
    console.log(addFundsTxSerialized.toString('base64'));
    const addFundsTxId = await sendAndConfirmRawTransaction(connection, addFundsTxSerialized, { commitment: 'confirmed' });
    console.log(`Funds added TX_ID: ${addFundsTxId}\n`);

    console.log('Fetching template data');
    let template = await msp.getStreamTemplate(treasury);
    console.log(`Template: ${JSON.stringify(template, null, 2)}\n`);

    console.log('Mofify template data');
    const modifyTx = await msp.modifyVestingTreasuryTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      10,
      TimeUnit.Minute,
      undefined,
      10,
      undefined,
    );
    modifyTx.partialSign(user1Wallet);
    const modifyTxSerialized = modifyTx.serialize({ verifySignatures: true });
    const modifyTxId = await sendRawTestTransaction(connection, modifyTxSerialized);
    console.log(`Template modified ${modifyTxId} \n`);

    console.log('Fetching template data after modification');
    template = await msp.getStreamTemplate(treasury);
    console.log(`Template: ${JSON.stringify(template, null, 2)}\n`);

    console.log('Creating vesting stream: 1');
    const [createStreamTx, stream] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      user2Wallet.publicKey,
      1 * LAMPORTS_PER_SOL,
      'test_stream',
    );
    createStreamTx.partialSign(user1Wallet);
    const createStreamTxSerialized = createStreamTx.serialize({ verifySignatures: true });
    const createStreamTxId = await sendRawTestTransaction(connection, createStreamTxSerialized);
    console.log(`Stream1 created: ${stream.toBase58()} TX_ID: ${createStreamTxId}\n`);

    console.log('Creating vesting stream: 2');
    const [createStreamTx2, stream2] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      user2Wallet.publicKey,
      1 * LAMPORTS_PER_SOL,
      'test_stream_2',
    );
    createStreamTx2.partialSign(user1Wallet);
    const createStreamTx2Serialized = createStreamTx2.serialize({ verifySignatures: true });
    const createStreamTx2Id = await sendRawTestTransaction(connection, createStreamTx2Serialized);
    console.log(`Stream2 created: ${stream2.toBase58()} TX_ID: ${createStreamTx2Id}\n`);

    console.log('Withdraw from treasury');
    const withdrawTx = await msp.treasuryWithdraw(user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury, LAMPORTS_PER_SOL);
    withdrawTx.partialSign(user1Wallet);
    const withdrawTxSerialized = withdrawTx.serialize({ verifySignatures: true });

    await sendRawTestTransaction(connection, withdrawTxSerialized);
    console.log('Withdrew from treasury success\n');

    await sleep(5000);
    console.log("Withdrawing from stream1");
    const withdrawStreamTx = await msp.withdraw(user2Wallet.publicKey, stream, 0.00000025 * LAMPORTS_PER_SOL);
    await sendAndConfirmTransaction(connection, withdrawStreamTx, [user2Wallet], { commitment: 'confirmed' });
    console.log("Withdraw from stream1 success.\n");

    console.log("Allocate funds to stream1");
    const allocateStreamTx = await msp.allocate(user1Wallet.publicKey, user1Wallet.publicKey, treasury, stream, 3 * LAMPORTS_PER_SOL);
    await sendTestTransaction(connection, allocateStreamTx, [user1Wallet]);
    console.log("Allocate to stream1 success\n");

    console.log("Pausing stream1");
    const PauseStreamTx = await msp.pauseStream(user1Wallet.publicKey, user1Wallet.publicKey, stream);
    await sendTestTransaction(connection, PauseStreamTx, [user1Wallet]);
    console.log("Pause stream1 success.\n");

    await sleep(5000);
    console.log("Resume stream1");
    const ResumeStreamTx = await msp.resumeStream(user1Wallet.publicKey, user1Wallet.publicKey, stream);
    await sendTestTransaction(connection, ResumeStreamTx, [user1Wallet]);
    console.log("Resume stream1 success.\n");


    console.log("Refresh treasury balance");
    const RefreshStreamTx = await msp.refreshTreasuryData(user1Wallet.publicKey, treasury);
    await sendTestTransaction(connection, RefreshStreamTx, [user1Wallet]);
    console.log("Treasury refresh success.\n");

    console.log("Creating a non-vesting treasury");
    const [createTreasuryTx, treasuryNonVesting] = await msp.createTreasury2(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      Constants.SOL_MINT,
      "",
      TreasuryType.Open
    );
    const createNonVestingTreasuryTx = await sendTestTransaction(connection, createTreasuryTx, [user1Wallet]);
    console.log("Non vesting treasury created\n");

    console.log('Adding funds to the treasury');
    const addFundsNonVestingTx = await msp.addFunds(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasuryNonVesting,
      Constants.SOL_MINT,
      LAMPORTS_PER_SOL * 1,
    );
    addFundsNonVestingTx.partialSign(user1Wallet);
    const addFundsNonVestingTxSerialized = addFundsNonVestingTx.serialize({ verifySignatures: true });
    const addFundsNonVestingTxId = await sendRawTestTransaction(connection, addFundsNonVestingTxSerialized);
    console.log(`Funds added TX_ID: ${addFundsNonVestingTxId}\n`);

    console.log("Creating a non-vesting stream");
    const [createStreamTx3, nonVestingStream] = await msp.createStream2(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasuryNonVesting,
      user2Wallet.publicKey,
      'test_stream_3',
      1 * LAMPORTS_PER_SOL,
      0.1 * LAMPORTS_PER_SOL,
      1,
      new Date(),
    );
    createStreamTx3.partialSign(user1Wallet);
    const createStreamTx3Serialized = createStreamTx3.serialize({ verifySignatures: true });
    const createStreamTx3Id = await sendAndConfirmRawTransaction(connection, createStreamTx3Serialized, { commitment: 'confirmed' });
    console.log(`Non vesting stream created TX_ID: ${createStreamTx3Id}\n`);

    console.log("Filtering treasury by category");
    const filtered_cat = await msp.listTreasuries(user1Wallet.publicKey, false, Category.vesting);
    expect(filtered_cat.length).eq(1);
    expect(filtered_cat.at(0)!.id).eq(treasury.toBase58());

    const filtered_cat_non_vesting = await msp.listTreasuries(user1Wallet.publicKey, false, Category.default);
    expect(filtered_cat_non_vesting.length).eq(1);
    expect(filtered_cat_non_vesting.at(0)!.id).eq(treasuryNonVesting.toBase58());
    console.log("Filter by category success.");

    console.log("Filtering treasury by sub category");
    const filtered_sub = await msp.listTreasuries(user1Wallet.publicKey, false, undefined, SubCategory.seed);
    expect(filtered_sub.length).eq(1);
    expect(filtered_sub.at(0)!.id).eq(treasury.toBase58());

    const filtered_sub_non_vesting = await msp.listTreasuries(user1Wallet.publicKey, false, undefined, SubCategory.default);
    expect(filtered_sub_non_vesting.length).eq(1);
    expect(filtered_sub_non_vesting.at(0)!.id).eq(treasuryNonVesting.toBase58());
    console.log("Filter by sub category success.");

    console.log("Filtering stream by category");
    const filtered_cat_stream = await msp.listStreams({
      treasury,
      category: Category.vesting,
    });;
    const streamIds = filtered_cat_stream.map(s => s.id.toBase58());
    console.log(streamIds);
    expect(filtered_cat_stream.length).eq(2);
    const filtered_cat_stream_sorted = filtered_cat_stream.sort((a, b) => a.name.localeCompare(b.name));
    expect(filtered_cat_stream_sorted.at(0)!.id.toBase58()).eq(stream.toBase58());
    expect(filtered_cat_stream_sorted.at(1)!.id.toBase58()).eq(stream2.toBase58());
    const filtered_cat_stream_non_vesting = await msp.listStreams({
      treasury: treasuryNonVesting,
      category: Category.default,
    });
    expect(filtered_cat_stream_non_vesting.length).eq(1);
    expect(filtered_cat_stream_non_vesting.at(0)!.id.toBase58()).eq(nonVestingStream.toBase58());
    console.log("Filter stream by category success.");

    console.log("Filtering stream by sub category");
    const filtered_sub_stream = await msp.listStreams({
      treasury,
      subCategory: SubCategory.seed,
    });
    expect(filtered_sub_stream.length).eq(2);
    const filtered_sub_stream_sorted = filtered_cat_stream.sort((a, b) => a.name.localeCompare(b.name))
    
    expect(filtered_sub_stream_sorted.at(0)!.id.toBase58()).eq(stream.toBase58());
    expect(filtered_sub_stream_sorted.at(1)!.id.toBase58()).eq(stream2.toBase58());

    const filtered_sub_stream_non_vesting = await msp.listStreams({
      treasury: treasuryNonVesting,
      subCategory: SubCategory.default,
    })
    expect(filtered_sub_stream_non_vesting.length).eq(1);
    expect(filtered_sub_stream_non_vesting.at(0)!.id.toBase58()).eq(nonVestingStream.toBase58());
    console.log("Filter stream by sub category success.");

    console.log("Getting vesting treasury activities");
    const res = await msp.listVestingTreasuryActivity(treasury, createNonVestingTreasuryTx, 20, 'confirmed');
    console.log(JSON.stringify(res, null, 2) + '\n');

    console.log("Getting vesting stream activities");
    const res2 = await msp.listStreamActivity(stream, createNonVestingTreasuryTx, 10, 'confirmed');
    console.log(JSON.stringify(res2, null, 2) + '\n');

    await sleep(10_000);

    console.log("Getting vesting flow rate");
    const [rate, unit, totalAllocation] = await msp.getVestingFlowRate(treasury);
    console.log(`Streaming ${rate.toNumber() / LAMPORTS_PER_SOL} SOL per ${TimeUnit[unit]}`);
    console.log(`Total Allocation: ${Number(totalAllocation.toString()) / LAMPORTS_PER_SOL}`);

    console.log("Close stream1");
    const CloseStreamTx = await msp.closeStream(user1Wallet.publicKey, user1Wallet.publicKey, stream, false, true);
    await sendAndConfirmTransaction(connection, CloseStreamTx, [user1Wallet], { commitment: 'confirmed' });
    console.log("Close stream1 success.\n");
  });

  xit('utils > listTreasuries', async () => {
    try {
      const treasuries = await msp.listTreasuries(userWalletAddress, true, Category.default);
      console.log('treasuries:');
      treasuries.forEach(s => console.log(`id: ${s.id} | name: ${s.name}`));
      expect(treasuries.length).not.eq(0);
    } catch (error) {
      console.error(error);
      expect(true).eq(false);
    }
  })

  xit('MSP > listStreams', async () => {
    try {
      console.log("List streams");
      const streams = await msp.listStreams({
        treasurer: userWalletAddress,
        beneficiary: userWalletAddress,
        category: Category.default,
      });
      console.log('Streams:');
      streams.forEach(s => console.log(`id: ${s.id.toBase58()} | name: ${s.name} | wAmount: ${s.withdrawableAmount.toString()}`));
      expect(streams.length).not.eq(0);
      console.log("List streams success.");

    } catch (error) {
      console.error(error);
      expect(true).eq(false);
    }
  })

  // xit('MSP > listStreams > select stream using filter and get info', async () => {
  //   const targetStreamAddress = 'Cx14kzEJJqUsXYdKS6BcXGGM4Mtn6m3VbRpr3o1FifdK';
  //   try {
  //     console.log("Get list of streams...");
  //     const accounts = await getFilteredStreamAccounts(
  //       program,
  //       userWalletAddress,
  //       undefined,
  //       userWalletAddress,
  //       Category.default,
  //     );
  //     console.log("Selecting stream:", targetStreamAddress);
  //     expect(accounts.length).not.eq(0);

  //     const item = accounts.find(a => a.publicKey.toString() === targetStreamAddress);
  //     expect(item).not.be.undefined;
  //     expect(item.publicKey.toBase58()).equal(targetStreamAddress);
  //     expect(item.account).not.be.undefined;

  //     // To hold the value of the withdrawable amount
  //     let streamWithdrawableAmount = new BN(0);

  //     if (item) {
  //       if (item.account !== undefined) {
  //         const slot = await program.provider.connection.getSlot('finalized');
  //         const blockTime = (await program.provider.connection.getBlockTime(slot)) as number;
  //         const stream = item.account;
  //         const address = item.publicKey;
  //         const nameBuffer = Buffer.from(stream.name);
  //         const createdOnUtcInSeconds = stream.createdOnUtc
  //           ? stream.createdOnUtc.toNumber()
  //           : 0;
  //         const startUtcInSeconds = getStreamStartUtcInSeconds(stream);
  //         const effectiveCreatedOnUtcInSeconds = createdOnUtcInSeconds > 0
  //           ? createdOnUtcInSeconds
  //           : startUtcInSeconds;
  //         const timeDiff = Math.round((Date.now() / 1_000) - blockTime);
  //         const startUtc = new Date(startUtcInSeconds * 1000);
  //         const depletionDate = getStreamEstDepletionDate(stream);
  //         const status = getStreamStatus(stream, timeDiff);
  //         // const streamMissedEarningUnitsWhilePaused = getStreamMissedEarningUnitsWhilePaused(stream);
  //         const remainingAllocation = getStreamRemainingAllocation(stream);
  //         const manuallyPaused = isStreamManuallyPaused(stream);
  //         const cliffAmount = getStreamCliffAmount(stream);
  //         const streamUnitsPerSecond = getStreamUnitsPerSecond(stream);

  //         debugObject = {
  //           id: address.toBase58(),
  //           version: stream.version,
  //           name: new TextDecoder().decode(nameBuffer),
  //           startUtc: startUtc.toString(),
  //           secondsSinceStart: blockTime - startUtcInSeconds,
  //           cliffVestPercent: stream.cliffVestPercent.toNumber() / 10_000,
  //           cliffVestAmount: cliffAmount.toString(),
  //           allocationAssigned: stream.allocationAssignedUnits.toString(),
  //           estimatedDepletionDate: depletionDate.toString(),
  //           rateAmount: stream.rateAmountUnits.toString(),
  //           rateIntervalInSeconds: stream.rateIntervalInSeconds.toNumber(),
  //           totalWithdrawalsAmount: stream.totalWithdrawalsUnits.toString(),
  //           remainingAllocation: remainingAllocation.toString(),
  //           status: `${STREAM_STATUS[status]} = ${status}`,
  //           manuallyPaused: manuallyPaused,
  //           streamUnitsPerSecond: streamUnitsPerSecond,
  //         };

  //         // Continue evaluating if there is remaining allocation
  //         if (remainingAllocation.gtn(0)) {
  //           // Continue evaluating if the stream is not scheduled
  //           if (status !== STREAM_STATUS.Scheduled) {

  //             if (status === STREAM_STATUS.Paused) {  // Check if PAUSED
  //               const manuallyPaused = isStreamManuallyPaused(stream);
  //               const withdrawableWhilePausedAmount = manuallyPaused
  //                 ? stream.lastManualStopWithdrawableUnitsSnap
  //                 : remainingAllocation;
  //               streamWithdrawableAmount = BN.max(new BN(0), withdrawableWhilePausedAmount);
  //             } else if (stream.rateAmountUnits.isZero() ||
  //               stream.rateIntervalInSeconds.isZero()) {  // Check if NOT RUNNING
  //               streamWithdrawableAmount = new BN(0);
  //             } else {
  //               const blocktimeRelativeNow = Math.round((Date.now() / 1_000) - timeDiff);
  //               const startUtcInSeconds = getStreamStartUtcInSeconds(stream);
  //               const timeSinceStart = blocktimeRelativeNow - startUtcInSeconds;

  //               const cliffAmount2 = new BigNumber(cliffAmount.toString());
  //               const unitsSinceStart = new BigNumber(streamUnitsPerSecond * timeSinceStart);
  //               const nonStopEarningUnits2 = cliffAmount2.plus(unitsSinceStart).toString();

  //               const nonStopEarningUnits = new BN(nonStopEarningUnits2);
  //               const totalSecondsPaused = stream.lastKnownTotalSecondsInPausedStatus.toString().length >= 10
  //                 ? parseInt((stream.lastKnownTotalSecondsInPausedStatus.toNumber() / 1_000).toString())
  //                 : stream.lastKnownTotalSecondsInPausedStatus.toNumber();
  //               const missedEarningUnitsWhilePaused = streamUnitsPerSecond * totalSecondsPaused;
  //               let entitledEarnings = nonStopEarningUnits;

  //               if (nonStopEarningUnits.gten(missedEarningUnitsWhilePaused)) {
  //                 entitledEarnings = nonStopEarningUnits.subn(missedEarningUnitsWhilePaused);
  //               }

  //               let withdrawableUnitsWhileRunning = entitledEarnings;

  //               if (entitledEarnings.gte(stream.totalWithdrawalsUnits)) {
  //                 withdrawableUnitsWhileRunning = entitledEarnings.sub(stream.totalWithdrawalsUnits);
  //               }

  //               const withdrawableAmount = BN.min(remainingAllocation, withdrawableUnitsWhileRunning);

  //               streamWithdrawableAmount = BN.max(new BN(0), withdrawableAmount);

  //               debugObject.startUtcInSeconds = startUtcInSeconds;
  //               debugObject.timeSinceStart = timeSinceStart;
  //               debugObject.nonStopEarningUnits = nonStopEarningUnits.toString();
  //               debugObject.missedEarningUnitsWhilePaused = missedEarningUnitsWhilePaused.toString();
  //               debugObject.withdrawableUnitsWhileRunning = withdrawableUnitsWhileRunning.toString();
  //             }

  //           }
  //         }

  //         debugObject.withdrawableAmount = streamWithdrawableAmount.toString();  // last
  //         console.table(debugObject);

  //       }
  //     }

  //     console.log("Selecting stream and get info success.");

  //   } catch (error) {
  //     console.error(error);
  //     expect(true).eq(false);
  //   }
  // });

});
