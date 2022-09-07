import { expect } from "chai";
import { Program } from '@project-serum/anchor';
import {
  Keypair,
  Connection,
  PublicKey,
  clusterApiUrl
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
  listTreasuries,
  createProgram
} from '../src';
import { getDefaultKeyPair } from "./utils";
import { Category, STREAM_STATUS } from "../src/types";
import { BN } from "bn.js";
import BigNumber from "bignumber.js";

interface LooseObject {
  [key: string]: any
}

const endpoint = clusterApiUrl('devnet'); //'http://localhost:8899';
// deploy msp locally
// todo: find a better approach

let msp: MSP;

describe('MSP Tests\n', async () => {
  let connection: Connection;
  let program: Program<Msp>;
  let user1Wallet: Keypair;
  let user2Wallet: Keypair;
  // const userWalletAddress = new PublicKey('DG6nJknzbAq8xitEjMEqUbc77PTzPDpzLjknEXn3vdXZ');
  const userWalletAddress = new PublicKey('4esXsAJjoExvhPZf1EMvDaajJeCTm72EYt3aurn3fFUG');
  const programId = 'MSPdQo5ZdrPh6rU1LsvUv5nRhAnj1mj6YQEqBUq8YwZ';
  let debugObject: LooseObject;

  before(async () => {

    user1Wallet = Keypair.generate();
    user2Wallet = Keypair.generate();
    const root = await getDefaultKeyPair();
    debugObject = {};
    connection = new Connection(endpoint, 'confirmed');
    program = createProgram(connection, programId);
    /*
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
    // fund the fees account to avoid error 'Transaction leaves an account with a lower balance than rent-exempt minimum'
    tx.add(SystemProgram.transfer({
      fromPubkey: root.publicKey,
      lamports: 1000 * LAMPORTS_PER_SOL,
      toPubkey: new PublicKey("3TD6SWY9M1mLY2kZWJNavPLhwXvcRsWdnZLRaMzERJBw")
    }));
    tx.add(SystemProgram.transfer({
      fromPubkey: root.publicKey,
      lamports: 1000 * LAMPORTS_PER_SOL,
      toPubkey: Constants.READONLY_PUBKEY
    }));
    await sendAndConfirmTransaction(connection, tx, [root], { commitment: 'confirmed' });
    console.log("Balance user1: : ", await connection.getBalance(user1Wallet.publicKey, 'confirmed'));
    console.log("Balance user2: : ", await connection.getBalance(user2Wallet.publicKey, 'confirmed'));
    */
    msp = new MSP(endpoint, programId, 'confirmed');
  });

/*
  it('Creates a vesting treasury and vesting stream', async () => {
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
      2 * LAMPORTS_PER_SOL,
      SubCategory.seed,
      new Date(),
    );
    createVestingTreasuryTx.partialSign(user1Wallet);
    const createVestingTreasuryTxSerialized = createVestingTreasuryTx.serialize({
      verifySignatures: true,
    });
    await sendAndConfirmRawTransaction(connection, createVestingTreasuryTxSerialized, { commitment: 'confirmed' });
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
    const modifyTxSerialized = modifyTx.serialize({
      verifySignatures: true,
    });
    await sendAndConfirmRawTransaction(connection, modifyTxSerialized, { commitment: 'confirmed' });
    console.log('Template modified\n');

    console.log('Fetching template data after modification');
    template = await msp.getStreamTemplate(treasury);
    console.log(`Template: ${JSON.stringify(template, null, 2)}\n`);

    console.log('Creating vesting stream: 1');
    const [createStreamTx, stream] = await msp.createStreamWithTemplate(
      user1Wallet.publicKey,
      user1Wallet.publicKey,
      treasury,
      user2Wallet.publicKey,
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
    console.log('Withdrew from treasury success\n');

    await sleep(5000);
    console.log("Withdrawing from stream1");
    const withdrawStreamTx = await msp.withdraw(user2Wallet.publicKey, stream, 0.00000025 * LAMPORTS_PER_SOL);
    await sendAndConfirmTransaction(connection, withdrawStreamTx, [user2Wallet], { commitment: 'confirmed' });
    console.log("Withdraw from stream1 success.\n");

    console.log("Allocate funds to stream1");
    const allocateStreamTx = await msp.allocate(user1Wallet.publicKey, user1Wallet.publicKey, treasury, stream, 3 * LAMPORTS_PER_SOL);
    await sendAndConfirmTransaction(connection, allocateStreamTx, [user1Wallet], { commitment: 'confirmed' });
    console.log("Allocate to stream1 success.\n");

    console.log("Pausing stream1");
    const PauseStreamTx = await msp.pauseStream(user1Wallet.publicKey, user1Wallet.publicKey, stream);
    await sendAndConfirmTransaction(connection, PauseStreamTx, [user1Wallet], { commitment: 'confirmed' });
    console.log("Pause stream1 success.\n");

    await sleep(5000);
    console.log("Resume stream1");
    const ResumeStreamTx = await msp.resumeStream(user1Wallet.publicKey, user1Wallet.publicKey, stream);
    await sendAndConfirmTransaction(connection, ResumeStreamTx, [user1Wallet], { commitment: 'confirmed' });
    console.log("Resume stream1 success.\n");


    console.log("Refresh treasury balance");
    const RefreshStreamTx = await msp.refreshTreasuryData(user1Wallet.publicKey, treasury);
    await sendAndConfirmTransaction(connection, RefreshStreamTx, [user1Wallet], { commitment: 'confirmed' });
    console.log("Treasury refresh success.\n");

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
    const filtered_sub_stream_sorted = filtered_cat_stream.sort((a, b) => a.name.localeCompare(b.name));
    expect(filtered_sub_stream_sorted.at(0)!.id).eq(stream.toBase58());
    expect(filtered_sub_stream_sorted.at(1)!.id).eq(stream2.toBase58());

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
      20,
      'confirmed',
      true
    );
    console.log(JSON.stringify(res, null, 2) + '\n');

    console.log("Getting vesting stream activities");
    const res2 = await msp.listStreamActivity(stream, createNonVestingTreasuryTx, 10, 'confirmed', true);
    console.log(JSON.stringify(res2, null, 2) + '\n');

    await sleep(10_000);

    console.log("Getting vesting flow rate");
    const [rate, unit, totalAllocation] = await msp.getVestingFlowRate(treasury);
    console.log(`Streaming ${rate / LAMPORTS_PER_SOL} SOL per ${TimeUnit[unit]}`);
    console.log(`Total Allocation: ${totalAllocation / LAMPORTS_PER_SOL}`);

    console.log("Close stream1");
    const CloseStreamTx = await msp.closeStream(user1Wallet.publicKey, user1Wallet.publicKey, stream, false, true);
    await sendAndConfirmTransaction(connection, CloseStreamTx, [user1Wallet], { commitment: 'confirmed' });
    console.log("Close stream1 success.\n");
  });*/

  it('utils > listTreasuries', async () => {
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

  it('MSP > listStreams', async () => {
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

  it('MSP > listStreams > select stream using filter and get info', async () => {
    const targetStreamAddress = 'Cx14kzEJJqUsXYdKS6BcXGGM4Mtn6m3VbRpr3o1FifdK';
    try {
      console.log("Get list of streams...");
      const accounts = await getFilteredStreamAccounts(
        program,
        userWalletAddress,
        undefined,
        userWalletAddress,
        Category.default,
      );
      console.log("Selecting stream:", targetStreamAddress);
      expect(accounts.length).not.eq(0);

      const item = accounts.find(a => a.publicKey.toString() === targetStreamAddress);
      expect(item).not.be.undefined;
      expect(item.publicKey.toBase58()).equal(targetStreamAddress);
      expect(item.account).not.be.undefined;

      // To hold the value of the withdrawable amount
      let streamWithdrawableAmount = new BN(0);

      if (item) {
        if (item.account !== undefined) {
          const slot = await program.provider.connection.getSlot('finalized');
          const blockTime = (await program.provider.connection.getBlockTime(slot)) as number;
          const stream = item.account;
          const address = item.publicKey;
          const nameBuffer = Buffer.from(stream.name);
          const createdOnUtcInSeconds = stream.createdOnUtc
            ? stream.createdOnUtc.toNumber()
            : 0;
          const startUtcInSeconds = getStreamStartUtcInSeconds(stream);
          const effectiveCreatedOnUtcInSeconds = createdOnUtcInSeconds > 0
            ? createdOnUtcInSeconds
            : startUtcInSeconds;
          const timeDiff = Math.round((Date.now() / 1_000) - blockTime);
          const startUtc = new Date(startUtcInSeconds * 1000);
          const depletionDate = getStreamEstDepletionDate(stream);
          const status = getStreamStatus(stream, timeDiff);
          // const streamMissedEarningUnitsWhilePaused = getStreamMissedEarningUnitsWhilePaused(stream);
          const remainingAllocation = getStreamRemainingAllocation(stream);
          const manuallyPaused = isStreamManuallyPaused(stream);
          const cliffAmount = getStreamCliffAmount(stream);
          const streamUnitsPerSecond = getStreamUnitsPerSecond(stream);

          debugObject = {
            id: address.toBase58(),
            version: stream.version,
            name: new TextDecoder().decode(nameBuffer),
            startUtc: startUtc.toString(),
            secondsSinceStart: blockTime - startUtcInSeconds,
            cliffVestPercent: stream.cliffVestPercent.toNumber() / 10_000,
            cliffVestAmount: cliffAmount.toString(),
            allocationAssigned: stream.allocationAssignedUnits.toString(),
            estimatedDepletionDate: depletionDate.toString(),
            rateAmount: stream.rateAmountUnits.toString(),
            rateIntervalInSeconds: stream.rateIntervalInSeconds.toNumber(),
            totalWithdrawalsAmount: stream.totalWithdrawalsUnits.toString(),
            remainingAllocation: remainingAllocation.toString(),
            status: `${STREAM_STATUS[status]} = ${status}`,
            manuallyPaused: manuallyPaused,
            streamUnitsPerSecond: streamUnitsPerSecond,
          };

          // Continue evaluating if there is remaining allocation
          if (remainingAllocation.gtn(0)) {
            // Continue evaluating if the stream is not scheduled
            if (status !== STREAM_STATUS.Schedule) {

              if (status === STREAM_STATUS.Paused) {  // Check if PAUSED
                const manuallyPaused = isStreamManuallyPaused(stream);
                const withdrawableWhilePausedAmount = manuallyPaused
                  ? stream.lastManualStopWithdrawableUnitsSnap
                  : remainingAllocation;
                streamWithdrawableAmount = BN.max(new BN(0), withdrawableWhilePausedAmount);
              } else if (stream.rateAmountUnits.isZero() ||
                         stream.rateIntervalInSeconds.isZero()) {  // Check if NOT RUNNING
                streamWithdrawableAmount = new BN(0);
              } else {
                const blocktimeRelativeNow = Math.round((Date.now() / 1_000) - timeDiff);
                const startUtcInSeconds = getStreamStartUtcInSeconds(stream);
                const timeSinceStart = blocktimeRelativeNow - startUtcInSeconds;

                const cliffAmount2 = new BigNumber(cliffAmount.toString());
                const unitsSinceStart = new BigNumber(streamUnitsPerSecond * timeSinceStart);
                const nonStopEarningUnits2 = cliffAmount2.plus(unitsSinceStart).toString();

                const nonStopEarningUnits = new BN(nonStopEarningUnits2);
                const totalSecondsPaused = stream.lastKnownTotalSecondsInPausedStatus.toString().length >= 10
                    ? parseInt((stream.lastKnownTotalSecondsInPausedStatus.toNumber() / 1_000).toString())
                    : stream.lastKnownTotalSecondsInPausedStatus.toNumber();
                const missedEarningUnitsWhilePaused = streamUnitsPerSecond * totalSecondsPaused;
                let entitledEarnings = nonStopEarningUnits;

                if (nonStopEarningUnits.gten(missedEarningUnitsWhilePaused)) {
                  entitledEarnings = nonStopEarningUnits.subn(missedEarningUnitsWhilePaused);
                }

                let withdrawableUnitsWhileRunning = entitledEarnings;

                if (entitledEarnings.gte(stream.totalWithdrawalsUnits)) {
                  withdrawableUnitsWhileRunning = entitledEarnings.sub(stream.totalWithdrawalsUnits);
                }

                const withdrawableAmount = BN.min(remainingAllocation, withdrawableUnitsWhileRunning);

                streamWithdrawableAmount = BN.max(new BN(0), withdrawableAmount);

                debugObject.startUtcInSeconds = startUtcInSeconds;
                debugObject.timeSinceStart = timeSinceStart;
                debugObject.nonStopEarningUnits = nonStopEarningUnits.toString();
                debugObject.missedEarningUnitsWhilePaused = missedEarningUnitsWhilePaused.toString();
                debugObject.withdrawableUnitsWhileRunning = withdrawableUnitsWhileRunning.toString();
              }

            }
          }

          debugObject.withdrawableAmount = streamWithdrawableAmount.toString();  // last
          console.table(debugObject);

        }
      }

      console.log("Selecting stream and get info success.");

    } catch (error) {
      console.error(error);
      expect(true).eq(false);
    }
  });

});
