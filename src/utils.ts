import {
  AccountInfo,
  Commitment,
  ConfirmedSignaturesForAddress2Options,
  ConfirmOptions,
  Connection,
  Finality,
  Keypair,
  LAMPORTS_PER_SOL,
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { BN, BorshInstructionCoder, Idl, Program } from '@project-serum/anchor';
/**
 * MSP
 */
import { Constants, LATEST_IDL_FILE_VERSION } from './constants';
import {
  Category,
  MSP_ACTIONS,
  Stream,
  StreamActivity,
  StreamActivityRaw,
  StreamTemplate,
  STREAM_STATUS,
  SubCategory,
  TransactionFees,
  Treasury,
  TreasuryType,
  VestingTreasuryActivity,
  VestingTreasuryActivityAction,
  VestingTreasuryActivityRaw,
} from './types';
import { IDL, Msp } from './msp_idl_004'; // point to the latest IDL
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import {
  AnchorProvider,
  Wallet,
} from '@project-serum/anchor/dist/cjs/provider';
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import { MemcmpFilter } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

String.prototype.toPublicKey = function (): PublicKey {
  return new PublicKey(this.toString());
};

export const createProgram = (
  connection: Connection,
  programId: string,
): Program<Msp> => {
  const opts: ConfirmOptions = {
    preflightCommitment: 'finalized',
    commitment: 'finalized',
  };

  const wallet: Wallet = {
    publicKey: Constants.READONLY_PUBKEY,
    signAllTransactions: async txs => txs,
    signTransaction: async tx => tx,
  };

  const provider = new AnchorProvider(connection, wallet, opts);

  return new Program(IDL, programId, provider);
};

export const getStream = async (
  program: Program<Msp>,
  address: PublicKey,
): Promise<any> => {
  try {
    const streamEventResponse = await program.simulate.getStream(
      LATEST_IDL_FILE_VERSION,
      {
        accounts: {
          stream: address,
        },
      },
    );

    if (
      !streamEventResponse ||
      !streamEventResponse.events ||
      !streamEventResponse.events.length ||
      !streamEventResponse.events[0].data
    ) {
      return null;
    }

    const event: any = streamEventResponse.events[0].data;
    const streamInfo = parseGetStreamData(event, address);
    console.log('getStream result after parse:', streamInfo);

    return streamInfo;
  } catch (error: any) {
    console.log(error);
    return null;
  }
};

export const getStreamRaw = async (
  program: Program<Msp>,
  address: PublicKey,
): Promise<any> => {
  try {
    const streamEventResponse = await program.simulate.getStream(
      LATEST_IDL_FILE_VERSION,
      {
        accounts: {
          stream: address,
        },
      },
    );

    if (
      !streamEventResponse ||
      !streamEventResponse.events ||
      !streamEventResponse.events.length ||
      !streamEventResponse.events[0].data
    ) {
      return null;
    }

    const event: any = streamEventResponse.events[0].data;

    return event;
  } catch (error: any) {
    console.log(error);
    return null;
  }
};

export const getStreamCached = async (
  streamInfo: Stream,
): Promise<Stream> => {

  const timeDiff = new BN(streamInfo.lastRetrievedTimeInSeconds).toNumber() - new BN(streamInfo.lastRetrievedBlockTime).toNumber();
  const blocktime = parseInt((Date.now() / 1_000).toString()) - timeDiff;

  const parsedStream = parseStreamItemData(
    streamInfo.data,
    streamInfo.id,
    blocktime,
  );

  parsedStream.createdBlockTime = streamInfo.createdBlockTime;

  return parsedStream;
};

export const listStreams = async (
  program: Program<Msp>,
  treasurer?: PublicKey | undefined,
  treasury?: PublicKey | undefined,
  beneficiary?: PublicKey | undefined,
  category?: Category,
  subCategory?: SubCategory,
): Promise<Stream[]> => {
  const streamInfoList: Stream[] = [];
  const accounts = await getFilteredStreamAccounts(
    program,
    treasurer,
    treasury,
    beneficiary,
    category,
    subCategory,
  );
  const slot = await program.provider.connection.getSlot('finalized');
  const blockTime = (await program.provider.connection.getBlockTime(slot)) as number;

  for (const item of accounts) {
    if (item.account !== undefined) {
      const parsedStream = parseStreamItemData(
        item.account,
        item.publicKey,
        blockTime,
      );

      streamInfoList.push(parsedStream);
    }
  }

  const orderedStreams = streamInfoList.sort(
    (a, b) => b.createdBlockTime - a.createdBlockTime,
  );

  return orderedStreams;
};

export const listStreamsCached = async (
  streamInfoList: Stream[],
): Promise<Stream[]> => {
  const streamList: Stream[] = [];

  for (const streamInfo of streamInfoList) {
    const timeDiff = new BN(streamInfo.lastRetrievedTimeInSeconds).toNumber() - new BN(streamInfo.lastRetrievedBlockTime).toNumber();
    const blockTime = parseInt((Date.now() / 1_000).toString()) - timeDiff;

    const parsedStream = parseStreamItemData(
      streamInfo.data,
      streamInfo.id,
      blockTime,
    );

    parsedStream.createdBlockTime = streamInfo.createdBlockTime;
    streamList.push(parsedStream);
  }

  return streamList;
};

export const listStreamActivity = async (
  program: Program<Msp>,
  address: PublicKey,
  before = '',
  limit = 10,
  commitment?: Finality | undefined,
): Promise<StreamActivityRaw[] | StreamActivity[]> => {
  let activityRaw: StreamActivityRaw[] = [];
  const finality = commitment !== undefined ? commitment : 'finalized';
  const filter = { limit: limit } as ConfirmedSignaturesForAddress2Options;
  if (before) {
    filter['before'] = before;
  }
  const signatures =
    await program.provider.connection.getConfirmedSignaturesForAddress2(
      address,
      filter,
      finality,
    );
  const txs = await program.provider.connection.getParsedTransactions(
    signatures.map((s: any) => s.signature),
    finality,
  );

  if (txs && txs.length) {
    activityRaw = await parseStreamTransactions(
      address,
      txs as ParsedTransactionWithMeta[],
      program.programId,
    );

    activityRaw.sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0));
  }

  const activity = activityRaw.map(i => {
    return {
      signature: i.signature,
      initializer: i.initializer?.toBase58(),
      action: i.action,
      amount: i.amount ? i.amount.toString() : '',
      mint: i.mint?.toBase58(),
      blockTime: i.blockTime,
      utcDate: i.utcDate,
    } as StreamActivity;
  });

  return activity;
};

export const getTreasury = async (
  program: Program<Msp>,
  address: PublicKey,
): Promise<Treasury> => {
  const treasury = await program.account.treasury.fetch(address);
  const parsedTreasury = parseTreasuryData(treasury, address);

  return parsedTreasury;
};

export const getStreamTemplate = async (
  program: Program<Msp>,
  address: PublicKey,
): Promise<StreamTemplate> => {
  const template = await program.account.streamTemplate.fetch(address);
  return parseStreamTemplateData(template, address);
};

export const findStreamTemplateAddress = async (
  treasury: PublicKey,
  programId: PublicKey,
): Promise<[PublicKey, number]> => {
  return anchor.web3.PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode('template'), treasury.toBuffer()],
    programId,
  );
};

export const listTreasuries = async (
  program: Program<Msp>,
  treasurer?: PublicKey | undefined,
  excludeAutoClose?: boolean,
  category?: Category,
  subCategory?: SubCategory,
): Promise<Treasury[]> => {
  const treasuries: Treasury[] = [];
  const memcmpFilters: any[] = [];

  if (treasurer) {
    memcmpFilters.push({
      memcmp: { offset: 8 + 43, bytes: treasurer.toBase58() },
    });
  }

  if (excludeAutoClose) {
    memcmpFilters.push({
      memcmp: { offset: 216, bytes: bs58.encode([0]) },
    });
  }

  if (category !== undefined) {
    memcmpFilters.push({
      memcmp: { offset: 218, bytes: bs58.encode([category]) },
    });
  }

  if (subCategory !== undefined) {
    memcmpFilters.push({
      memcmp: { offset: 219, bytes: bs58.encode([subCategory]) },
    });
  }

  const accounts = await program.account.treasury.all(memcmpFilters);

  if (accounts.length) {
    for (const item of accounts) {
      if (item.account !== undefined) {
        const parsedTreasury = parseTreasuryData(
          item.account,
          item.publicKey,
        );
        const info = Object.assign({}, parsedTreasury);

        if (
          (treasurer && treasurer.toBase58() === info.treasurer) ||
          !treasurer
        ) {
          treasuries.push(info);
        }
      }
    }
  }

  const sortedTreasuries = treasuries.sort((a, b) => b.slot - a.slot);

  return sortedTreasuries;
};

