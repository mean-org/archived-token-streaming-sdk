// How to use
// 1. Start local validator
//    solana-test-validator [-r]
// 2. Deploy msp locally:
//    cd mean-msp
//    anchor build -- --features test
//    anchor deploy --provider.cluster localnet
// 3. Deploy IDL for better debugging experience
//    anchor idl init --provider.cluster localnet --filepath target/idl/msp.json MSPdQo5ZdrPh6rU1LsvUv5nRhAnj1mj6YQEqBUq8YwZ
// 4. Run tests
//    cd mean-msp-sdk
//    yarn build
//    yarn test or yarn test-coverage

import { assert, expect } from "chai";
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
import { Category, Stream, StreamTemplate, STREAM_STATUS, SubCategory, TimeUnit, Treasury, TreasuryType } from "../src/types";
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

  let nonVestingTreasuryPubKey: PublicKey;
  let nonVestingStream1PubKey: PublicKey;
  let nonVestingStream2PubKey: PublicKey;

  let vestingTreasuryPubKey: PublicKey;
  let vestingTemplatePubKey: PublicKey;
  let vestingStream1PubKey: PublicKey;
  let vestingStream2PubKey: PublicKey;


  before(async () => {

    user1Wallet = Keypair.generate();
    user2Wallet = Keypair.generate();

    debugObject = {};
    connection = new Connection(endpoint, 'confirmed');

    // airdrop some rent sol to the fee account
    await connection.confirmTransaction(await connection.requestAirdrop(Constants.FEE_TREASURY, LAMPORTS_PER_SOL), 'confirmed');

    // airdrop some rent sol to the read on-chain data account
    await connection.confirmTransaction(await connection.requestAirdrop(Constants.READONLY_PUBKEY, LAMPORTS_PER_SOL), 'confirmed');

    await connection.confirmTransaction(await connection.requestAirdrop(user1Wallet.publicKey, 20 * LAMPORTS_PER_SOL), 'confirmed');

    await connection.confirmTransaction(await connection.requestAirdrop(user2Wallet.publicKey, 20 * LAMPORTS_PER_SOL), 'confirmed');

    program = createProgram(connection, programId);

    console.log(`World State:`);

    const wallet1Balance = await connection.getBalance(user1Wallet.publicKey, 'confirmed');
    console.log(`  wallet1: ${user1Wallet.publicKey} (balance: ${wallet1Balance.toString()})`);
    const wallet2Balance = await connection.getBalance(user2Wallet.publicKey, 'confirmed');
    console.log(`  wallet2: ${user2Wallet.publicKey} (balance: ${wallet2Balance.toString()})`);
    console.log();

    msp = new MSP(endpoint, programId, 'confirmed');

    const vestingTreasuryName = `MSP Testing #${Date.now()}`;
    const [createVestingTreasuryTx, vestingTreasury] = await msp.createVestingTreasury(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      vestingTreasuryName,
      TreasuryType.Open,
      false,
      Constants.SOL_MINT,
      12,
      TimeUnit.Minute,
      10 * LAMPORTS_PER_SOL,
      SubCategory.seed,
      new Date(),
      10, // 10 %
    );
    vestingTreasuryPubKey = vestingTreasury;
    console.log(`  treasury { id: ${vestingTreasuryPubKey}, name: ${vestingTreasuryName}, cat: vesting }`);
    createVestingTreasuryTx.partialSign(user1Wallet);
    const createVestingTreasuryTxSerialized = createVestingTreasuryTx.serialize({ verifySignatures: true });
    // console.log(createVestingTreasuryTxSerialized.toString('base64'));
    const createVestingTreasuryTxId = await sendAndConfirmRawTransaction(connection, createVestingTreasuryTxSerialized, { commitment: 'confirmed' });
    // console.log(`Created a vesting treasury: ${vestingTreasury.toBase58()} TX_ID: ${createVestingTreasuryTxId}\n`);

    // 6.
    const vestingStream1Name = 'vesting_stream_1';
    const [createStreamTx, vestingStream1] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      vestingTreasury,
      user2Wallet.publicKey,
      1 * LAMPORTS_PER_SOL,
      vestingStream1Name,
    );
    vestingStream1PubKey = vestingStream1;
    console.log(`    stream { id: ${vestingStream1PubKey}, name: ${vestingStream1Name}, cat: vesting }`);
    createStreamTx.partialSign(user1Wallet);
    const createStreamTxSerialized = createStreamTx.serialize({ verifySignatures: true });
    const createStreamTxId = await sendRawTestTransaction(connection, createStreamTxSerialized);
    // console.log(`Stream1 created: ${vestingStream1.toBase58()} TX_ID: ${createStreamTxId}\n`);

    // 7.
    const vestingStream2Name = 'vesting_stream_2';
    const [createStreamTx2, vestingStream2] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      vestingTreasury,
      user2Wallet.publicKey,
      1 * LAMPORTS_PER_SOL,
      vestingStream2Name,
    );
    vestingStream2PubKey = vestingStream2;
    console.log(`    stream { id: ${vestingStream2PubKey}, name: ${vestingStream2Name}, cat: vesting }`);
    createStreamTx2.partialSign(user1Wallet);
    const createStreamTx2Serialized = createStreamTx2.serialize({ verifySignatures: true });
    const createStreamTx2Id = await sendRawTestTransaction(connection, createStreamTx2Serialized);
    // console.log(`Stream2 created: ${vestingStream2.toBase58()} TX_ID: ${createStreamTx2Id}\n`);

    // 14.
    // console.log("Creating a non-vesting treasury");
    const [createTreasuryTx, nonVestingtreasury] = await msp.createTreasury2(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      Constants.SOL_MINT,
      "",
      TreasuryType.Open
    );
    nonVestingTreasuryPubKey = nonVestingtreasury;
    console.log(`  treasury { id: ${nonVestingTreasuryPubKey}, name: ${vestingTreasuryName}, cat: default }`);
    const createNonVestingTreasuryTx = await sendTestTransaction(connection, createTreasuryTx, [user1Wallet]);
    // console.log("Non vesting treasury created\n");

    // 15.
    // console.log('Adding funds to non-vesting treasury');
    const addFundsNonVestingTx = await msp.addFunds(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      nonVestingtreasury,
      Constants.SOL_MINT,
      LAMPORTS_PER_SOL,
    );
    addFundsNonVestingTx.partialSign(user1Wallet);
    const addFundsNonVestingTxSerialized = addFundsNonVestingTx.serialize({ verifySignatures: true });
    const addFundsNonVestingTxId = await sendRawTestTransaction(connection, addFundsNonVestingTxSerialized);
    // console.log(`Funds added TX_ID: ${addFundsNonVestingTxId}\n`);

    // 16.
    const nonVestingStream1Name = 'non-vesting_stream_1';
    const [createStreamTx3, nonVestingStream] = await msp.createStream2(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      nonVestingtreasury,
      user2Wallet.publicKey,
      nonVestingStream1Name,
      1 * LAMPORTS_PER_SOL,
      0.1 * LAMPORTS_PER_SOL,
      1,
      new Date(),
    );
    nonVestingStream1PubKey = nonVestingStream;
    console.log(`    stream { id: ${nonVestingStream1PubKey}, name: ${nonVestingStream1Name}, cat: default }`);
    createStreamTx3.partialSign(user1Wallet);
    const createStreamTx3Serialized = createStreamTx3.serialize({ verifySignatures: true });
    const createStreamTx3Id = await sendAndConfirmRawTransaction(connection, createStreamTx3Serialized, { commitment: 'confirmed' });
    // console.log(`Non vesting stream created TX_ID: ${createStreamTx3Id}\n`);

    console.log();
    await sleep(20000);
  });

  it('Fetches vesting template', async () => {
    // 3.
    // console.log('Fetching template data');
    const vestingTemplate = await msp.getStreamTemplate(vestingTreasuryPubKey);
    assert.exists(vestingTemplate);
    assert.equal(vestingTemplate.cliffVestPercent.toString(), '100000');
    assert.equal(vestingTemplate.rateIntervalInSeconds.toString(), '60');
    assert.equal(vestingTemplate.durationNumberOfUnits.toString(), '12');
    assert.equal(vestingTemplate.feePayedByTreasurer, false);
    // console.log(`Template: ${JSON.stringify(vestingTemplate, null, 2)}\n`);
  });

  it('Filters treasuries by category', async () => {
    // 17.
    // console.log("Filtering treasuries by category");
    const filteredVestingCategoryTreasuries = await msp.listTreasuries(user1Wallet.publicKey, false, Category.vesting);
    expect(filteredVestingCategoryTreasuries.length).eq(1);
    expect(filteredVestingCategoryTreasuries.at(0)!.id).eq(vestingTreasuryPubKey.toBase58());

    const filteredDefaultCategoryTreasuries = await msp.listTreasuries(user1Wallet.publicKey, false, Category.default);
    expect(filteredDefaultCategoryTreasuries.length).eq(1);
    expect(filteredDefaultCategoryTreasuries.at(0)!.id).eq(nonVestingTreasuryPubKey.toBase58());
    // console.log("Filter by category success.");
  });

  it('Filters treasuries by sub-category', async () => {
    // 18.
    // console.log("Filtering treasuries by sub-category");
    const filteredSeedSubCategoryTreasuries = await msp.listTreasuries(user1Wallet.publicKey, false, undefined, SubCategory.seed);
    expect(filteredSeedSubCategoryTreasuries.length).eq(1);
    expect(filteredSeedSubCategoryTreasuries.at(0)!.id).eq(vestingTreasuryPubKey.toBase58());

    const filteredDefaultSubCategoryTreasuries = await msp.listTreasuries(user1Wallet.publicKey, false, undefined, SubCategory.default);
    expect(filteredDefaultSubCategoryTreasuries.length).eq(1);
    expect(filteredDefaultSubCategoryTreasuries.at(0)!.id).eq(nonVestingTreasuryPubKey.toBase58());
    // console.log("Filter by sub-category success.");
  });

  it('Filters streams by category', async () => {
    // 19.
    // console.log("Filtering stream by category");
    const filteredVestingCategoryStreams = await msp.listStreams({
      treasury: vestingTreasuryPubKey,
      category: Category.vesting,
    });;
    const streamIds = filteredVestingCategoryStreams.map(s => s.id.toBase58());
    // console.log(streamIds);
    expect(filteredVestingCategoryStreams.length).eq(2);
    const filteredVestingCategoryStreamsSorted = filteredVestingCategoryStreams.sort((a, b) => a.name.localeCompare(b.name));
    expect(filteredVestingCategoryStreamsSorted.at(0)!.id.toBase58()).eq(vestingStream1PubKey.toBase58());
    expect(filteredVestingCategoryStreamsSorted.at(1)!.id.toBase58()).eq(vestingStream2PubKey.toBase58());

    const filteredDefaultCategoryStreams = await msp.listStreams({
      treasury: nonVestingTreasuryPubKey,
      category: Category.default,
    });
    expect(filteredDefaultCategoryStreams.length).eq(1);
    expect(filteredDefaultCategoryStreams.at(0)!.id.toBase58()).eq(nonVestingStream1PubKey.toBase58());
    // console.log("Filter stream by category success.");
  });

  it('Filters streams by sub-category', async () => {
    // 20.
    // console.log("Filtering stream by sub-category");
    const filteredVestingSubCategoryStreams = await msp.listStreams({
      treasury: vestingTreasuryPubKey,
      subCategory: SubCategory.seed,
    });
    expect(filteredVestingSubCategoryStreams.length).eq(2);
    const filteredVestingSubCategoryStreamsSorted = filteredVestingSubCategoryStreams.sort((a, b) => a.name.localeCompare(b.name))
    expect(filteredVestingSubCategoryStreamsSorted.at(0)!.id.toBase58()).eq(vestingStream1PubKey.toBase58());
    expect(filteredVestingSubCategoryStreamsSorted.at(1)!.id.toBase58()).eq(vestingStream2PubKey.toBase58());

    const filteredDefaultSubCategoryStreams = await msp.listStreams({
      treasury: nonVestingTreasuryPubKey,
      subCategory: SubCategory.default,
    })
    expect(filteredDefaultSubCategoryStreams.length).eq(1);
    expect(filteredDefaultSubCategoryStreams.at(0)!.id.toBase58()).eq(nonVestingStream1PubKey.toBase58());
    // console.log("Filter stream by sub category success.");
  });

  it('Gets vesting treasury flow rate', async () => {
    // 24.
    // console.log("Getting vesting treasury flow rate");
    const [rate, unit, totalAllocation] = await msp.getVestingFlowRate(vestingTreasuryPubKey);
    assert.equal(rate.toString(), '150000000', 'incorrect vesting treasury flow rate');
    assert.equal(unit, TimeUnit.Minute);
    assert.equal(totalAllocation.toString(), new BN(2 * LAMPORTS_PER_SOL).toString());
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
    // console.log(scheduled, scheduledEnum);
    assert.equal(scheduledEnum, 1);

    const running = 'Running';
    const runningEnum = STREAM_STATUS[running];
    // console.log(running, runningEnum);
    assert.equal(runningEnum, 2);


    const paused = 'Paused';
    const pausedEnum = STREAM_STATUS[paused];
    // console.log(paused, pausedEnum);
    assert.equal(pausedEnum, 3);
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

  xit('Creates different category treasuries and streams (vesting and non-vesting)', async () => {
    /**
     * 1. Create a vesting treasury and fund with 10 SOL
     * 2. Add funds (2 SOL) to the vesting treasury
     * 3. Fetch the vesting treasury template
     * 4. Modify the vesting treasury template
     * 5. Fetch the vesting treasury template after modification
     * 6. Create vesting stream: vesting_stream_1 (allocate 1 SOL)
     * 7. Create vesting stream: vesting_stream_2 (allocate 1 SOL)
     * 8. Withdraw 1 SOL from vesting treasury
     * 9. Sleep 5 seconds
     * 10. Allocate funds to vesting_stream_1 (0.00000025 * LAMPORTS_PER_SOL = 250 lamports)
     * 11. Pause vesting_stream_1
     * 12. Sleep 5 seconds and resume vesting_stream_1
     * 13. Refresh vesting treasury balance
     * 14. Create non-vesting treasury
     * 15. Add funds to non-vesting treasury (1 SOL)
     * 16. Create non-vesting stream (allocate 1 SOL)
     * 17. Filter treasuries by category
     * 18. Filter treasuries by sub-category
     * 19. Filter streams by category
     * 20. Filter streams by sub-category
     * 21. Get vesting treasury activities
     * 22. Get vesting stream activities
     * 23. Sleep 10
     * 24. Get vesting treasury flow rate
     * 25. Close vesting_test_1
     */

    // 1.
    console.log('Creating a vesting treasury');
    const [createVestingTreasuryTx, vestingTreasury] = await msp.createVestingTreasury(
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
    console.log(`Created a vesting treasury: ${vestingTreasury.toBase58()} TX_ID: ${createVestingTreasuryTxId}\n`);

    // 2.
    console.log('Adding funds to the treasury');
    const addFundsTx = await msp.addFunds(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      vestingTreasury,
      Constants.SOL_MINT,
      LAMPORTS_PER_SOL * 2,
    );
    addFundsTx.partialSign(user1Wallet);
    const addFundsTxSerialized = addFundsTx.serialize({ verifySignatures: true });
    console.log(addFundsTxSerialized.toString('base64'));
    const addFundsTxId = await sendAndConfirmRawTransaction(connection, addFundsTxSerialized, { commitment: 'confirmed' });
    console.log(`Funds added TX_ID: ${addFundsTxId}\n`);

    // 3.
    console.log('Fetching template data');
    let template = await msp.getStreamTemplate(vestingTreasury);
    console.log(`Template: ${JSON.stringify(template, null, 2)}\n`);

    // 4.
    console.log('Mofify template data');
    const modifyTx = await msp.modifyVestingTreasuryTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      vestingTreasury,
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

    // 5.
    console.log('Fetching template data after modification');
    template = await msp.getStreamTemplate(vestingTreasury);
    console.log(`Template: ${JSON.stringify(template, null, 2)}\n`);

    // 6.
    console.log('Creating vesting stream: 1');
    const [createStreamTx, vestingStream1] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      vestingTreasury,
      user2Wallet.publicKey,
      1 * LAMPORTS_PER_SOL,
      'vesting_stream_1',
    );
    createStreamTx.partialSign(user1Wallet);
    const createStreamTxSerialized = createStreamTx.serialize({ verifySignatures: true });
    const createStreamTxId = await sendRawTestTransaction(connection, createStreamTxSerialized);
    console.log(`Stream1 created: ${vestingStream1.toBase58()} TX_ID: ${createStreamTxId}\n`);

    // 7.
    console.log('Creating vesting stream: 2');
    const [createStreamTx2, stream2] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      vestingTreasury,
      user2Wallet.publicKey,
      1 * LAMPORTS_PER_SOL,
      'vesting_stream_2',
    );
    createStreamTx2.partialSign(user1Wallet);
    const createStreamTx2Serialized = createStreamTx2.serialize({ verifySignatures: true });
    const createStreamTx2Id = await sendRawTestTransaction(connection, createStreamTx2Serialized);
    console.log(`Stream2 created: ${stream2.toBase58()} TX_ID: ${createStreamTx2Id}\n`);

    // 8.
    console.log('Withdraw from treasury');
    const withdrawTx = await msp.treasuryWithdraw(user1Wallet.publicKey,
      user1Wallet.publicKey,
      vestingTreasury, LAMPORTS_PER_SOL);
    withdrawTx.partialSign(user1Wallet);
    const withdrawTxSerialized = withdrawTx.serialize({ verifySignatures: true });
    await sendRawTestTransaction(connection, withdrawTxSerialized);
    console.log('Withdrew from treasury success\n');

    // 9.
    await sleep(5000);
    console.log("Withdrawing from stream1");
    const withdrawStreamTx = await msp.withdraw(user2Wallet.publicKey, vestingStream1, 0.00000025 * LAMPORTS_PER_SOL);
    await sendAndConfirmTransaction(connection, withdrawStreamTx, [user2Wallet], { commitment: 'confirmed' });
    console.log("Withdraw from stream1 success.\n");

    // 10.
    console.log("Allocate funds to test_stream_1");
    const allocateStreamTx = await msp.allocate(user1Wallet.publicKey, user1Wallet.publicKey, vestingTreasury, vestingStream1, 3 * LAMPORTS_PER_SOL);
    await sendTestTransaction(connection, allocateStreamTx, [user1Wallet]);
    console.log("Allocate to stream1 success\n");

    // 11.
    console.log("Pausing test_stream_1");
    const PauseStreamTx = await msp.pauseStream(user1Wallet.publicKey, user1Wallet.publicKey, vestingStream1);
    await sendTestTransaction(connection, PauseStreamTx, [user1Wallet]);
    console.log("Pause stream1 success.\n");

    // 12.
    await sleep(5000);
    console.log("Resume test_stream_1");
    const ResumeStreamTx = await msp.resumeStream(user1Wallet.publicKey, user1Wallet.publicKey, vestingStream1);
    await sendTestTransaction(connection, ResumeStreamTx, [user1Wallet]);
    console.log("Resume stream1 success.\n");

    // 13.
    console.log("Refresh vesting treasury balance");
    const RefreshStreamTx = await msp.refreshTreasuryData(user1Wallet.publicKey, vestingTreasury);
    await sendTestTransaction(connection, RefreshStreamTx, [user1Wallet]);
    console.log("Treasury refresh success.\n");

    // 14.
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

    // 15.
    console.log('Adding funds to non-vesting treasury');
    const addFundsNonVestingTx = await msp.addFunds(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasuryNonVesting,
      Constants.SOL_MINT,
      LAMPORTS_PER_SOL,
    );
    addFundsNonVestingTx.partialSign(user1Wallet);
    const addFundsNonVestingTxSerialized = addFundsNonVestingTx.serialize({ verifySignatures: true });
    const addFundsNonVestingTxId = await sendRawTestTransaction(connection, addFundsNonVestingTxSerialized);
    console.log(`Funds added TX_ID: ${addFundsNonVestingTxId}\n`);

    // 16.
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

    // // 17.
    // console.log("Filtering treasuries by category");
    // const filteredVestingCategoryTreasuries = await msp.listTreasuries(user1Wallet.publicKey, false, Category.vesting);
    // expect(filteredVestingCategoryTreasuries.length).eq(1);
    // expect(filteredVestingCategoryTreasuries.at(0)!.id).eq(vestingTreasury.toBase58());

    // const filteredDefaultCategoryTreasuries = await msp.listTreasuries(user1Wallet.publicKey, false, Category.default);
    // expect(filteredDefaultCategoryTreasuries.length).eq(1);
    // expect(filteredDefaultCategoryTreasuries.at(0)!.id).eq(treasuryNonVesting.toBase58());
    // console.log("Filter by category success.");

    // // 18.
    // console.log("Filtering treasuries by sub-category");
    // const filteredSeedSubCategoryTreasuries = await msp.listTreasuries(user1Wallet.publicKey, false, undefined, SubCategory.seed);
    // expect(filteredSeedSubCategoryTreasuries.length).eq(1);
    // expect(filteredSeedSubCategoryTreasuries.at(0)!.id).eq(vestingTreasury.toBase58());

    // const filteredDefaultSubCategoryTreasuries = await msp.listTreasuries(user1Wallet.publicKey, false, undefined, SubCategory.default);
    // expect(filteredDefaultSubCategoryTreasuries.length).eq(1);
    // expect(filteredDefaultSubCategoryTreasuries.at(0)!.id).eq(treasuryNonVesting.toBase58());
    // console.log("Filter by sub-category success.");

    // // 19.
    // console.log("Filtering stream by category");
    // const filteredVestingCategoryStreams = await msp.listStreams({
    //   treasury: vestingTreasury,
    //   category: Category.vesting,
    // });;
    // const streamIds = filteredVestingCategoryStreams.map(s => s.id.toBase58());
    // console.log(streamIds);
    // expect(filteredVestingCategoryStreams.length).eq(2);
    // const filteredVestingCategoryStreamsSorted = filteredVestingCategoryStreams.sort((a, b) => a.name.localeCompare(b.name));
    // expect(filteredVestingCategoryStreamsSorted.at(0)!.id.toBase58()).eq(vestingStream1.toBase58());
    // expect(filteredVestingCategoryStreamsSorted.at(1)!.id.toBase58()).eq(stream2.toBase58());

    // const filteredDefaultCategoryStreams = await msp.listStreams({
    //   treasury: treasuryNonVesting,
    //   category: Category.default,
    // });
    // expect(filteredDefaultCategoryStreams.length).eq(1);
    // expect(filteredDefaultCategoryStreams.at(0)!.id.toBase58()).eq(nonVestingStream.toBase58());
    // console.log("Filter stream by category success.");

    // // 20.
    // console.log("Filtering stream by sub-category");
    // const filteredVestingSubCategoryStreams = await msp.listStreams({
    //   treasury: vestingTreasury,
    //   subCategory: SubCategory.seed,
    // });
    // expect(filteredVestingSubCategoryStreams.length).eq(2);
    // const filteredVestingSubCategoryStreamsSorted = filteredVestingCategoryStreams.sort((a, b) => a.name.localeCompare(b.name))
    // expect(filteredVestingSubCategoryStreamsSorted.at(0)!.id.toBase58()).eq(vestingStream1.toBase58());
    // expect(filteredVestingSubCategoryStreamsSorted.at(1)!.id.toBase58()).eq(stream2.toBase58());

    // const filteredDefaultSubCategoryStreams = await msp.listStreams({
    //   treasury: treasuryNonVesting,
    //   subCategory: SubCategory.default,
    // })
    // expect(filteredDefaultSubCategoryStreams.length).eq(1);
    // expect(filteredDefaultSubCategoryStreams.at(0)!.id.toBase58()).eq(nonVestingStream.toBase58());
    // console.log("Filter stream by sub category success.");

    // 21.
    // console.log("Getting vesting treasury activities");
    // const vestingTreasuryActivities = await msp.listVestingTreasuryActivity(vestingTreasury, createNonVestingTreasuryTx, 20, 'confirmed');
    // console.log(JSON.stringify(vestingTreasuryActivities, null, 2) + '\n');

    // // 22.
    // console.log("Getting vesting stream activities");
    // const vestingStreawActivities = await msp.listStreamActivity(vestingStream1, createNonVestingTreasuryTx, 10, 'confirmed');
    // console.log(JSON.stringify(vestingStreawActivities, null, 2) + '\n');

    // 23.
    // await sleep(10_000);

    // // 24.
    // console.log("Getting vesting treasury flow rate");
    // const [rate, unit, totalAllocation] = await msp.getVestingFlowRate(vestingTreasury);
    // console.log(`Streaming ${rate.toNumber() / LAMPORTS_PER_SOL} SOL per ${TimeUnit[unit]}`);
    // console.log(`Total Allocation: ${Number(totalAllocation.toString()) / LAMPORTS_PER_SOL}`);

    // 25.
    console.log("Close vesting_stream_1");
    const closeStreamTx = await msp.closeStream(user1Wallet.publicKey, user1Wallet.publicKey, vestingStream1, false, true);
    await sendAndConfirmTransaction(connection, closeStreamTx, [user1Wallet], { commitment: 'confirmed' });
    console.log("Close vesting_stream_1 success.\n");
  });

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
