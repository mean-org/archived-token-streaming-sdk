/**
 * Solana
 */
import { Commitment, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

declare global {
  export interface String {
    toPublicKey(): PublicKey;
  }
}

/**
 * MSP Instructions types
 */
export enum MSP_ACTIONS {
  scheduleOneTimePayment = 1,
  createStream = 2,
  createStreamWithFunds = 3,
  addFunds = 4,
  withdraw = 5,
  pauseStream = 6,
  resumeStream = 7,
  proposeUpdate = 8,
  answerUpdate = 9,
  createTreasury = 10,
  closeStream = 11,
  closeTreasury = 12,
  transferStream = 13,
  treasuryWithdraw = 14,
}

/**
 * Transaction fees
 */
export type TransactionFees = {
  /* Solana fees calculated based on the tx signatures and cluster */
  blockchainFee: number;
  /* MSP flat fee amount depending of the instruction that is being executed */
  mspFlatFee: number;
  /* MSP fee amount in percent depending of the instruction that is being executed */
  mspPercentFee: number;
};

/**
 * Transaction fees parameters
 */
export type TransactionFeesParams = {
  instruction: MSP_ACTIONS;
  signaturesAmount: number;
};

/**
 * Transaction message
 */
export type TransactionMessage = {
  action: string;
  description: string;
  amount: number;
  fees: TransactionFees;
};

export interface ListStreamParams {
  treasurer?: PublicKey | undefined;
  treasury?: PublicKey | undefined;
  beneficiary?: PublicKey | undefined;
  commitment?: Commitment;
  friendly?: boolean;
}

/**
 * Stream activity (Friendly version with PublicKeys converted to string)
 */
export type StreamActivity = {
  signature: string;
  initializer: string;
  action: string;
  amount: number;
  mint: string;
  blockTime: number;
  utcDate: string;
};

/**
 * Stream activity
 */
export type StreamActivityRaw = {
  signature: string;
  initializer: PublicKey | undefined;
  action: string;
  amount: BN | undefined;
  mint: PublicKey | undefined;
  blockTime: number | undefined;
  utcDate: string;
};

/**
 *  Vesting treasury activity (Friendly version with PublicKeys converted to string)
 */
export type VestingTreasuryActivity = {
  signature: string;
  action: 'createStream' | 'addFunds';
  initializer?: string;
  mint?: string;
  blockTime?: number;
  // createStream - allocation amount
  // addFunds - deposited amount
  amount?: number;
  benificeiry?: string; // create stream
  utcDate: string;
};

/**
 *  Vesting treasury activity
 */
export type VestingTreasuryActivityRaw = {
  signature: string;
  action: 'createStream' | 'addFunds';
  initializer?: PublicKey;
  mint?: PublicKey;
  blockTime?: number;
  // createStream - allocation amount
  // addFunds - deposited amount
  amount?: BN;
  benificeiry?: PublicKey; // create stream
  utcDate: string;
};

/**
 * Treasury type
 */
export enum TreasuryType {
  Open = 0,
  Lock = 1,
}

/**
 * Treasury info
 */
export type Treasury = {
  id: PublicKey | string;
  version: number;
  initialized: boolean;
  bump: number;
  slot: number;
  name: string;
  treasurer: PublicKey | string;
  associatedToken: PublicKey | string;
  mint: PublicKey | string;
  labels: string[]; //max 5 labels per treasury
  balance: number;
  allocationReserved: number;
  allocationAssigned: number;
  totalWithdrawals: number;
  totalStreams: number;
  createdOnUtc: Date | string;
  treasuryType: TreasuryType;
  autoClose: boolean;
  category: Category;
  subCategory: SubCategory;
  data: any;
};

/**
 * Stream template
 */
export type StreamTemplate = {
  id: PublicKey | string;
  version: number;
  bump: number;
  startUtc: Date | string;
  cliffVestPercent: number;
  rateIntervalInSeconds: number;
  durationNumberOfUnits: number;
  feePayedByTreasurer: boolean;
};

/**
 * Stream states
 */
export enum STREAM_STATUS {
  Schedule = 1,
  Running = 2,
  Paused = 3,
}

/**
 * Allocation type
 */
export enum AllocationType {
  All = 0,
  Specific = 1,
  None = 2,
}

/**
 * Stream info
 */
export type Stream = {
  id: PublicKey | string | undefined;
  initialized: boolean;
  version: number;
  name: string;
  treasurer: PublicKey | string;
  rateAmount: number;
  rateIntervalInSeconds: number;
  startUtc: Date | string;
  cliffVestAmount: number;
  cliffVestPercent: number;
  beneficiary: PublicKey | string;
  associatedToken: PublicKey | string;
  treasury: PublicKey | string;
  allocationAssigned: number;
  // allocationReserved: number,
  totalWithdrawalsAmount: number;
  createdBlockTime: number;
  createdOnUtc: Date | string;
  lastRetrievedBlockTime: number;
  lastRetrievedTimeInSeconds: number;
  upgradeRequired: boolean;
  status: STREAM_STATUS | string;
  withdrawableAmount: number;
  fundsLeftInStream: number;
  fundsSentToBeneficiary: number;
  remainingAllocationAmount: number;
  estimatedDepletionDate: Date | string;
  streamUnitsPerSecond: number;
  isManuallyPaused: boolean;
  feePayedByTreasurer: boolean;
  category: Category;
  subCategory: SubCategory;
  data: any;
};

/**
 * Beneficiary Info
 */
export type Beneficiary = {
  streamName: string;
  address: PublicKey;
};

/**
 * Stream Beneficiary Info
 */
export type StreamBeneficiary = {
  streamName: string;
  address: PublicKey;
  beneficiary: PublicKey;
};

// Primary category of tresury accounts
export enum Category {
  default = 0,
  vesting = 1,
}

// Sub categories of vesting accounts
export enum SubCategory {
  default = 0,
  advisor = 1,
  development = 2,
  foundation = 3,
  marketing = 5,
  partnership = 6,
  seed = 7,
  team = 8,
}

// Preferred Time Unit
export enum TimeUnit {
  Second = 0,
  Minute = 60,
  Hour = 3600,
  Day = 86400,
  Week = 604800,
  Month = 2629750,
  Year = 31557000,
}