export const calculateActionFees = async (
  connection: Connection,
  action: MSP_ACTIONS,
): Promise<TransactionFees> => {
  const recentBlockhash = await connection.getRecentBlockhash(
      connection.commitment as Commitment,
    ),
    txFees: TransactionFees = {
      blockchainFee: 0.0,
      mspFlatFee: 0.0,
      mspPercentFee: 0.0,
    };
  let blockchainFee = 0;

  switch (action) {
    case MSP_ACTIONS.createTreasury: {
      blockchainFee = 15000000;
      txFees.mspFlatFee = 0.00001;
      break;
    }
    case MSP_ACTIONS.createStream: {
      blockchainFee = 15000000;
      txFees.mspFlatFee = 0.00001;
      break;
    }
    case MSP_ACTIONS.createStreamWithFunds: {
      blockchainFee = 20000000;
      txFees.mspFlatFee = 0.000035;
      break;
    }
    case MSP_ACTIONS.scheduleOneTimePayment: {
      blockchainFee = 15000000;
      txFees.mspFlatFee = 0.000035;
      break;
    }
    case MSP_ACTIONS.addFunds: {
      txFees.mspFlatFee = 0.000025;
      break;
    }
    case MSP_ACTIONS.withdraw: {
      blockchainFee = 5000000;
      txFees.mspPercentFee = 0.25;
      break;
    }
    case MSP_ACTIONS.closeStream: {
      txFees.mspFlatFee = 0.00001;
      txFees.mspPercentFee = 0.25;
      break;
    }
    case MSP_ACTIONS.closeTreasury: {
      txFees.mspFlatFee = 0.00001;
      break;
    }
    case MSP_ACTIONS.transferStream: {
      blockchainFee = 5000;
      txFees.mspFlatFee = 0.00001;
      break;
    }
    case MSP_ACTIONS.treasuryWithdraw: {
      // txFees.mspFlatFee = 0.00001;
      txFees.mspPercentFee = 0.25;
      break;
    }
    default: {
      break;
    }
  }

  txFees.blockchainFee = blockchainFee / LAMPORTS_PER_SOL;

  return txFees;
};

export const getValidTreasuryAllocation = async (
  connection: Connection,
  treasury: Treasury,
  allocation: string | number,
) => {
  const fees = await calculateActionFees(connection, MSP_ACTIONS.withdraw);
  //
  const BASE_100_TO_BASE_1_MULTIPLIER = 10_000;
  const feeNumerator = fees.mspPercentFee * BASE_100_TO_BASE_1_MULTIPLIER;
  const feeDenaminator = 1_000_000;
  const unallocatedBalance = new BN(treasury.balance).sub(
    new BN(treasury.allocationAssigned),
  );
  const allocationAmountBn = new BN(allocation).add(unallocatedBalance);
  const badStreamAllocationAmount = allocationAmountBn
    .mul(new BN(feeDenaminator))
    .div(new BN(feeNumerator + feeDenaminator));

  const feeAmount = badStreamAllocationAmount
    .mul(new BN(feeNumerator))
    .div(new BN(feeDenaminator));

  if (unallocatedBalance.gte(feeAmount)) {
    return badStreamAllocationAmount;
  }

  const goodStreamMaxAllocation = allocationAmountBn.sub(feeAmount);

  return goodStreamMaxAllocation;
};

export const getFilteredStreamAccounts = async (
  program: Program<Msp>,
  treasurer?: PublicKey | undefined,
  treasury?: PublicKey | undefined,
  beneficiary?: PublicKey | undefined,
  category?: Category,
  subCategory?: SubCategory,
) => {
  const accounts: any[] = [];

  // category filters
  const categoryFilters: MemcmpFilter[] = [];

  if (category !== undefined) {
    categoryFilters.push({
      memcmp: { offset: 339, bytes: bs58.encode([category]) },
    });
  }

  if (subCategory !== undefined) {
    categoryFilters.push({
      memcmp: { offset: 340, bytes: bs58.encode([subCategory]) },
    });
  }

  if (treasury) {
    const memcmpFilters: MemcmpFilter[] = [
      { memcmp: { offset: 8 + 170, bytes: treasury.toBase58() } },
      ...categoryFilters,
    ];
    const accs = await program.account.stream.all(memcmpFilters);

    if (accs.length) {
      accounts.push(...accs);
    }
  } else {
    if (treasurer) {
      const memcmpFilters: MemcmpFilter[] = [
        { memcmp: { offset: 8 + 34, bytes: treasurer.toBase58() } },
        ...categoryFilters,
      ];
      const accs = await program.account.stream.all(memcmpFilters);

      if (accs.length) {
        for (const acc of accs) {
          if (accounts.indexOf(acc) === -1) {
            accounts.push(acc);
          }
        }
      }
    }

    if (beneficiary) {
      const memcmpFilters: MemcmpFilter[] = [
        { memcmp: { offset: 8 + 106, bytes: beneficiary.toBase58() } },
        ...categoryFilters,
      ];
      const accs = await program.account.stream.all(memcmpFilters);

      if (accs.length) {
        for (const acc of accs) {
          if (accounts.indexOf(acc) === -1) {
            accounts.push(acc);
          }
        }
      }
    }
  }

  return accounts;
};

/**
 * Parses the event returned by the get_stream getter in the mps program.
 * @param event
 * @param address stream address
 * @returns Stream
 */
const parseGetStreamData = (
  event: any,
  address: PublicKey,
) => {
  const nameBuffer = Buffer.from(event.name);
  const createdOnUtcInSeconds = event.createdOnUtc
    ? event.createdOnUtc.toNumber()
    : 0;

  const startUtcInSeconds = getStreamStartUtcInSeconds(event);
  const effectiveCreatedOnUtcInSeconds =
    createdOnUtcInSeconds > 0
      ? createdOnUtcInSeconds
      : event.startUtc.toNumber();

  const startUtc = new Date(startUtcInSeconds * 1000);
  const depletionDate = getStreamEstDepletionDate(event);

  const stream = {
    id: address,
    version: event.version,
    initialized: event.initialized,
    name: new TextDecoder().decode(nameBuffer),
    startUtc: startUtc.toString(),
    // startUtc: new Date(startUtcInSeconds * 1000).toString(),
    treasurer: event.treasurerAddress,
    treasury: event.treasuryAddress,
    beneficiary: event.beneficiaryAddress,
    associatedToken: event.beneficiaryAssociatedToken,
    cliffVestAmount: event.cliffVestAmountUnits,
    cliffVestPercent: event.cliffVestPercent.toNumber() / 10_000,
    allocationAssigned: event.allocationAssignedUnits,
    secondsSinceStart: event.currentBlockTime.sub(new BN(event.startUtc)).toNumber(),
    estimatedDepletionDate: depletionDate.toString(),
    rateAmount: event.rateAmountUnits,
    rateIntervalInSeconds: event.rateIntervalInSeconds.toNumber(),
    totalWithdrawalsAmount: event.totalWithdrawalsUnits,
    fundsLeftInStream: event.fundsLeftInStream,
    fundsSentToBeneficiary: event.fundsSentToBeneficiary,
    remainingAllocationAmount: event.beneficiaryRemainingAllocation,
    withdrawableAmount: event.beneficiaryWithdrawableAmount,
    streamUnitsPerSecond: getStreamUnitsPerSecond(event),
    isManuallyPaused: event.isManualPause,
    status: event.status === STREAM_STATUS.Schedule ? 1 : event.status === STREAM_STATUS.Running ? 2 : 3,
    lastRetrievedBlockTime: event.currentBlockTime.toNumber(),
    lastRetrievedTimeInSeconds: parseInt((Date.now() / 1_000).toString()),
    feePayedByTreasurer: event.feePayedByTreasurer,
    createdBlockTime: effectiveCreatedOnUtcInSeconds,
    createdOnUtc: new Date(effectiveCreatedOnUtcInSeconds * 1000).toString(),
    category: event.category as Category,
    subCategory: event.subCategory as SubCategory,
    upgradeRequired: false,
    data: event,
  } as Stream;

  return stream;
};

