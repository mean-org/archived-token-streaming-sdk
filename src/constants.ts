import { PublicKey } from "@solana/web3.js";

/**
 * Constants
 */
export class Constants {
    static MSP = new PublicKey('MSPCUMbLfy2MeT6geLMMzrUkv1Tx88XRApaVRdyxTuu');
    static FEE_TREASURY = new PublicKey('3TD6SWY9M1mLY2kZWJNavPLhwXvcRsWdnZLRaMzERJBw');
    static TREASURY_SIZE = 300;
    static STREAM_SIZE = 500;
    static CLIFF_PERCENT_NUMERATOR = 10_000;
    static CLIFF_PERCENT_DENOMINATOR = 1_000_000;
    static MAX_TX_SIZE = 1200;
    // This is an internal convention to identify the intention to use NATIVE sol and not SPL wSOL
    static SOL_MINT = new PublicKey('11111111111111111111111111111111');
}

export const LATEST_IDL_FILE_VERSION = 3;

export enum WARNING_TYPES {
    NO_WARNING = 0,
    INVALID_ADDRESS = 1,
    WARNING = 2
}