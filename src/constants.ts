import { PublicKey } from '@solana/web3.js';

/**
 * Constants
 */
export class Constants {
  // DEVNET MSP program address: MSPdQo5ZdrPh6rU1LsvUv5nRhAnj1mj6YQEqBUq8YwZ
  // MAINNET MSP program address: MSPCUMbLfy2MeT6geLMMzrUkv1Tx88XRApaVRdyxTuu
  static FEE_TREASURY = new PublicKey(
    '3TD6SWY9M1mLY2kZWJNavPLhwXvcRsWdnZLRaMzERJBw',
  );
  static TREASURY_SIZE = 300;
  static STREAM_SIZE = 500;
  /**
   * 0-100 percentage values should be multiplied by this value before being
   * passed as argument to program instructions.
   */
  static CLIFF_PERCENT_NUMERATOR = 10_000;
  static CLIFF_PERCENT_DENOMINATOR = 1_000_000;
  static MAX_TX_SIZE = 1200;
  // This is an internal convention to identify the intention to use NATIVE sol and not SPL wSOL
  static SOL_MINT = new PublicKey('11111111111111111111111111111111');
  static READONLY_PUBKEY = new PublicKey(
    '3KmMEv7A8R3MMhScQceXBQe69qLmnFfxSM3q8HyzkrSx',
  );
}

export const LATEST_IDL_FILE_VERSION = 5;

export enum WARNING_TYPES {
  NO_WARNING = 0,
  INVALID_ADDRESS = 1,
  WARNING = 2,
}