/**
 * Parses program account items
 * @param stream 
 * @param address 
 * @param blockTime 
 * @returns Stream
 */
export const parseStreamItemData = (
  stream: any,
  address: PublicKey,
  blockTime: number,
) => {
  const nameBuffer = Buffer.from(stream.name);
  const createdOnUtcInSeconds = stream.createdOnUtc
    ? stream.createdOnUtc.toNumber()
    : 0;

  const startUtcInSeconds = getStreamStartUtcInSeconds(stream);
  const effectiveCreatedOnUtcInSeconds = 
    createdOnUtcInSeconds > 0 ? createdOnUtcInSeconds : startUtcInSeconds;

  // Since "now" in the blockchain (expressed by blocktime)
  // is not equal to "now" in the client (expressed by
  // the Date object returned by the browser)
  // Store this client difference for further calculations
  const timeDiff = Math.round((Date.now() / 1_000) - blockTime);

  const startUtc = new Date(startUtcInSeconds * 1000);
  const depletionDate = getStreamEstDepletionDate(stream);
  const streamStatus = getStreamStatus(stream, timeDiff);
  const streamMissedEarningUnitsWhilePaused = getStreamMissedEarningUnitsWhilePaused(stream);
  const streamWithdrawableAmount = getStreamWithdrawableAmount(stream, timeDiff);

  const streamInfo = {
    id: address,
    version: stream.version,
    initialized: stream.initialized,
    name: new TextDecoder().decode(nameBuffer),
    startUtc: startUtc.toString(),
    treasurer: stream.treasurerAddress,
    treasury: stream.treasuryAddress,
    beneficiary: stream.beneficiaryAddress,
    associatedToken: stream.beneficiaryAssociatedToken,
    cliffVestAmount: stream.cliffVestAmountUnits,
    cliffVestPercent: stream.cliffVestPercent.toNumber() / 10_000,
    allocationAssigned: stream.allocationAssignedUnits,
    secondsSinceStart: blockTime - startUtcInSeconds,
    estimatedDepletionDate: depletionDate.toString(),
    rateAmount: stream.rateAmountUnits,
    rateIntervalInSeconds: stream.rateIntervalInSeconds.toNumber(),
    totalWithdrawalsAmount: stream.totalWithdrawalsUnits,
    fundsLeftInStream: getFundsLeftInStream(stream, timeDiff),
    fundsSentToBeneficiary: getFundsSentToBeneficiary(stream, timeDiff),
    remainingAllocationAmount: getStreamRemainingAllocation(stream),
    withdrawableAmount: streamWithdrawableAmount,
    streamUnitsPerSecond: getStreamUnitsPerSecond(stream),
    isManuallyPaused: isStreamManuallyPaused(stream),
    status: streamStatus,
    lastRetrievedBlockTime: blockTime,
    lastRetrievedTimeInSeconds: parseInt((Date.now() / 1_000).toString()),
    totalWithdrawals: stream.totalWithdrawalsUnits,
    feePayedByTreasurer: stream.feePayedByTreasurer,
    category: stream.category as Category,
    subCategory: stream.subCategory as SubCategory,
    transactionSignature: '',
    createdBlockTime: createdOnUtcInSeconds > 0 ? createdOnUtcInSeconds : startUtcInSeconds,
    createdOnUtc: new Date(effectiveCreatedOnUtcInSeconds * 1000).toString(),
    upgradeRequired: false,
    data: {
      version: stream.version,
      initialized: stream.initialized,
      name: stream.name,
      startUtc: stream.startUtc,
      treasurerAddress: stream.treasurerAddress,
      rateAmountUnits: stream.rateAmountUnits,
      rateIntervalInSeconds: stream.rateIntervalInSeconds,
      cliffVestAmountUnits: stream.cliffVestAmountUnits,
      cliffVestPercent: stream.cliffVestPercent,
      beneficiaryAddress: stream.beneficiaryAddress,
      beneficiaryAssociatedToken: stream.beneficiaryAssociatedToken,
      treasuryAddress: stream.treasuryAddress,
      allocationAssignedUnits: stream.allocationAssignedUnits,
      allocationReservedUnits: stream.allocationReservedUnits,
      totalWithdrawalsUnits: stream.totalWithdrawalsUnits,
      lastWithdrawalUnits: stream.lastWithdrawalUnits,
      lastWithdrawalSlot: stream.lastWithdrawalSlot,
      lastWithdrawalBlockTime: stream.lastWithdrawalBlockTime,
      lastManualStopWithdrawableUnitsSnap:
        stream.lastManualStopWithdrawableUnitsSnap,
      lastManualStopSlot: stream.lastManualStopSlot,
      lastManualStopBlockTime: stream.lastManualStopBlockTime,
      lastManualResumeRemainingAllocationUnitsSnap:
        stream.lastManualResumeRemainingAllocationUnitsSnap,
      lastManualResumeSlot: stream.lastManualResumeSlot,
      lastManualResumeBlockTime: stream.lastManualResumeBlockTime,
      lastKnownTotalSecondsInPausedStatus:
        stream.lastKnownTotalSecondsInPausedStatus,
      lastAutoStopBlockTime: stream.lastAutoStopBlockTime,
      feePayedByTreasurer: stream.feePayedByTreasurer,
      // calculated data
      status: streamStatus,
      statusText: streamStatus === STREAM_STATUS.Schedule
        ? 'Scheduled'
        : streamStatus === STREAM_STATUS.Running
          ? 'Running'
          : 'Paused',
      isManualPause: isStreamManuallyPaused(stream),
      cliffUnits: new BN(getStreamCliffAmount(stream)),
      currentBlockTime: new BN(blockTime),
      secondsSinceStart: new BN(blockTime).sub(
        new BN(getStreamStartUtcInSeconds(stream)),
      ),
      estDepletionTime: new BN(
        parseInt(
          (getStreamEstDepletionDate(stream).getTime() / 1_000).toString(),
        ),
      ),
      fundsLeftInStream: getFundsLeftInStream(stream, timeDiff),
      fundsSentToBeneficiary: getFundsSentToBeneficiary(stream, timeDiff),
      withdrawableUnitsWhilePaused: new BN(
        getStreamWithdrawableUnitsWhilePaused(stream),
      ),

      nonStopEarningUnits: new BN(
        getStreamNonStopEarningUnits(stream, timeDiff),
      ),

      missedUnitsWhilePaused: new BN(streamMissedEarningUnitsWhilePaused),

      entitledEarningsUnits: BN.max(new BN(0), getStreamNonStopEarningUnits(stream, timeDiff).sub(streamMissedEarningUnitsWhilePaused)),

      // TODO: OJO with this one
      withdrawableUnitsWhileRunning: BN.max(
          getStreamNonStopEarningUnits(stream, timeDiff).sub(streamMissedEarningUnitsWhilePaused),
          stream.totalWithdrawalsUnits
      ),

      beneficiaryRemainingAllocation: new BN(
        getStreamRemainingAllocation(stream),
      ),
      beneficiaryWithdrawableAmount: streamWithdrawableAmount,
      lastKnownStopBlockTime: new BN(
        Math.max(
          stream.lastAutoStopBlockTime.toNumber(),
          stream.lastManualStopBlockTime.toNumber(),
        ),
      ),
    },
  } as Stream;

  return streamInfo;
};

