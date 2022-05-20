import { PublicKey } from "@solana/web3.js";

/**
 * Constants
 */
export class Constants {

    static MSP = new PublicKey('MSPCUMbLfy2MeT6geLMMzrUkv1Tx88XRApaVRdyxTuu');
    static FEE_TREASURY = new PublicKey('3TD6SWY9M1mLY2kZWJNavPLhwXvcRsWdnZLRaMzERJBw');
    static WSOL_TOKEN_MINT = new PublicKey('So11111111111111111111111111111111111111112');
    static TREASURY_SIZE = 300;
    static STREAM_SIZE = 500;
    static CLIFF_PERCENT_NUMERATOR = 10_000;
    static CLIFF_PERCENT_DENOMINATOR = 1_000_000;
    static MAX_TX_SIZE = 1200;
}

/**
 * Warning types of the given address
 */
export enum WARNING_TYPES {
    NO_WARNING,
    WARNING_PDA,
    WARNING_SP,
    UNKNOWN_NETWORK = 1001
}

/**
 * Blockchain public networks
 */
export enum NETWORK_IDS {
    SOLANA_MAINNET = 101,
    SOLANA_TESTNET = 102,
    SOLANA_DEVNET = 103
}