let idl_legacy_after_1645224519: any = null;
let idl_legacy_before_1645224519: any = null;
const idlPaths: string[] = ['./msp_idl_001', './msp_idl_002', './msp_idl_003'];

const idls: { [fileVersion: number]: any } = {};

async function parseStreamInstructionAfter1645224519(
  ix: PartiallyDecodedInstruction,
  streamAddress: PublicKey,
  transactionSignature: string,
  transactionBlockTimeInSeconds: number,
  programId: PublicKey,
): Promise<StreamActivityRaw | null> {
  if (!ix.programId.equals(programId)) {
    return null;
  }

  try {
    if (!idl_legacy_after_1645224519) {
      const importedIdl = await import('./msp_idl_legacy_after_1645224519');
      idl_legacy_after_1645224519 = importedIdl.IDL;
    }

    const coder = new BorshInstructionCoder(idl_legacy_after_1645224519 as Idl);

    const decodedIx = coder.decode(ix.data, 'base58');
    if (!decodedIx) return null;

    const ixName = decodedIx.name;
    // console.log(`ixName: ${ixName}`);
    if (['createStream', 'allocate', 'withdraw'].indexOf(ixName) === -1)
      return null;

    const ixAccountMetas = ix.accounts.map(pk => {
      return { pubkey: pk, isSigner: false, isWritable: false };
    });

    const formattedIx = coder.format(decodedIx, ixAccountMetas);
    // console.log(formattedIx);
    // console.table(formattedIx?.accounts.map(a => { return { name: a.name, pk: a.pubkey.toBase58() } }));

    const stream = formattedIx?.accounts.find(a => a.name === 'Stream')?.pubkey;
    if (!stream || !stream.equals(streamAddress)) {
      return null;
    }

    const blockTime = (transactionBlockTimeInSeconds as number) * 1000; // mult by 1000 to add milliseconds
    const action =
      decodedIx.name === 'createStream' || decodedIx.name === 'allocate'
        ? 'deposited'
        : 'withdrew';

    let initializer: PublicKey | undefined;
    let mint: PublicKey | undefined;
    let amountBN: BN | undefined;

    if (decodedIx.name === 'createStream') {
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'allocationAssignedUnits',
      )?.data;
      amountBN = parsedAmount ? new BN(parsedAmount) : undefined;
    } else if (decodedIx.name === 'allocate') {
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'amount',
      )?.data;
      amountBN = parsedAmount ? new BN(parsedAmount) : undefined;
    } else if (decodedIx.name === 'withdraw') {
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Beneficiary',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'amount',
      )?.data;
      amountBN = parsedAmount ? new BN(parsedAmount) : undefined;
    }

    const activity: StreamActivityRaw = {
      signature: transactionSignature,
      initializer: initializer,
      blockTime,
      utcDate: new Date(blockTime).toUTCString(),
      action,
      // TODO: Here the 'amount' might not be accurate, we need to emit events instead
      amount: amountBN,
      mint,
    };

    return activity;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function parseStreamInstructionBefore1645224519(
  ix: PartiallyDecodedInstruction,
  streamAddress: PublicKey,
  transactionSignature: string,
  transactionBlockTimeInSeconds: number,
  programId: PublicKey,
): Promise<StreamActivityRaw | null> {
  if (!ix.programId.equals(programId)) {
    return null;
  }

  try {
    if (!idl_legacy_before_1645224519) {
      idl_legacy_before_1645224519 = await import(
        './msp_idl_legacy_before_1645224519'
      );
    }

    const coder = new BorshInstructionCoder(
      idl_legacy_before_1645224519 as Idl,
    );

    const decodedIx = coder.decode(ix.data, 'base58');
    if (!decodedIx) return null;

    const ixName = decodedIx.name;
    // console.log(`ixName: ${ixName}`);
    if (['createStream', 'addFunds', 'withdraw'].indexOf(ixName) === -1)
      return null;

    const ixAccountMetas = ix.accounts.map(pk => {
      return { pubkey: pk, isSigner: false, isWritable: false };
    });

    const formattedIx = coder.format(decodedIx, ixAccountMetas);
    // console.log(formattedIx);
    // console.table(formattedIx?.accounts.map(a => { return { name: a.name, pk: a.pubkey.toBase58() } }));

    const stream = formattedIx?.accounts.find(a => a.name === 'Stream')?.pubkey;
    if (!stream || !stream.equals(streamAddress)) {
      return null;
    }

    const blockTime = (transactionBlockTimeInSeconds as number) * 1000; // mult by 1000 to add milliseconds
    const action =
      decodedIx.name === 'createStream' || decodedIx.name === 'addFunds'
        ? 'deposited'
        : 'withdrew';

    let initializer: PublicKey | undefined;
    let mint: PublicKey | undefined;
    let amountBN: BN | undefined;

    if (decodedIx.name === 'createStream') {
      if (ixAccountMetas.length !== 14) {
        // console.log(`this createStream instruction corresponds to an IDL that is not supported`);
        return null;
      }
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'allocationAssignedUnits',
      )?.data;
      amountBN = parsedAmount ? new BN(parsedAmount) : undefined;
    } else if (decodedIx.name === 'addFunds') {
      if (ixAccountMetas.length !== 14) {
        // console.log(`this addFunds instruction corresponds to an IDL that is not supported`);
        return null;
      }
      const allocationType = formattedIx?.args.find(
        a => a.name === 'allocationType',
      )?.data;
      if (allocationType !== '1') {
        return null;
      }

      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'amount',
      )?.data;
      amountBN = parsedAmount ? new BN(parsedAmount) : undefined;
    } else if (decodedIx.name === 'withdraw') {
      if (ixAccountMetas.length !== 13) {
        // console.log(`this withdraw instruction corresponds to an IDL that is not supported`);
        return null;
      }
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Beneficiary',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'amount',
      )?.data;
      amountBN = parsedAmount ? new BN(parsedAmount) : undefined;
    }

    const activity: StreamActivityRaw = {
      signature: transactionSignature,
      initializer: initializer,
      blockTime,
      utcDate: new Date(blockTime).toUTCString(),
      action,
      // TODO: Here the 'amount' might not be accurate, we need to emit events instead
      amount: amountBN,
      mint,
    };

    return activity;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function parseVersionedStreamInstruction(
  ix: PartiallyDecodedInstruction,
  streamAddress: PublicKey,
  transactionSignature: string,
  transactionBlockTimeInSeconds: number,
  idlFileVersion: number,
  programId: PublicKey,
): Promise<StreamActivityRaw | null> {
  if (!ix.programId.equals(programId)) {
    return null;
  }

  if (idlFileVersion <= 0 || idlFileVersion > LATEST_IDL_FILE_VERSION) {
    return null;
  }

  try {
    if (!idls[idlFileVersion]) {
      if (idlFileVersion === 1) {
        // TODO: to avoid this if else, find a way to do dynamic imports passign concatenated paths
        const importedIdl = await import('./msp_idl_001');
        idls[idlFileVersion] = importedIdl.IDL;
      } else if (idlFileVersion === 2) {
        const importedIdl = await import('./msp_idl_002');
        idls[idlFileVersion] = importedIdl.IDL;
      } else if (idlFileVersion === 3) {
        const importedIdl = await import('./msp_idl_003');
        idls[idlFileVersion] = importedIdl.IDL;
      } else if (idlFileVersion === 4) {
        const importedIdl = await import('./msp_idl_004');
        idls[idlFileVersion] = importedIdl.IDL;
      } else {
        return null;
      }
    }

    const coder = new BorshInstructionCoder(idls[idlFileVersion] as Idl);

    const decodedIx = coder.decode(ix.data, 'base58');
    if (!decodedIx) return null;

    const ixName = decodedIx.name;
    // console.log(`ixName: ${ixName}`);
    if (
      [
        'createStream',
        'createStreamWithTemplate',
        'allocate',
        'withdraw',
      ].indexOf(ixName) === -1
    )
      return null;

    const ixAccountMetas = ix.accounts.map(pk => {
      return { pubkey: pk, isSigner: false, isWritable: false };
    });

    const formattedIx = coder.format(decodedIx, ixAccountMetas);
    // console.log(formattedIx);
    // console.table(formattedIx?.accounts.map(a => { return { name: a.name, pk: a.pubkey.toBase58() } }));

    const stream = formattedIx?.accounts.find(a => a.name === 'Stream')?.pubkey;
    if (!stream || !stream.equals(streamAddress)) {
      return null;
    }

    const blockTime = (transactionBlockTimeInSeconds as number) * 1000; // mult by 1000 to add milliseconds
    const action =
      decodedIx.name === 'createStream' ||
      decodedIx.name === 'createStreamWithTemplate' ||
      decodedIx.name === 'allocate'
        ? 'deposited'
        : 'withdrew';

    let initializer: PublicKey | undefined;
    let mint: PublicKey | undefined;
    let amountBN: BN | undefined;

    if (
      decodedIx.name === 'createStream' ||
      decodedIx.name === 'createStreamWithTemplate'
    ) {
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'allocationAssignedUnits',
      )?.data;
      amountBN = parsedAmount ? new BN(parsedAmount) : undefined;
    } else if (decodedIx.name === 'allocate') {
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'amount',
      )?.data;
      amountBN = parsedAmount ? new BN(parsedAmount) : undefined;
    } else if (decodedIx.name === 'withdraw') {
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Beneficiary',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'amount',
      )?.data;
      amountBN = parsedAmount ? new BN(parsedAmount) : undefined;
    }

    const activity: StreamActivityRaw = {
      signature: transactionSignature,
      initializer: initializer,
      blockTime,
      utcDate: new Date(blockTime).toUTCString(),
      action,
      // TODO: Here the 'amount' might not be accurate, we need to emit events instead
      amount: amountBN,
      mint,
    };

    return activity;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function parseStreamTransactions(
  streamAddress: PublicKey,
  transactions: ParsedTransactionWithMeta[],
  programId: PublicKey,
): Promise<StreamActivityRaw[]> {
  const parsedActivities: StreamActivityRaw[] = [];
  if (!transactions || transactions.length === 0) return [];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const signature = tx.transaction.signatures[0];
    for (let j = 0; j < tx.transaction.message.instructions.length; j++) {
      const ix = tx.transaction.message.instructions[
        j
      ] as PartiallyDecodedInstruction;
      if (!ix || !ix.data) continue;

      const decodedIxData = bs58.decode(ix.data);
      const ixIdlFileVersion =
        decodedIxData.length >= 9 ? decodedIxData.slice(8, 9)[0] : 0;
      let activity: StreamActivityRaw | null = null;
      if (ixIdlFileVersion > 0 && ixIdlFileVersion <= LATEST_IDL_FILE_VERSION) {
        // TODO: hardcoded
        activity = await parseVersionedStreamInstruction(
          ix,
          streamAddress,
          signature,
          tx.blockTime ?? 0,
          ixIdlFileVersion,
          programId,
        );
      } else if (!tx.blockTime || tx.blockTime >= 1645224519) {
        activity = await parseStreamInstructionAfter1645224519(
          ix,
          streamAddress,
          signature,
          tx.blockTime ?? 0,
          programId,
        );
      } else {
        activity = await parseStreamInstructionBefore1645224519(
          ix,
          streamAddress,
          signature,
          tx.blockTime ?? 0,
          programId,
        );
      }

      if (!activity) {
        continue;
      }
      parsedActivities.push(activity);
    }
  }

  return parsedActivities;
}

export const parseTreasuryData = (
  treasury: any,
  address: PublicKey,
) => {

  const nameBuffer = Buffer.from(treasury.name);

  const treasuryAssocatedTokenMint = !(treasury.associatedTokenAddress as PublicKey).equals(PublicKey.default)
    ? treasury.associatedTokenAddress.toBase58()
    : '';

  if (!treasuryAssocatedTokenMint) {
    console.warn('Invalid treasuryAssocatedTokenMint for account:', address.toBase58());
  }

  const treasuryCreatedUtc =
    treasury.createdOnUtc.toString().length > 10
      ? parseInt(treasury.createdOnUtc.toString().substring(0, 10))
      : treasury.createdOnUtc.toNumber();

  return {
    id: address.toBase58(),
    version: treasury.version,
    initialized: treasury.initialized,
    name: new TextDecoder().decode(nameBuffer),
    bump: treasury.bump,
    slot: treasury.slot.toNumber(),
    labels: treasury.labels,
    mint: treasury.mintAddress.toBase58(),
    autoClose: treasury.autoClose,
    createdOnUtc: new Date(treasuryCreatedUtc * 1_000).toString(),
    treasuryType: treasury.treasuryType === 0 ? TreasuryType.Open : TreasuryType.Lock,
    treasurer: treasury.treasurerAddress.toBase58(),
    associatedToken: treasuryAssocatedTokenMint,
    balance: treasury.lastKnownBalanceUnits,
    allocationReserved: treasury.allocationReservedUnits,
    allocationAssigned: treasury.allocationAssignedUnits,
    totalWithdrawals: treasury.totalWithdrawalsUnits,
    totalStreams: treasury.totalStreams.toNumber(),
    category: treasury.category as Category,
    subCategory: treasury.subCategory as SubCategory,
    data: treasury,
  } as Treasury;
};

export const parseStreamTemplateData = (
  template: any,
  address: PublicKey,
) => {
  return {
    id: address,
    version: template.version,
    bump: template.bump,
    durationNumberOfUnits: template.durationNumberOfUnits.toNumber(),
    rateIntervalInSeconds: template.rateIntervalInSeconds.toNumber(),
    startUtc: new Date(template.startUtcInSeconds * 1000).toString(),
    cliffVestPercent: template.cliffVestPercent.toNumber(),
    feePayedByTreasurer: template.feePayedByTreasurer,
  } as StreamTemplate;
};

export const getStreamEstDepletionDate = (stream: any) => {
  const interval = stream.rateIntervalInSeconds as BN;
  if (interval.isZero()) {
    return new Date();
  }

  const cliffAmount = getStreamCliffAmount(stream);
  const allocationAssignedUnits = new BigNumber(stream.allocationAssignedUnits.toString());
  const allocationMinusCliff = allocationAssignedUnits.minus(new BigNumber(cliffAmount.toString()))
  const streamableAmount = BigNumber.max(0, allocationMinusCliff);

  const rateInterval = new BigNumber(interval.toString());
  const rateAmountUnits = new BigNumber(stream.rateAmountUnits.toString());
  const rateAmount = rateAmountUnits.dividedBy(rateInterval);

  const streamableSeconds = streamableAmount.dividedToIntegerBy(rateAmount);
  const duration = streamableSeconds.plus(stream.lastKnownTotalSecondsInPausedStatus);
  const startUtcInSeconds = getStreamStartUtcInSeconds(stream);

  const depletionTimestamp = (startUtcInSeconds + duration.toNumber()) * 1_000;
  const depletionDate = new Date(depletionTimestamp);
  if (depletionDate.toString() !== 'Invalid Date') {
    return depletionDate;
  }
  return new Date();
};

export const getStreamCliffAmount = (stream: any) => {
  let cliffAmount = new BN(stream.cliffVestAmountUnits);

  if (stream.cliffVestPercent.gtn(0)) {
    // cliffAmount = (stream.cliffVestPercent.toNumber() * stream.allocationAssignedUnits.toNumber()) / Constants.CLIFF_PERCENT_DENOMINATOR;
    const cliffVestPercent = new BigNumber(stream.cliffVestPercent.toString());
    const allocationAssignedUnits = new BigNumber(stream.allocationAssignedUnits.toString());
    const result = cliffVestPercent.multipliedBy(allocationAssignedUnits).dividedBy(Constants.CLIFF_PERCENT_DENOMINATOR);
    cliffAmount = new BN(result.toString());
  }

  return cliffAmount;
};

export const getFundsLeftInStream = (stream: any, timeDiff = 0) => {
  // const fundsLeft = stream.allocationAssignedUnits.toNumber() - stream.totalWithdrawalsUnits.toNumber() - withdrawableAmount;

  const withdrawableAmount = getStreamWithdrawableAmount(stream, timeDiff);
  const remainingAllocation = getStreamRemainingAllocation(stream);
  const fundsLeft = remainingAllocation.sub(withdrawableAmount);

  return BN.max(new BN(0), fundsLeft);
};

export const getFundsSentToBeneficiary = (stream: any, timeDiff = 0) => {
  const withdrawableAmount = getStreamWithdrawableAmount(stream, timeDiff);
  const fundsSent = stream.totalWithdrawalsUnits.add(withdrawableAmount);
  return fundsSent as BN;
};

export const getStreamRemainingAllocation = (stream: any) => {
  // const remainingAlloc = stream.allocationAssignedUnits.toNumber() - stream.totalWithdrawalsUnits.toNumber();

  const remainingAlloc = stream.allocationAssignedUnits.sub(stream.totalWithdrawalsUnits);
  return BN.max(new BN(0), remainingAlloc);
};

export const getStreamWithdrawableAmount = (stream: any, timeDiff = 0) => {
  const remainingAllocation = getStreamRemainingAllocation(stream);

  if (remainingAllocation.isZero()) {
    return new BN(0);
  }

  const status = getStreamStatus(stream, timeDiff);

  // Check if SCHEDULED
  if (status === STREAM_STATUS.Schedule) {
    return new BN(0);
  }

  // Check if PAUSED
  if (status === STREAM_STATUS.Paused) {
    const manuallyPaused = isStreamManuallyPaused(stream);
    const withdrawableWhilePausedAmount = manuallyPaused
      ? stream.lastManualStopWithdrawableUnitsSnap
      : remainingAllocation;

    return BN.max(new BN(0), withdrawableWhilePausedAmount);
  }

  // Check if NOT RUNNING
  if (stream.rateAmountUnits.isZero() || stream.rateIntervalInSeconds.isZero()) {
    return new BN(0);
  }

  const streamedUnitsPerSecond = getStreamUnitsPerSecond(stream);
  const cliffUnits = new BigNumber(getStreamCliffAmount(stream).toString());
  // Get the blockchain kind of "now" given the client timeDiff
  const blocktimeRelativeNow = Math.round((Date.now() / 1_000) - timeDiff);
  const startUtcInSeconds = getStreamStartUtcInSeconds(stream);
  const secondsSinceStart = blocktimeRelativeNow - startUtcInSeconds;
  const nonStopEarningUnits = cliffUnits.plus(streamedUnitsPerSecond * secondsSinceStart);
  const totalSecondsPaused = stream.lastKnownTotalSecondsInPausedStatus.toString().length >= 10
      ? parseInt((stream.lastKnownTotalSecondsInPausedStatus.toNumber() / 1_000).toString())
      : stream.lastKnownTotalSecondsInPausedStatus.toNumber();

  const missedEarningUnitsWhilePaused = streamedUnitsPerSecond * totalSecondsPaused;
  let entitledEarnings = nonStopEarningUnits;

  if (nonStopEarningUnits.gte(missedEarningUnitsWhilePaused)) {
    entitledEarnings = nonStopEarningUnits.plus(missedEarningUnitsWhilePaused);
  }

  let withdrawableUnitsWhileRunning = entitledEarnings;

  if (entitledEarnings.gte(stream.totalWithdrawalsUnits)) {
    withdrawableUnitsWhileRunning = entitledEarnings.minus(stream.totalWithdrawalsUnits);
  }

  const withdrawableAmount = BigNumber.min(new BigNumber(remainingAllocation.toString()), new BigNumber(withdrawableUnitsWhileRunning.toString())).integerValue();

  return BN.max(new BN(0), new BN(withdrawableAmount.toString()));
};

export const getStreamStatus = (stream: any, timeDiff: number) => {
  // Get the blockchain kind of "now" given the client timeDiff
  const blocktimeRelativeNow = (Date.now() / 1_000) - timeDiff;
  const startUtcInSeconds = getStreamStartUtcInSeconds(stream);

  // Scheduled
  if (startUtcInSeconds > blocktimeRelativeNow) {
    return STREAM_STATUS.Schedule;
  }

  // Manually paused
  const manuallyPaused = isStreamManuallyPaused(stream);

  if (manuallyPaused) {
    return STREAM_STATUS.Paused;
  }

  const totalSecondsPaused = stream.lastKnownTotalSecondsInPausedStatus.toString().length >= 10
    ? parseInt((stream.lastKnownTotalSecondsInPausedStatus.toNumber() / 1_000).toString())
    : stream.lastKnownTotalSecondsInPausedStatus.toNumber();
  const cliffUnits = new BigNumber(getStreamCliffAmount(stream).toString());
  const secondsSinceStart = blocktimeRelativeNow - startUtcInSeconds;
  const streamedUnitsPerSecond = getStreamUnitsPerSecond(stream);
  const nonStopEarningUnits = cliffUnits.plus(streamedUnitsPerSecond * secondsSinceStart);
  const missedEarningUnitsWhilePaused = streamedUnitsPerSecond * totalSecondsPaused;
  let entitledEarnings = nonStopEarningUnits;

  if (nonStopEarningUnits.gte(missedEarningUnitsWhilePaused)) {
    entitledEarnings = nonStopEarningUnits.minus(missedEarningUnitsWhilePaused);
  }

  const allocation = new BigNumber(stream.allocationAssignedUnits.toString());
  // Running
  if (allocation.gt(entitledEarnings)) {
    return STREAM_STATUS.Running;
  }

  // Automatically paused (ran out of funds)
  return STREAM_STATUS.Paused;
};

export const isStreamManuallyPaused = (stream: any) => {
  if (stream.lastManualStopBlockTime.gtn(0)) {
    return stream.lastManualStopBlockTime.gt(stream.lastManualResumeBlockTime) ? true : false;
  }

  return false;
};

export const getStreamUnitsPerSecond = (stream: any) => {

  const interval = stream.rateIntervalInSeconds.toNumber();
  if (interval === 0) {
    return 0;
  }

  const rateAmountUnits = new BigNumber(stream.rateAmountUnits.toString());
  const streamUnitsPerSecond = rateAmountUnits.dividedBy(interval);

  return streamUnitsPerSecond.toNumber();
};

export const getStreamStartUtcInSeconds = (stream: any): number => {
  if (stream.startUtcInSeconds > 0) {
    return stream.startUtcInSeconds.toNumber();
  }
  if (stream.startUtc.toString().length > 10) {
    return parseInt(stream.startUtc.toString().substr(0, 10));
  }
  return stream.startUtc.toNumber();
};

export const getStreamWithdrawableUnitsWhilePaused = (stream: any) => {
  let withdrawableWhilePaused = new BN(0);
  const isManuallyPaused = isStreamManuallyPaused(stream);

  if (isManuallyPaused) {
    withdrawableWhilePaused = stream.lastManualStopWithdrawableUnitsSnap;
  } else {
    withdrawableWhilePaused = stream.allocationAssignedUnits.sub(stream.totalWithdrawalsUnits);
  }

  return BN.max(new BN(0), withdrawableWhilePaused);
};

export const getStreamNonStopEarningUnits = (stream: any, timeDiff: number) => {
  const cliffUnits = getStreamCliffAmount(stream);
  const blocktimeRelativeNow = Math.round((Date.now() / 1_000) - timeDiff);
  const startUtcInSeconds = getStreamStartUtcInSeconds(stream);

  const secondsSinceStart = Math.max(
    0,
    blocktimeRelativeNow - startUtcInSeconds,
  );

  if (stream.rateAmountUnits.gtn(0)) {
    const streamUnitsSinceStarted = (stream.rateIntervalInSeconds as BN).muln(secondsSinceStart).div(stream.rateAmountUnits);
    const nonStopEarningUnits = cliffUnits.add(streamUnitsSinceStarted);
    return nonStopEarningUnits;
  }

  return BN.max(new BN(0), cliffUnits);
};

export const getStreamMissedEarningUnitsWhilePaused = (stream: any) => {
  if (stream.rateIntervalInSeconds.isZero()) {
    return new BN(0);
  }

  const totalSecondsPaused =
    stream.lastKnownTotalSecondsInPausedStatus.toString().length > 10
      ? parseInt(stream.startUtc.toString().substring(0, 10))
      : stream.lastKnownTotalSecondsInPausedStatus.toNumber();

  if (stream.rateAmountUnits.gtn(0)) {
    const withdrawableWhilePaused = totalSecondsPaused
      ? new BN(stream.rateIntervalInSeconds.toNumber() * totalSecondsPaused).div(stream.rateAmountUnits) as BN
      : new BN(0);
    return withdrawableWhilePaused;
  }

  return new BN(0);
};

export async function fundExistingWSolAccountInstructions(
  connection: Connection,
  owner: PublicKey,
  ownerWSolTokenAccount: PublicKey,
  payer: PublicKey,
  amountToWrapInLamports: number,
): Promise<[TransactionInstruction[], Keypair]> {
  // Allocate memory for the account
  const minimumAccountBalance = await Token.getMinBalanceRentForExemptAccount(
    connection,
  );
  const newWrapAccount = Keypair.generate();

  const wrapIxs: Array<TransactionInstruction> = [
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: newWrapAccount.publicKey,
      lamports: minimumAccountBalance + amountToWrapInLamports,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      NATIVE_MINT,
      newWrapAccount.publicKey,
      owner,
    ),
    Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      newWrapAccount.publicKey,
      ownerWSolTokenAccount,
      owner,
      [],
      amountToWrapInLamports,
    ),
    Token.createCloseAccountInstruction(
      TOKEN_PROGRAM_ID,
      newWrapAccount.publicKey,
      payer,
      owner,
      [],
    ),
  ];

  return [wrapIxs, newWrapAccount];
}

export async function createAtaCreateInstructionIfNotExists(
  ataAddress: PublicKey,
  mintAddress: PublicKey,
  ownerAccountAddress: PublicKey,
  payerAddress: PublicKey,
  connection: Connection,
): Promise<TransactionInstruction | null> {
  try {
    const ata = await connection.getAccountInfo(ataAddress);
    if (!ata) {
      // console.log("ATA: %s for mint: %s was not found. Generating 'create' instruction...", ataAddress.toBase58(), mintAddress.toBase58());
      const [, createIx] = await createAtaCreateInstruction(
        ataAddress,
        mintAddress,
        ownerAccountAddress,
        payerAddress,
      );
      return createIx;
    }

    // console.log("ATA: %s for mint: %s already exists", ataAddress.toBase58(), mintAddress.toBase58());
    return null;
  } catch (err) {
    console.log('Unable to find associated account: %s', err);
    throw Error('Unable to find associated account');
  }
}

export async function createAtaCreateInstruction(
  ataAddress: PublicKey,
  mintAddress: PublicKey,
  ownerAccountAddress: PublicKey,
  payerAddress: PublicKey,
): Promise<[PublicKey, TransactionInstruction]> {
  if (ataAddress === null) {
    ataAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintAddress,
      ownerAccountAddress,
    );
  }

  const ataCreateInstruction = Token.createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mintAddress,
    ataAddress,
    ownerAccountAddress,
    payerAddress,
  );
  return [ataAddress, ataCreateInstruction];
}

export async function createWrapSolInstructions(
  connection: Connection,
  wSolAmountInLamports: number | BN | string,
  owner: PublicKey,
  ownerWSolTokenAccount: PublicKey,
  ownerWSolTokenAccountInfo: AccountInfo<Buffer> | null,
): Promise<[TransactionInstruction[], Keypair[]]> {
  const ixs: TransactionInstruction[] = [];
  const signers: Keypair[] = [];
  const wSolAmountInLamportsBn = new BN(wSolAmountInLamports);
  let ownerWSolAtaBalanceBn = new BN(0);

  if (ownerWSolTokenAccountInfo) {
    const ownerWSolAtaTokenAmount = (
      await connection.getTokenAccountBalance(ownerWSolTokenAccount)
    ).value;
    ownerWSolAtaBalanceBn = new BN(ownerWSolAtaTokenAmount.amount);
  } else {
    const ownerFromAtaCreateInstruction =
      await createAtaCreateInstructionIfNotExists(
        ownerWSolTokenAccount,
        NATIVE_MINT,
        owner,
        owner,
        connection,
      );
    if (ownerFromAtaCreateInstruction) ixs.push(ownerFromAtaCreateInstruction);
  }
  if (wSolAmountInLamportsBn.gt(ownerWSolAtaBalanceBn)) {
    const amountToWrapBn = wSolAmountInLamportsBn.sub(ownerWSolAtaBalanceBn);
    const [wrapIxs, newWrapAccount] = await fundExistingWSolAccountInstructions(
      connection,
      owner,
      ownerWSolTokenAccount,
      owner,
      amountToWrapBn.toNumber(),
    );
    ixs.push(...wrapIxs);
    signers.push(newWrapAccount);
  }

  return [ixs, signers];
}

// export async function createWrappedSolTokenAccountInstructions(
//   connection: Connection,
//   amountToWrapInLamports: number,
//   owner: PublicKey,
//   ownerWSolTokenAccount: PublicKey,
// ): Promise<[TransactionInstruction[], Keypair]> {

//   // REF: https://github.com/solana-labs/solana-program-library/blob/3eccf25ece1c373a117fc9f6e6cbeb2216d86f03/token/ts/src/instructions/syncNative.ts#L28
//   const wrapIxs = [
//     Token.createAssociatedTokenAccountInstruction(
//         payer.publicKey,
//         associatedToken,
//         owner,
//         NATIVE_MINT,
//         programId,
//         ASSOCIATED_TOKEN_PROGRAM_ID
//     ),
//     SystemProgram.transfer({
//         fromPubkey: payer.publicKey,
//         toPubkey: associatedToken,
//         lamports: amount,
//     }),
//     createSyncNativeInstruction(associatedToken, programId)
//   ];

//   return [wrapIxs, newWSolAccount];
// }

export function sleep(ms: number) {
  console.log('Sleeping for', ms / 1000, 'seconds');
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const listVestingTreasuryActivity = async (
  program: Program<Msp>,
  address: PublicKey,
  before = '',
  limit = 10,
  commitment?: Finality | undefined,
): Promise<VestingTreasuryActivityRaw[] | VestingTreasuryActivity[]> => {
  let activityRaw: VestingTreasuryActivityRaw[] = [];
  const finality = commitment !== undefined ? commitment : 'finalized';
  const filter = { limit: limit } as ConfirmedSignaturesForAddress2Options;
  if (before) {
    filter['before'] = before;
  }
  const signatures =
    await program.provider.connection.getConfirmedSignaturesForAddress2(
      address,
      filter,
      finality,
    );
  const txs = await program.provider.connection.getParsedTransactions(
    signatures.map((s: any) => s.signature),
    finality,
  );
  if (txs && txs.length) {
    activityRaw = await parseVestingTreasuryTransactions(
      address,
      txs as ParsedTransactionWithMeta[],
      program.programId,
    );

    activityRaw.sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0));

    // prioritize treasury create activity
    const createVestingTreasuryActivity = activityRaw.find(
      a => a.action === VestingTreasuryActivityAction.TreasuryCreate,
    );
    if (createVestingTreasuryActivity) {
      activityRaw = activityRaw.filter(
        a => a.action !== VestingTreasuryActivityAction.TreasuryCreate,
      );
      activityRaw.push(createVestingTreasuryActivity);
    }
  }

  const activity = activityRaw.map(i => {
    return {
      signature: i.signature,
      action: i.action,
      initializer: i.initializer?.toBase58(),
      mint: i.mint?.toBase58(),
      blockTime: i.blockTime,
      amount: i.amount ? i.amount.toString() : '',
      beneficiary: i.beneficiary?.toBase58(),
      destination: i.destination?.toBase58(),
      template: i.template?.toBase58(),
      destinationTokenAccount: i.destinationTokenAccount?.toBase58(),
      stream: i.stream?.toBase58(),
      utcDate: i.utcDate,
    } as VestingTreasuryActivity;
  });

  return activity;
};

async function parseVestingTreasuryTransactions(
  treasuryAddress: PublicKey,
  transactions: ParsedTransactionWithMeta[],
  programId: PublicKey,
): Promise<VestingTreasuryActivityRaw[]> {
  const parsedActivities: VestingTreasuryActivityRaw[] = [];

  if (!transactions || transactions.length === 0) return [];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const signature = tx.transaction.signatures[0];

    for (let j = 0; j < tx.transaction.message.instructions.length; j++) {
      const ix = tx.transaction.message.instructions[
        j
      ] as PartiallyDecodedInstruction;
      if (!ix || !ix.data) continue;

      const decodedIxData = bs58.decode(ix.data);
      const ixIdlFileVersion =
        decodedIxData.length >= 9 ? decodedIxData.slice(8, 9)[0] : 0;

      let activity: VestingTreasuryActivityRaw | null = null;
      activity = await parseVestingTreasuryInstruction(
        ix,
        treasuryAddress,
        signature,
        tx.blockTime ?? 0,
        ixIdlFileVersion,
        programId,
      );
      if (!activity) {
        continue;
      }
      parsedActivities.push(activity);
    }
  }

  return parsedActivities;
}

async function parseVestingTreasuryInstruction(
  ix: PartiallyDecodedInstruction,
  treasuryAddress: PublicKey,
  transactionSignature: string,
  transactionBlockTimeInSeconds: number,
  idlFileVersion: number,
  programId: PublicKey,
): Promise<VestingTreasuryActivityRaw | null> {
  if (!ix.programId.equals(programId)) {
    return null;
  }

  try {
    if (!idls[idlFileVersion]) {
      if (idlFileVersion === 1) {
        // TODO: to avoid this if else, find a way to do dynamic imports passign concatenated paths
        const importedIdl = await import('./msp_idl_001');
        idls[idlFileVersion] = importedIdl.IDL;
      } else if (idlFileVersion === 2) {
        const importedIdl = await import('./msp_idl_002');
        idls[idlFileVersion] = importedIdl.IDL;
      } else if (idlFileVersion === 3) {
        const importedIdl = await import('./msp_idl_003');
        idls[idlFileVersion] = importedIdl.IDL;
      } else if (idlFileVersion === 4) {
        const importedIdl = await import('./msp_idl_004');
        idls[idlFileVersion] = importedIdl.IDL;
      } else {
        return null;
      }
    }
    const coder = new BorshInstructionCoder(idls[idlFileVersion] as Idl);

    const decodedIx = coder.decode(ix.data, 'base58');
    if (!decodedIx) return null;

    const ixName = decodedIx.name;
    // console.log(`ixName: ${ixName}`);
    if (
      [
        'createTreasuryAndTemplate',
        'createStreamWithTemplate',
        'addFunds',
        'modifyStreamTemplate',
        'treasuryWithdraw',
        'withdraw',
        'closeStream',
        'pauseStream',
        'resumeStream',
        'allocate',
        'refreshTreasuryData',
      ].indexOf(ixName) === -1
    )
      return null;

    const ixAccountMetas = ix.accounts.map(pk => {
      return { pubkey: pk, isSigner: false, isWritable: false };
    });

    const formattedIx = coder.format(decodedIx, ixAccountMetas);
    // console.log(formattedIx);
    // console.table(
    //   formattedIx?.accounts.map(a => {
    //     return { name: a.name, pk: a.pubkey.toBase58() };
    //   }),
    // );
    const treasury = formattedIx?.accounts.find(
      a => a.name === 'Treasury',
    )?.pubkey;
    if (!treasury || !treasury.equals(treasuryAddress)) {
      return null;
    }

    const blockTime = (transactionBlockTimeInSeconds as number) * 1000; // mult by 1000 to add milliseconds
    let action: VestingTreasuryActivityAction =
      VestingTreasuryActivityAction.StreamCreate;
    let initializer: PublicKey | undefined;
    let mint: PublicKey | undefined;
    let amount: BN | undefined;
    let template: PublicKey | undefined;
    let beneficiary: PublicKey | undefined;
    let destination: PublicKey | undefined;
    let destinationTokenAccount: PublicKey | undefined;
    let stream: PublicKey | undefined;

    if (decodedIx.name === 'createTreasuryAndTemplate') {
      action = VestingTreasuryActivityAction.TreasuryCreate;
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      template = formattedIx?.accounts.find(a => a.name === 'Template')?.pubkey;
    } else if (decodedIx.name === 'modifyStreamTemplate') {
      action = VestingTreasuryActivityAction.TreasuryModify;
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      template = formattedIx?.accounts.find(a => a.name === 'Template')?.pubkey;
    } else if (decodedIx.name === 'createStreamWithTemplate') {
      action = VestingTreasuryActivityAction.StreamCreate;
      stream = formattedIx?.accounts.find(a => a.name === 'Stream')?.pubkey;
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      template = formattedIx?.accounts.find(a => a.name === 'Template')?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      beneficiary = formattedIx?.accounts.find(
        a => a.name === 'Beneficiary',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'allocationAssignedUnits',
      )?.data;
      amount = parsedAmount ? new BN(parsedAmount) : undefined;
    } else if (decodedIx.name === 'addFunds') {
      action = VestingTreasuryActivityAction.TreasuryAddFunds;
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'amount',
      )?.data;
      amount = parsedAmount ? new BN(parsedAmount) : undefined;
    } else if (decodedIx.name === 'treasuryWithdraw') {
      action = VestingTreasuryActivityAction.TreasuryWithdraw;
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      destination = formattedIx?.accounts.find(
        a => a.name === 'Destination Authority',
      )?.pubkey;
      destinationTokenAccount = formattedIx?.accounts.find(
        a => a.name === 'Destination Token Account',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'amount',
      )?.data;
      amount = parsedAmount ? new BN(parsedAmount) : undefined;
    } else if (decodedIx.name === 'withdraw') {
      action = VestingTreasuryActivityAction.StreamWithdraw;
      stream = formattedIx?.accounts.find(a => a.name === 'Stream')?.pubkey;
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Beneficiary',
      )?.pubkey;
      beneficiary = formattedIx?.accounts.find(
        a => a.name === 'Beneficiary',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'amount',
      )?.data;
      amount = parsedAmount ? new BN(parsedAmount) : undefined;
    } else if (decodedIx.name === 'allocate') {
      action = VestingTreasuryActivityAction.StreamAllocateFunds;
      stream = formattedIx?.accounts.find(a => a.name === 'Stream')?.pubkey;
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
      const parsedAmount = formattedIx?.args.find(
        a => a.name === 'amount',
      )?.data;
      amount = parsedAmount ? new BN(parsedAmount) : undefined;
    } else if (decodedIx.name === 'closeStream') {
      action = VestingTreasuryActivityAction.StreamClose;
      stream = formattedIx?.accounts.find(a => a.name === 'Stream')?.pubkey;
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      beneficiary = formattedIx?.accounts.find(
        a => a.name === 'Beneficiary',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
    } else if (decodedIx.name === 'pauseStream') {
      action = VestingTreasuryActivityAction.StreamPause;
      stream = formattedIx?.accounts.find(a => a.name === 'Stream')?.pubkey;
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Initializer',
      )?.pubkey;
    } else if (decodedIx.name === 'resumeStream') {
      action = VestingTreasuryActivityAction.StreamResume;
      stream = formattedIx?.accounts.find(a => a.name === 'Stream')?.pubkey;
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Initializer',
      )?.pubkey;
    } else if (decodedIx.name === 'refreshTreasuryData') {
      action = VestingTreasuryActivityAction.TreasuryRefresh;
      initializer = formattedIx?.accounts.find(
        a => a.name === 'Treasurer',
      )?.pubkey;
      mint = formattedIx?.accounts.find(
        a => a.name === 'Associated Token',
      )?.pubkey;
    }
    return {
      signature: transactionSignature,
      action,
      template,
      amount,
      beneficiary,
      blockTime,
      destination,
      destinationTokenAccount,
      initializer,
      mint,
      stream,
      utcDate: new Date(blockTime).toUTCString(),
    };
  } catch (error) {
    console.log(error);
    return null;
  }
}
