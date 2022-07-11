/**
 * Solana
 */
import {
  AccountInfo,
  Commitment,
  Connection,
  ConnectionConfig,
  Finality,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT as NATIVE_WSOL_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { BN, Program } from '@project-serum/anchor';

import { Msp } from './msp_idl_003';

/**
 * MSP
 */
import {
  ListStreamParams,
  Stream,
  STREAM_STATUS,
  SubCategory,
  Treasury,
  TreasuryType,
  VestingTreasuryActivity,
  VestingTreasuryActivityRaw,
} from './types';
import { Category } from './types';
import { StreamTemplate } from './types';
import { TimeUnit } from './types';
import {
  createProgram,
  createWrapSolInstructions,
  getStream,
  getStreamCached,
  getTreasury,
  getValidTreasuryAllocation,
  listStreamActivity,
  listStreams,
  listStreamsCached,
  listVestingTreasuryActivity,
} from './utils';
import { getStreamTemplate } from './utils';
import { findStreamTemplateAddress } from './utils';
import { Constants, WARNING_TYPES } from './constants';
import { LATEST_IDL_FILE_VERSION } from './constants';
import { Beneficiary, listTreasuries, StreamBeneficiary } from '.';
import { u64Number } from './u64n';

/**
 * API class with functions to interact with the Money Streaming Program using Solana Web3 JS API
 */
export class MSP {
  private connection: Connection;
  private program: Program<Msp>;
  private commitment: Commitment | ConnectionConfig | undefined;
  private customProgramId: PublicKey | undefined;

  /**
   * Create a Streaming API object
   *
   * @param cluster The solana cluster endpoint used for the connecton
   */
  constructor(
    rpcUrl: string,
    walletAddress: string,
    commitment: Commitment | string = 'finalized',
    _customProgramId?: PublicKey,
  ) {
    this.commitment = commitment as Commitment;
    this.connection = new Connection(
      rpcUrl,
      (this.commitment as Commitment) || 'finalized',
    );
    this.customProgramId = _customProgramId;
    this.program = createProgram(
      this.connection,
      walletAddress,
      _customProgramId,
    );
  }

  public async getStream(id: PublicKey, friendly = true): Promise<any> {
    const program = createProgram(
      this.connection,
      Constants.FEE_TREASURY.toBase58(),
      this.customProgramId,
    );

    return getStream(program, id, friendly);
  }

  public async refreshStream(
    streamInfo: any,
    hardUpdate = false,
    friendly = true,
  ): Promise<any> {
    const copyStreamInfo = Object.assign({}, streamInfo);

    if (hardUpdate) {
      const program = createProgram(
        this.connection,
        Constants.FEE_TREASURY.toBase58(),
        this.customProgramId,
      );

      const streamId =
        typeof copyStreamInfo.id === 'string'
          ? new PublicKey(copyStreamInfo.id)
          : (copyStreamInfo.id as PublicKey);

      return await getStream(program, streamId);
    }

    return getStreamCached(copyStreamInfo, friendly);
  }

  public async listStreams({
    treasurer,
    treasury,
    beneficiary,
    friendly = true,
    category = undefined,
    subCategory = undefined,
  }: ListStreamParams): Promise<Stream[]> {
    return listStreams(
      this.program,
      treasurer,
      treasury,
      beneficiary,
      friendly,
      category,
      subCategory,
    );
  }

  public async refreshStreams(
    streamInfoList: Stream[],
    treasurer?: PublicKey | undefined,
    treasury?: PublicKey | undefined,
    beneficiary?: PublicKey | undefined,
    hardUpdate = false,
    friendly = true,
  ): Promise<Stream[]> {
    if (hardUpdate) {
      return await listStreams(
        this.program,
        treasurer,
        treasury,
        beneficiary,
        friendly,
      );
    }

    return listStreamsCached(streamInfoList, friendly);
  }

  /**
   *
   * @param id The address of the stream
   * @param before The signature to start searching backwards from.
   * @param limit The max amount of elements to retrieve
   * @param commitment Commitment to query the stream activity
   * @param friendly The data will be displayed in a user readable format
   * @returns
   */
  public async listStreamActivity(
    id: PublicKey,
    before: string,
    limit = 10,
    commitment?: Finality | undefined,
    friendly = true,
  ): Promise<any[]> {
    const accountInfo = await this.connection.getAccountInfo(id, commitment);

    if (!accountInfo) {
      throw Error("Stream doesn't exists");
    }

    return listStreamActivity(
      this.program,
      id,
      before,
      limit,
      commitment,
      friendly,
    );
  }

  public async getTreasury(
    id: PublicKey,
    commitment?: Commitment | undefined,
    friendly = true,
  ): Promise<Treasury> {
    const accountInfo = await this.program.account.treasury.getAccountInfo(
      id,
      commitment,
    );

    if (!accountInfo) {
      throw Error("Treasury doesn't exists");
    }

    return getTreasury(this.program, id, friendly);
  }

  public async listTreasuries(
    treasurer: PublicKey | undefined,
    friendly = true,
    excludeAutoClose?: boolean,
    category?: Category,
    subCategory?: SubCategory,
  ): Promise<Treasury[]> {
    return listTreasuries(
      this.program,
      treasurer,
      friendly,
      excludeAutoClose,
      category,
      subCategory,
    );
  }

  public async getStreamTemplate(
    treasury: PublicKey,
    friendly = true,
  ): Promise<StreamTemplate> {
    const [template] = await findStreamTemplateAddress(
      treasury,
      this.program.programId,
    );
    return getStreamTemplate(this.program, template, friendly);
  }

  public async transfer(
    sender: PublicKey,
    beneficiary: PublicKey,
    mint: PublicKey,
    amount: number,
  ): Promise<Transaction> {
    const ixs: TransactionInstruction[] = [];

    if (mint.equals(Constants.SOL_MINT)) {
      ixs.push(
        SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: beneficiary,
          lamports: amount,
        }),
      );
    } else {
      const senderToken = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        sender,
        true,
      );

      const senderTokenInfo = await this.connection.getAccountInfo(senderToken);
      if (!senderTokenInfo) {
        throw Error('Sender token account not found');
      }

      let beneficiaryToken = beneficiary;
      const beneficiaryAccountInfo = await this.connection.getAccountInfo(
        beneficiary,
      );

      if (
        !beneficiaryAccountInfo ||
        !beneficiaryAccountInfo.owner.equals(TOKEN_PROGRAM_ID)
      ) {
        beneficiaryToken = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          mint,
          beneficiary,
          true,
        );

        const beneficiaryTokenAccountInfo =
          await this.connection.getAccountInfo(beneficiaryToken);

        if (!beneficiaryTokenAccountInfo) {
          ixs.push(
            Token.createAssociatedTokenAccountInstruction(
              ASSOCIATED_TOKEN_PROGRAM_ID,
              TOKEN_PROGRAM_ID,
              mint,
              beneficiaryToken,
              beneficiary,
              sender,
            ),
          );
        }
      } else {
        // At this point the beneficiaryToken is either a mint or a token account
        // Let's make sure it is a token account of the passed mint
        const tokenClient: Token = new Token(
          this.connection,
          mint,
          TOKEN_PROGRAM_ID,
          Keypair.generate(),
        );
        try {
          const beneficiaryTokenInfo = await tokenClient.getAccountInfo(
            beneficiaryToken,
          );
          if (!beneficiaryTokenInfo)
            throw Error('Reciever is not a token account');
        } catch (error) {
          throw Error('Reciever is not a token account');
        }
      }

      ixs.push(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          senderToken,
          beneficiaryToken,
          sender,
          [],
          amount,
        ),
      );
    }

    const tx = new Transaction().add(...ixs);
    tx.feePayer = sender;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  public async scheduledTransfer(
    treasurer: PublicKey,
    beneficiary: PublicKey,
    mint: PublicKey,
    amount: number,
    startUtc?: Date,
    streamName?: string,
    feePayedByTreasurer = false,
    category: Category = Category.default,
    subCategory: SubCategory = SubCategory.default,
  ): Promise<Transaction> {
    let autoWSol = false;
    if (mint.equals(Constants.SOL_MINT)) {
      mint = NATIVE_WSOL_MINT;
      autoWSol = true;
    }

    const ixs: TransactionInstruction[] = [];
    const txSigners: Signer[] = [];

    const now = new Date();
    const start =
      !startUtc || startUtc.getTime() < now.getTime() ? now : startUtc;
    const treasurerToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      treasurer,
      true,
    );

    const treasurerTokenInfo = await this.connection.getAccountInfo(
      treasurerToken,
    );
    await this.ensureAutoWrapSolInstructions(
      autoWSol,
      amount,
      treasurer,
      treasurerToken,
      treasurerTokenInfo,
      ixs,
      txSigners,
    );

    // Create the treasury account since the OTP is schedule
    const slot = await this.connection.getSlot(this.commitment as Commitment);
    const slotBuffer = new u64Number(slot).toBuffer();
    const treasurySeeds = [treasurer.toBuffer(), slotBuffer];
    const [treasury] = await PublicKey.findProgramAddress(
      treasurySeeds,
      this.program.programId,
    );
    const treasuryMintSeeds = [
      treasurer.toBuffer(),
      treasury.toBuffer(),
      slotBuffer,
    ];
    const [treasuryMint] = await PublicKey.findProgramAddress(
      treasuryMintSeeds,
      this.program.programId,
    );

    // Get the treasury token account
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      treasury,
      true,
    );

    // Get the treasury pool treasurer token
    const treasurerTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryMint,
      treasurer,
      true,
    );

    // Create treasury
    ixs.push(
      this.program.instruction.createTreasury(
        LATEST_IDL_FILE_VERSION,
        new BN(slot),
        streamName ?? '',
        TreasuryType.Open,
        true, // autoclose = true
        false, // sol fee payed by treasury
        { [Category[category]]: {} },
        { [SubCategory[subCategory]]: {} },
        {
          accounts: {
            payer: treasurer,
            treasurer: treasurer,
            treasury: treasury,
            treasuryToken: treasuryToken,
            associatedToken: mint,
            feeTreasury: Constants.FEE_TREASURY,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        },
      ),
    );

    // // Create treasury
    // const ix1 = this.program.methods.createTreasury(
    //   new BN(slot),
    //   streamName,
    //   TreasuryType.Open,
    //   true, // autoclose = true
    //   false, // sol fee payed by treasury
    // )
    //   .accounts({
    //     payer: treasurer,
    //     treasurer: treasurer,
    //     treasury: treasury,
    //     treasuryMint: treasuryMint,
    //     treasuryToken: treasuryToken,
    //     associatedToken: mint,
    //     feeTreasury: Constants.FEE_TREASURY,
    //     associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     systemProgram: SystemProgram.programId,
    //     rent: SYSVAR_RENT_PUBKEY
    //   })
    //   .instruction();

    // ixs.push(ix1);

    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      Constants.FEE_TREASURY,
      true,
    );

    // Add Funds
    ixs.push(
      this.program.instruction.addFunds(
        LATEST_IDL_FILE_VERSION,
        new BN(amount),
        {
          accounts: {
            payer: treasurer,
            contributor: treasurer,
            contributorToken: treasurerToken,
            treasury: treasury,
            treasuryToken: treasuryToken,
            associatedToken: mint,
            feeTreasury: Constants.FEE_TREASURY,
            feeTreasuryToken: feeTreasuryToken,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        },
      ),
    );

    // Create stream account since the OTP is scheduled
    const streamAccount = Keypair.generate();
    txSigners.push(streamAccount);
    const startUtcInSeconds = parseInt((start.getTime() / 1000).toString());

    // Create Stream
    ixs.push(
      this.program.instruction.createStream(
        LATEST_IDL_FILE_VERSION,
        streamName ?? '',
        new BN(startUtcInSeconds),
        new BN(0), // rate amount units
        new BN(0), // rate interval in seconds
        new BN(amount), // allocation assigned
        new BN(amount), // cliff vest amount
        new BN(0), // cliff vest percent
        feePayedByTreasurer,
        {
          accounts: {
            payer: treasurer,
            treasurer: treasurer,
            treasury: treasury,
            treasuryToken: treasuryToken,
            associatedToken: mint,
            beneficiary: beneficiary,
            stream: streamAccount.publicKey,
            feeTreasury: Constants.FEE_TREASURY,
            feeTreasuryToken: feeTreasuryToken,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [streamAccount],
        },
      ),
    );

    const tx = new Transaction().add(...ixs);
    tx.feePayer = treasurer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (txSigners.length > 0) {
      tx.partialSign(...txSigners);
    }

    return tx;
  }

  public async streamPayment(
    treasurer: PublicKey,
    beneficiary: PublicKey,
    mint: PublicKey,
    streamName: string,
    allocationAssigned: number,
    rateAmount?: number,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: number,
    cliffVestPercent?: number,
    feePayedByTreasurer = false,
    category: Category = Category.default,
    subCategory: SubCategory = SubCategory.default,
  ): Promise<Transaction> {
    if (treasurer.equals(beneficiary)) {
      throw Error('Beneficiary can not be the same Treasurer');
    }

    let autoWSol = false;
    if (mint.equals(Constants.SOL_MINT)) {
      mint = NATIVE_WSOL_MINT;
      autoWSol = true;
    }

    const ixs: TransactionInstruction[] = [];
    const txSigners: Signer[] = [];

    const now = new Date();
    const start = !startUtc || startUtc.getTime() < Date.now() ? now : startUtc;
    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      Constants.FEE_TREASURY,
      true,
    );

    const cliffVestPercentValue = cliffVestPercent
      ? cliffVestPercent * Constants.CLIFF_PERCENT_NUMERATOR
      : 0;

    const slot = await this.connection.getSlot(
      (this.commitment as Commitment) || 'finalized',
    );
    const slotBuffer = new u64Number(slot).toBuffer();
    const treasurySeeds = [treasurer.toBuffer(), slotBuffer];
    const [treasury] = await PublicKey.findProgramAddress(
      treasurySeeds,
      this.program.programId,
    );
    const treasuryMintSeeds = [
      treasurer.toBuffer(),
      treasury.toBuffer(),
      slotBuffer,
    ];
    const [treasuryMint] = await PublicKey.findProgramAddress(
      treasuryMintSeeds,
      this.program.programId,
    );

    // Get the treasury token account
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      treasury,
      true,
    );

    // Get the treasury pool treasurer token
    const treasurerTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryMint,
      treasurer,
      true,
    );

    // Create treasury
    ixs.push(
      this.program.instruction.createTreasury(
        LATEST_IDL_FILE_VERSION,
        new BN(slot),
        streamName,
        TreasuryType.Open,
        true, // autoclose = true
        false, // sol fee payed by treasury
        { [Category[category]]: {} },
        { [SubCategory[subCategory]]: {} },
        {
          accounts: {
            payer: treasurer,
            treasurer: treasurer,
            treasury: treasury,
            treasuryToken: treasuryToken,
            associatedToken: mint,
            feeTreasury: Constants.FEE_TREASURY,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        },
      ),
    );

    // Get the treasurer token account
    const treasurerToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      treasurer,
      true,
    );

    const treasurerTokenInfo = await this.connection.getAccountInfo(
      treasurerToken,
    );
    await this.ensureAutoWrapSolInstructions(
      autoWSol,
      allocationAssigned,
      treasurer,
      treasurerToken,
      treasurerTokenInfo,
      ixs,
      txSigners,
    );

    // Add Funds
    ixs.push(
      this.program.instruction.addFunds(
        LATEST_IDL_FILE_VERSION,
        new BN(allocationAssigned),
        {
          accounts: {
            payer: treasurer,
            contributor: treasurer,
            contributorToken: treasurerToken,
            treasury: treasury,
            treasuryToken: treasuryToken,
            associatedToken: mint,
            feeTreasury: Constants.FEE_TREASURY,
            feeTreasuryToken: feeTreasuryToken,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        },
      ),
    );

    const streamAccount = Keypair.generate();
    txSigners.push(streamAccount);
    const startUtcInSeconds = parseInt((start.getTime() / 1000).toString());

    // Create Stream
    ixs.push(
      this.program.instruction.createStream(
        LATEST_IDL_FILE_VERSION,
        streamName,
        new BN(startUtcInSeconds),
        new BN(rateAmount ?? 0), // rate amount units
        new BN(rateIntervalInSeconds ?? 0), // rate interval in seconds
        new BN(allocationAssigned), // allocation assigned
        new BN(cliffVestAmount ?? 0), // cliff vest amount
        new BN((cliffVestPercent ?? 0) * 10_000), // cliff vest percent
        feePayedByTreasurer,
        {
          accounts: {
            payer: treasurer,
            treasurer: treasurer,
            treasury: treasury,
            treasuryToken: treasuryToken,
            associatedToken: mint,
            beneficiary: beneficiary,
            stream: streamAccount.publicKey,
            feeTreasury: Constants.FEE_TREASURY,
            feeTreasuryToken: feeTreasuryToken,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [streamAccount],
        },
      ),
    );

    const tx = new Transaction().add(...ixs);
    tx.feePayer = treasurer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (txSigners.length) {
      tx.partialSign(...txSigners);
    }

    return tx;
  }

  public async createTreasury(
    payer: PublicKey,
    treasurer: PublicKey,
    associatedTokenMint: PublicKey,
    label: string,
    type: TreasuryType,
    solFeePayedByTreasury = false,
    category: Category = Category.default,
    subCategory: SubCategory = SubCategory.default,
  ): Promise<Transaction> {
    return (
      await this.createTreasury2(
        payer,
        treasurer,
        associatedTokenMint,
        label,
        type,
        solFeePayedByTreasury,
        category,
        subCategory,
      )
    )[0];
  }

  /**
   * This one returns not only the transaction but also the address of the
   * treasury that will be created
   */
  public async createTreasury2(
    payer: PublicKey,
    treasurer: PublicKey,
    associatedTokenMint: PublicKey,
    label: string,
    type: TreasuryType,
    solFeePayedByTreasury = false,
    category: Category = Category.default,
    subCategory: SubCategory = SubCategory.default,
  ): Promise<[Transaction, PublicKey]> {
    const slot = await this.connection.getSlot(
      (this.commitment as Commitment) || 'finalized',
    );
    const slotBuffer = new u64Number(slot).toBuffer();
    const treasurySeeds = [treasurer.toBuffer(), slotBuffer];
    // Treasury Pool PDA
    const [treasury] = await PublicKey.findProgramAddress(
      treasurySeeds,
      this.program.programId,
    );
    const treasuryPoolMintSeeds = [
      treasurer.toBuffer(),
      treasury.toBuffer(),
      slotBuffer,
    ];
    // Treasury Pool Mint PDA
    const [treasuryMint] = await PublicKey.findProgramAddress(
      treasuryPoolMintSeeds,
      this.program.programId,
    );

    if (associatedTokenMint.equals(Constants.SOL_MINT)) {
      associatedTokenMint = NATIVE_WSOL_MINT;
    }

    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      associatedTokenMint,
      treasury,
      true,
    );

    const tx = this.program.transaction.createTreasury(
      LATEST_IDL_FILE_VERSION,
      new BN(slot),
      label,
      type,
      false, // autoclose = false
      solFeePayedByTreasury,
      { [Category[category]]: {} },
      { [SubCategory[subCategory]]: {} },
      {
        accounts: {
          payer: payer,
          treasurer: treasurer,
          treasury: treasury,
          treasuryToken: treasuryToken,
          associatedToken: associatedTokenMint,
          feeTreasury: Constants.FEE_TREASURY,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      },
    );

    tx.feePayer = treasurer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return [tx, treasury];
  }

  public async createStream(
    payer: PublicKey,
    treasurer: PublicKey,
    treasury: PublicKey,
    beneficiary: PublicKey,
    associatedToken: PublicKey,
    streamName: string,
    allocationAssigned: number,
    rateAmount?: number,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: number,
    cliffVestPercent?: number,
    feePayedByTreasurer?: boolean,
  ): Promise<Transaction> {
    const [tx] = await this.createStream2(
      payer,
      treasurer,
      treasury,
      beneficiary,
      associatedToken,
      streamName,
      allocationAssigned,
      rateAmount,
      rateIntervalInSeconds,
      startUtc,
      cliffVestAmount,
      cliffVestPercent,
      feePayedByTreasurer,
    );
    return tx;
  }

  /**
   * This one returns not only the transaction but also the address of the
   * stream that will be created
   */
  public async createStream2(
    payer: PublicKey,
    treasurer: PublicKey,
    treasury: PublicKey,
    beneficiary: PublicKey,
    treasuryAssociatedTokenMint: PublicKey,
    streamName: string,
    allocationAssigned: number,
    rateAmount?: number,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: number,
    cliffVestPercent?: number,
    feePayedByTreasurer?: boolean,
  ): Promise<[Transaction, PublicKey]> {
    if (treasurer.equals(beneficiary)) {
      throw Error('Beneficiary can not be the same Treasurer');
    }

    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    if (
      treasuryInfo.associatedToken !== treasuryAssociatedTokenMint.toBase58()
    ) {
      throw Error('Incorrect associated token address');
    }

    // Get the treasury token account
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      treasury,
      true,
    );

    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      Constants.FEE_TREASURY,
      true,
    );

    const cliffVestPercentValue = cliffVestPercent
      ? cliffVestPercent * Constants.CLIFF_PERCENT_NUMERATOR
      : 0;
    const now = new Date();
    const startDate =
      startUtc && startUtc.getTime() >= now.getTime() ? startUtc : now;
    const startUtcInSeconds = parseInt((startDate.getTime() / 1000).toString());
    const streamAccount = Keypair.generate();

    // Create Stream
    const tx = this.program.transaction.createStream(
      LATEST_IDL_FILE_VERSION,
      streamName,
      new BN(startUtcInSeconds),
      new BN(rateAmount as number),
      new BN(rateIntervalInSeconds as number),
      new BN(allocationAssigned),
      new BN(cliffVestAmount as number),
      new BN(cliffVestPercentValue),
      feePayedByTreasurer ?? false,
      {
        accounts: {
          payer: payer,
          treasurer: treasurer,
          treasury: treasury,
          treasuryToken: treasuryToken,
          associatedToken: treasuryAssociatedTokenMint,
          beneficiary: beneficiary,
          stream: streamAccount.publicKey,
          feeTreasury: Constants.FEE_TREASURY,
          feeTreasuryToken: feeTreasuryToken,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [streamAccount],
      },
    );

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;
    tx.partialSign(...[streamAccount]);

    return [tx, streamAccount.publicKey];
  }

  /**
   * This creates a vesting stream treasury with template.
   */
  public async createVestingTreasury(
    payer: PublicKey,
    treasurer: PublicKey,
    label: string,
    type: TreasuryType,
    solFeePayedByTreasury: boolean,
    treasuryAssociatedTokenMint: PublicKey,
    duration: number,
    durationUnit: TimeUnit,
    fundingAmount: number,
    vestingCategory: SubCategory,
    startUtc?: Date,
    cliffVestPercent = 0,
    feePayedByTreasurer?: boolean,
  ): Promise<[Transaction, PublicKey]> {
    // convert duration to seconds
    const rateIntervalInSeconds: number = durationUnit as number;

    const slot = await this.connection.getSlot(
      (this.commitment as Commitment) || 'finalized',
    );
    const slotBuffer = new u64Number(slot).toBuffer();
    const treasurySeeds = [treasurer.toBuffer(), slotBuffer];
    // Treasury Pool PDA
    const [treasury] = await PublicKey.findProgramAddress(
      treasurySeeds,
      this.program.programId,
    );
    const treasuryPoolMintSeeds = [
      treasurer.toBuffer(),
      treasury.toBuffer(),
      slotBuffer,
    ];
    // Treasury Pool Mint PDA
    const [treasuryMint] = await PublicKey.findProgramAddress(
      treasuryPoolMintSeeds,
      this.program.programId,
    );

    let autoWSol = false;
    if (treasuryAssociatedTokenMint.equals(Constants.SOL_MINT)) {
      treasuryAssociatedTokenMint = NATIVE_WSOL_MINT;
      autoWSol = true;
    }

    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      treasury,
      true,
    );

    const cliffVestPercentValue = cliffVestPercent
      ? cliffVestPercent * Constants.CLIFF_PERCENT_NUMERATOR
      : 0;
    const now = new Date();
    const startDate =
      startUtc && startUtc.getTime() >= now.getTime() ? startUtc : now;
    const startUtcInSeconds = parseInt((startDate.getTime() / 1000).toString());

    // Template address
    const [template] = await findStreamTemplateAddress(
      treasury,
      this.program.programId,
    );

    const tx = this.program.transaction.createTreasuryAndTemplate(
      LATEST_IDL_FILE_VERSION,
      label,
      type,
      false,
      solFeePayedByTreasury,
      { [Category[Category.vesting]]: {} },
      { [SubCategory[vestingCategory]]: {} },
      new BN(startUtcInSeconds),
      new BN(rateIntervalInSeconds),
      new BN(duration),
      new BN(cliffVestPercentValue),
      feePayedByTreasurer ?? false,
      new BN(slot),
      {
        accounts: {
          payer: payer,
          treasurer: treasurer,
          treasury: treasury,
          treasuryToken: treasuryToken,
          template,
          associatedToken: treasuryAssociatedTokenMint,
          feeTreasury: Constants.FEE_TREASURY,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      },
    );
    const addFundsSigners: Signer[] = [];
    if (fundingAmount > 0) {
      const contributorToken = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        treasuryAssociatedTokenMint,
        payer,
        true,
      );

      const contributorTokenInfo = await this.connection.getAccountInfo(
        contributorToken,
        'recent',
      );

      const ixs: TransactionInstruction[] = [];
      await this.ensureAutoWrapSolInstructions(
        autoWSol,
        fundingAmount,
        payer,
        contributorToken,
        contributorTokenInfo,
        ixs,
        addFundsSigners,
      );

      const treasuryToken = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        treasuryAssociatedTokenMint,
        treasury,
        true,
      );

      const feeTreasuryToken = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        treasuryAssociatedTokenMint,
        Constants.FEE_TREASURY,
        true,
      );

      ixs.push(
        this.program.instruction.addFunds(
          LATEST_IDL_FILE_VERSION,
          new BN(fundingAmount),
          {
            accounts: {
              payer: payer,
              contributor: payer,
              contributorToken: contributorToken,
              treasury: treasury,
              treasuryToken: treasuryToken,
              associatedToken: treasuryAssociatedTokenMint,
              feeTreasury: Constants.FEE_TREASURY,
              feeTreasuryToken: feeTreasuryToken,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          },
        ),
      );
      tx.add(...ixs);
    }

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (addFundsSigners.length > 0) {
      tx.partialSign(...addFundsSigners);
    }

    return [tx, treasury];
  }

  /**
   *
   * @param id The address of the treasury
   * @param before The signature to start searching backwards from.
   * @param limit The max amount of elements to retrieve
   * @param commitment Commitment to query the treasury activity
   * @param friendly The data will be displayed in a user readable format
   * @returns
   */
  public async listVestingTreasuryActivity(
    id: PublicKey,
    before: string,
    limit = 10,
    commitment?: Finality | undefined,
    friendly = true,
  ): Promise<VestingTreasuryActivity[] | VestingTreasuryActivityRaw[]> {
    const accountInfo = await this.connection.getAccountInfo(id, commitment);

    if (!accountInfo) {
      throw Error("Treasury doesn't exists");
    }

    return listVestingTreasuryActivity(
      this.program,
      id,
      before,
      limit,
      commitment,
      friendly,
    );
  }

  /**
   * Gets the flowing rate of a vesting contract.
   * @param vestingTreasury The address of the treasury
   * @returns a tuple of the amount, the time unit ([20, TimeUnit.Week] == 20/week)
   * and total allocation of all streams
   */
  public async getVestingFlowRate(
    vestingTreasury: PublicKey,
  ): Promise<[number, TimeUnit, number]> {
    const treasuryInfo = await getTreasury(this.program, vestingTreasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    // Get the template
    const [templateAddress] = await findStreamTemplateAddress(
      vestingTreasury,
      this.program.programId,
    );
    const templateInfo = await getStreamTemplate(this.program, templateAddress);
    if (!templateInfo) {
      throw Error("Stream template doesn't exist");
    }

    if (treasuryInfo.totalStreams === 0)
      return [0, templateInfo.rateIntervalInSeconds as TimeUnit, 0];

    const streams = await listStreams(
      this.program,
      undefined,
      vestingTreasury,
      undefined,
    );
    let streamRate = 0;
    let totalAllocation = 0;
    for (const stream of streams) {
      totalAllocation = totalAllocation + stream.allocationAssigned;
      switch (stream.status) {
        case STREAM_STATUS.Paused:
        case STREAM_STATUS.Schedule:
          continue;
      }
      if (stream.remainingAllocationAmount <= 0) {
        // all streamed
        continue;
      }
      const rateAmount =
        (stream.allocationAssigned *
          (1 - templateInfo.cliffVestPercent / 1_000_000)) /
        templateInfo.durationNumberOfUnits;
      streamRate = streamRate + rateAmount;
    }

    return [
      streamRate,
      templateInfo.rateIntervalInSeconds as TimeUnit,
      totalAllocation,
    ];
  }

  /**
   * This creates a stream with template
   */
  public async createStreamWithTemplate(
    payer: PublicKey,
    treasurer: PublicKey,
    treasury: PublicKey,
    beneficiary: PublicKey,
    treasuryAssociatedTokenMint: PublicKey,
    allocationAssigned: number,
    streamName = '',
  ): Promise<[Transaction, PublicKey]> {
    if (treasurer.equals(beneficiary)) {
      throw Error('Beneficiary can not be the same Treasurer');
    }

    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    if (
      treasuryInfo.associatedToken !== treasuryAssociatedTokenMint.toBase58()
    ) {
      throw Error('Incorrect associated token address');
    }

    // Get the template
    const [template] = await findStreamTemplateAddress(
      treasury,
      this.program.programId,
    );
    const templateInfo = await getStreamTemplate(this.program, template);
    if (!templateInfo) {
      throw Error("Stream template doesn't exist");
    }

    // Calculate rate amount
    const rateAmount =
      (allocationAssigned * (1 - templateInfo.cliffVestPercent / 1_000_000)) /
      templateInfo.durationNumberOfUnits;

    // Get the treasury token account
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      treasury,
      true,
    );

    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      Constants.FEE_TREASURY,
      true,
    );

    const streamAccount = Keypair.generate();

    // Create Stream
    const tx = this.program.transaction.createStreamWithTemplate(
      LATEST_IDL_FILE_VERSION,
      streamName,
      new BN(rateAmount),
      new BN(allocationAssigned),
      {
        accounts: {
          payer: payer,
          template,
          treasurer: treasurer,
          treasury: treasury,
          treasuryToken: treasuryToken,
          associatedToken: treasuryAssociatedTokenMint,
          beneficiary: beneficiary,
          stream: streamAccount.publicKey,
          feeTreasury: Constants.FEE_TREASURY,
          feeTreasuryToken: feeTreasuryToken,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [streamAccount],
      },
    );

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;
    tx.partialSign(...[streamAccount]);

    return [tx, streamAccount.publicKey];
  }

  /**
   * This creates a stream with template with PDA
   */
  public async createStreamWithTemplateFromPda(
    payer: PublicKey,
    treasurer: PublicKey,
    treasury: PublicKey,
    stream: PublicKey,
    beneficiary: PublicKey,
    treasuryAssociatedTokenMint: PublicKey,
    allocationAssigned: number,
    streamName = '',
  ): Promise<Transaction> {
    if (treasurer.equals(beneficiary)) {
      throw Error('Beneficiary can not be the same Treasurer');
    }

    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }
    if (
      treasuryInfo.associatedToken !== treasuryAssociatedTokenMint.toBase58()
    ) {
      throw Error('Incorrect associated token address');
    }

    // Get the template
    const [template] = await findStreamTemplateAddress(
      treasury,
      this.program.programId,
    );
    const templateInfo = await getStreamTemplate(this.program, template);
    if (!templateInfo) {
      throw Error("Stream template doesn't exist");
    }

    // Calculate rate amount
    const rateAmount =
      (allocationAssigned * (1 - templateInfo.cliffVestPercent / 1_000_000)) /
      templateInfo.durationNumberOfUnits;

    // Get the treasury token account
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      treasury,
      true,
    );

    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      Constants.FEE_TREASURY,
      true,
    );

    // Create Stream
    const tx = this.program.transaction.createStreamWithTemplate(
      LATEST_IDL_FILE_VERSION,
      streamName,
      new BN(rateAmount),
      new BN(allocationAssigned),
      {
        accounts: {
          payer: payer,
          template,
          treasurer: treasurer,
          treasury: treasury,
          treasuryToken: treasuryToken,
          associatedToken: treasuryAssociatedTokenMint,
          beneficiary: beneficiary,
          stream,
          feeTreasury: Constants.FEE_TREASURY,
          feeTreasuryToken: feeTreasuryToken,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      },
    );

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getLatestBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  public async createStreams(
    payer: PublicKey,
    treasurer: PublicKey,
    treasury: PublicKey,
    beneficiaries: Beneficiary[],
    associatedToken: PublicKey,
    allocationAssigned: number,
    rateAmount?: number,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: number,
    cliffVestPercent?: number,
    feePayedByTreasurer?: boolean,
  ): Promise<Transaction[]> {
    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    if (treasuryInfo.associatedToken !== associatedToken.toBase58()) {
      throw Error('Incorrect associated token address');
    }

    // Get the treasury token account
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      associatedToken,
      treasury,
      true,
    );

    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      associatedToken,
      Constants.FEE_TREASURY,
      true,
    );

    const now = new Date();
    const startDate =
      startUtc && startUtc.getTime() >= now.getTime() ? startUtc : now;
    const startUtcInSeconds = parseInt((startDate.getTime() / 1000).toString());
    const cliffVestPercentValue = cliffVestPercent
      ? cliffVestPercent * Constants.CLIFF_PERCENT_NUMERATOR
      : 0;

    // Create Streams
    const txs: Transaction[] = [];
    const group = (size: number, data: any) => {
      const result = [];
      for (let i = 0; i < data.length; i += size) {
        result.push(data.slice(i, i + size));
      }
      return result;
    };

    for (const groupItem of group(3, beneficiaries)) {
      const signers: Signer[] = [];
      const ixs: TransactionInstruction[] = [];

      for (const beneficiary of groupItem) {
        if (beneficiary.address.toBase58() === treasurer.toBase58()) {
          continue;
        }

        const streamAccount = Keypair.generate();
        const ix = this.program.instruction.createStream(
          LATEST_IDL_FILE_VERSION,
          beneficiary.streamName,
          new BN(startUtcInSeconds),
          new BN(rateAmount as number),
          new BN(rateIntervalInSeconds as number),
          new BN(allocationAssigned),
          new BN(cliffVestAmount as number),
          new BN(cliffVestPercentValue),
          feePayedByTreasurer ?? false,
          {
            accounts: {
              payer: payer,
              treasurer: treasurer,
              treasury: treasury,
              treasuryToken: treasuryToken,
              associatedToken: associatedToken,
              beneficiary: beneficiary.address,
              stream: streamAccount.publicKey,
              feeTreasury: Constants.FEE_TREASURY,
              feeTreasuryToken: feeTreasuryToken,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          },
        );

        ixs.push(ix);
        signers.push(streamAccount);
      }

      const tx = new Transaction().add(...ixs);
      tx.feePayer = payer;
      const { blockhash } = await this.connection.getRecentBlockhash(
        (this.commitment as Commitment) || 'finalized',
      );
      tx.recentBlockhash = blockhash;
      tx.partialSign(...signers);

      txs.push(tx);
    }

    return txs;
  }

  public async fundStream(
    payer: PublicKey,
    contributor: PublicKey,
    treasury: PublicKey,
    stream: PublicKey,
    amount: number,
    autoWSol = false,
  ): Promise<Transaction> {
    const ixs: TransactionInstruction[] = [];
    const txSigners: Signer[] = [];

    if (!amount) {
      throw Error('Amount should be greater than 0');
    }

    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error('Treasury account not found');
    }

    const streamInfo = (await this.getStream(stream)) as Stream;

    if (!streamInfo) {
      throw Error('Stream account not found');
    }

    if (treasuryInfo.associatedToken !== streamInfo.associatedToken) {
      throw Error('Invalid stream beneficiary associated token');
    }

    const treasuryAssociatedTokenMint = new PublicKey(
      treasuryInfo.associatedToken as string,
    );
    const treasuryMint = new PublicKey(treasuryInfo.mint as string);
    const contributorToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      contributor,
      true,
    );

    const contributorTokenInfo = await this.connection.getAccountInfo(
      contributorToken,
      'recent',
    ); // TODO: standarized commitment
    await this.ensureAutoWrapSolInstructions(
      autoWSol,
      amount,
      contributor,
      contributorToken,
      contributorTokenInfo,
      ixs,
      txSigners,
    );

    const contributorTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryMint,
      contributor,
      true,
    );

    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      treasury,
      true,
    );

    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      Constants.FEE_TREASURY,
      true,
    );

    ixs.push(
      this.program.instruction.addFunds(
        LATEST_IDL_FILE_VERSION,
        new BN(amount),
        {
          accounts: {
            payer: payer,
            contributor: contributor,
            contributorToken: contributorToken,
            treasury: treasury,
            treasuryToken: treasuryToken,
            associatedToken: treasuryAssociatedTokenMint,
            feeTreasury: Constants.FEE_TREASURY,
            feeTreasuryToken: feeTreasuryToken,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        },
      ),
    );

    // calculate fee if are payed by treasury to deduct it from the amount
    let allocationAmountBn = new BN(amount);

    if (streamInfo.feePayedByTreasurer) {
      allocationAmountBn = await getValidTreasuryAllocation(
        this.program.provider.connection,
        treasuryInfo,
        amount,
      );
    }

    ixs.push(
      this.program.instruction.allocate(
        LATEST_IDL_FILE_VERSION,
        allocationAmountBn,
        {
          accounts: {
            payer: payer,
            treasurer: contributor,
            treasury: treasury,
            treasuryToken: treasuryToken,
            associatedToken: treasuryAssociatedTokenMint,
            stream: stream,
            feeTreasury: Constants.FEE_TREASURY,
            feeTreasuryToken: feeTreasuryToken,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        },
      ),
    );

    const tx = new Transaction().add(...ixs);
    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (txSigners.length > 0) {
      tx.partialSign(...txSigners);
    }

    return tx;
  }

  public async addFunds(
    payer: PublicKey,
    contributor: PublicKey,
    treasury: PublicKey,
    mint: PublicKey, // it can be the special value: Constants.SOL_MINT
    amount: number,
  ): Promise<Transaction> {
    if (!amount) {
      throw Error('Amount should be greater than 0');
    }

    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error('Treasury account not found');
    }

    let autoWSol = false;
    if (mint.equals(Constants.SOL_MINT)) {
      mint = NATIVE_WSOL_MINT;
      autoWSol = true;
    }

    const treasuryMint = new PublicKey(treasuryInfo.mint as string);
    const contributorToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      contributor,
      true,
    );

    const contributorTokenInfo = await this.connection.getAccountInfo(
      contributorToken,
      'recent',
    );

    const ixs: TransactionInstruction[] = [];
    const txSigners: Signer[] = [];

    await this.ensureAutoWrapSolInstructions(
      autoWSol,
      amount,
      contributor,
      contributorToken,
      contributorTokenInfo,
      ixs,
      txSigners,
    );

    const contributorTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryMint,
      contributor,
      true,
    );

    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      treasury,
      true,
    );

    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      Constants.FEE_TREASURY,
      true,
    );

    ixs.push(
      this.program.instruction.addFunds(
        LATEST_IDL_FILE_VERSION,
        new BN(amount),
        {
          accounts: {
            payer: payer,
            contributor: contributor,
            contributorToken: contributorToken,
            treasury: treasury,
            treasuryToken: treasuryToken,
            associatedToken: mint,
            feeTreasury: Constants.FEE_TREASURY,
            feeTreasuryToken: feeTreasuryToken,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        },
      ),
    );

    const tx = new Transaction().add(...ixs);

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (txSigners.length > 0) {
      tx.partialSign(...txSigners);
    }

    return tx;
  }

  public async allocate(
    payer: PublicKey,
    treasurer: PublicKey,
    treasury: PublicKey,
    stream: PublicKey,
    amount: number,
  ): Promise<Transaction> {
    if (!amount) {
      throw Error('Amount should be greater than 0');
    }

    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error('Treasury account not found');
    }

    if (treasuryInfo.treasurer !== treasurer.toBase58()) {
      throw Error('Invalid treasurer');
    }

    const streamInfo = (await this.getStream(stream)) as Stream;

    if (!streamInfo) {
      throw Error('Stream account not found');
    }

    if (treasuryInfo.associatedToken !== streamInfo.associatedToken) {
      throw Error('Invalid stream beneficiary associated token');
    }

    const associatedToken = new PublicKey(
      treasuryInfo.associatedToken as string,
    );
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      associatedToken,
      treasury,
      true,
    );

    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      associatedToken,
      Constants.FEE_TREASURY,
      true,
    );

    const tx = this.program.transaction.allocate(
      LATEST_IDL_FILE_VERSION,
      new BN(amount),
      {
        accounts: {
          payer: payer,
          treasurer: treasurer,
          treasury: treasury,
          treasuryToken: treasuryToken,
          associatedToken: associatedToken,
          stream: stream,
          feeTreasury: Constants.FEE_TREASURY,
          feeTreasuryToken: feeTreasuryToken,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      },
    );

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  public async withdraw(
    payer: PublicKey,
    stream: PublicKey,
    amount: number,
    autoWSol = false,
  ): Promise<Transaction> {
    if (!amount) {
      throw Error('Amount should be greater than 0');
    }

    const streamInfo = (await this.getStream(stream)) as Stream;

    if (!streamInfo) {
      throw Error("Stream doesn't exist");
    }

    if (streamInfo.status === STREAM_STATUS.Schedule) {
      throw Error('Stream has not started');
    }

    if (streamInfo.withdrawableAmount === 0) {
      throw Error('Stream withdrawable amount is zero');
    }

    const beneficiary = new PublicKey(streamInfo.beneficiary as string);
    // Check for the beneficiary associated token account
    const treasuryAssociatedTokenMint = new PublicKey(
      streamInfo.associatedToken as string,
    );
    const beneficiaryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      beneficiary,
      true,
    );

    const treasury = new PublicKey(streamInfo.treasury as PublicKey);
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      treasury,
      true,
    );

    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      Constants.FEE_TREASURY,
      true,
    );

    const ixs: TransactionInstruction[] = [];
    const txSigners: Signer[] = [];

    const withdrawIx = this.program.instruction.withdraw(
      LATEST_IDL_FILE_VERSION,
      new BN(amount),
      {
        accounts: {
          payer: payer,
          beneficiary: beneficiary,
          beneficiaryToken: beneficiaryToken,
          associatedToken: treasuryAssociatedTokenMint,
          treasury: treasury,
          treasuryToken: treasuryToken,
          stream: stream,
          feeTreasury: Constants.FEE_TREASURY,
          feeTreasuryToken: feeTreasuryToken,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      },
    );
    ixs.push(withdrawIx);

    // unwrap all on exit
    if (autoWSol && treasuryAssociatedTokenMint.equals(NATIVE_WSOL_MINT)) {
      const closeWSolIx = Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        beneficiaryToken,
        beneficiary,
        beneficiary,
        [],
      );
      ixs.push(closeWSolIx);
    }

    const tx = new Transaction().add(...ixs);

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (txSigners.length > 0) {
      tx.partialSign(...txSigners);
    }

    return tx;
  }

  public async pauseStream(
    payer: PublicKey,
    treasurer: PublicKey,
    stream: PublicKey,
  ): Promise<Transaction> {
    const streamInfo = (await this.getStream(stream)) as Stream;

    if (!streamInfo) {
      throw Error("Stream doesn't exist");
    }

    const treasury = new PublicKey(streamInfo.treasury as string);
    const treasuryInfo = await this.getTreasury(treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    const associatedToken = new PublicKey(streamInfo.associatedToken as string);

    const tx = this.program.transaction.pauseStream(LATEST_IDL_FILE_VERSION, {
      accounts: {
        initializer: treasurer, // TODO: payer = payer, inititlizer = treasurer (change initializer to treasurer in MSP)
        treasury: treasury,
        stream: stream,
      },
    });

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  public async resumeStream(
    payer: PublicKey,
    treasurer: PublicKey,
    stream: PublicKey,
  ): Promise<Transaction> {
    const streamInfo = (await this.getStream(stream)) as Stream;

    if (!streamInfo) {
      throw Error("Stream doesn't exist");
    }

    const treasury = new PublicKey(streamInfo.treasury as string);
    const treasuryInfo = await this.getTreasury(treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    const associatedToken = new PublicKey(streamInfo.associatedToken as string);

    const tx = this.program.transaction.resumeStream(LATEST_IDL_FILE_VERSION, {
      accounts: {
        initializer: treasurer, // TODO: payer = payer, inititlizer = treasurer (change initializer to treasurer in MSP)
        treasury: treasury,
        stream: stream,
      },
    });

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  public async closeStream(
    payer: PublicKey,
    destination: PublicKey,
    stream: PublicKey,
    autoCloseTreasury = false,
    autoWSol = false,
  ): Promise<Transaction> {
    const streamInfo = (await this.getStream(stream)) as Stream;

    if (!streamInfo) {
      throw Error("Stream doesn't exist");
    }

    const treasury = new PublicKey(streamInfo.treasury as string);
    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    if (streamInfo.associatedToken !== treasuryInfo.associatedToken) {
      throw Error('Invalid stream beneficiary associated token');
    }

    const treasurer = new PublicKey(streamInfo.treasurer as string);
    const beneficiary = new PublicKey(streamInfo.beneficiary as string);
    const treasuryAssociatedTokenMint = new PublicKey(
      streamInfo.associatedToken as string,
    );
    const beneficiaryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      beneficiary,
      true,
    );

    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      treasury,
      true,
    );

    // Get the money streaming program operations token account or create a new one
    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      Constants.FEE_TREASURY,
      true,
    );

    const ixs: TransactionInstruction[] = [
      this.program.instruction.closeStream(LATEST_IDL_FILE_VERSION, {
        accounts: {
          payer: payer,
          treasurer: treasurer,
          beneficiary: beneficiary,
          beneficiaryToken: beneficiaryToken,
          associatedToken: treasuryAssociatedTokenMint,
          treasury: treasury,
          treasuryToken: treasuryToken,
          stream: stream,
          feeTreasury: Constants.FEE_TREASURY,
          feeTreasuryToken: feeTreasuryToken,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }),
    ];

    if (autoCloseTreasury) {
      const treasuryMint = new PublicKey(treasuryInfo.mint as string);
      const treasurerTreasuryToken = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        treasuryMint,
        treasurer,
        true,
      );

      const destinationToken = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        treasuryAssociatedTokenMint,
        destination,
        true,
      );

      ixs.push(
        this.program.instruction.closeTreasury(LATEST_IDL_FILE_VERSION, {
          accounts: {
            payer: payer,
            treasurer: treasurer,
            destinationAuthority: destination,
            destinationTokenAccount: destinationToken,
            associatedToken: treasuryAssociatedTokenMint,
            treasury: treasury,
            treasuryToken: treasuryToken,
            feeTreasury: Constants.FEE_TREASURY,
            feeTreasuryToken: feeTreasuryToken,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }),
      );

      // unwrap all on exit and only if destination is also a signer
      if (
        autoWSol &&
        treasuryAssociatedTokenMint.equals(NATIVE_WSOL_MINT) &&
        destination.equals(treasurer)
      ) {
        const closeWSolIx = Token.createCloseAccountInstruction(
          TOKEN_PROGRAM_ID,
          destinationToken,
          destination,
          destination,
          [],
        );
        ixs.push(closeWSolIx);
      }
    }

    const tx = new Transaction().add(...ixs);
    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  public async closeTreasury(
    payer: PublicKey,
    destination: PublicKey,
    treasury: PublicKey,
    autoWSol = false,
  ): Promise<Transaction> {
    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error('Treasury not found');
    }

    const treasurer = new PublicKey(treasuryInfo.treasurer as string);
    const treasuryMint = new PublicKey(treasuryInfo.mint as string);
    const treasurerTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryMint,
      treasurer,
      true,
    );

    let treasuryAssociatedTokenMint = new PublicKey(NATIVE_WSOL_MINT);
    const treasuryAssociatedToken = treasuryInfo.associatedToken as string;

    if (treasuryAssociatedToken !== '') {
      treasuryAssociatedTokenMint = new PublicKey(treasuryAssociatedToken);
    }

    const destinationToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      destination,
      true,
    );

    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      treasury,
      true,
    );

    // Get the money streaming program operations token account or create a new one
    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      Constants.FEE_TREASURY,
      true,
    );

    const ixs: TransactionInstruction[] = [];
    const txSigners: Signer[] = [];

    const closeTreasuryIx = this.program.instruction.closeTreasury(
      LATEST_IDL_FILE_VERSION,
      {
        accounts: {
          payer: payer,
          treasurer: treasurer,
          destinationAuthority: destination,
          destinationTokenAccount: destinationToken,
          associatedToken: treasuryAssociatedTokenMint,
          treasury: treasury,
          treasuryToken: treasuryToken,
          feeTreasury: Constants.FEE_TREASURY,
          feeTreasuryToken: feeTreasuryToken,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      },
    );
    ixs.push(closeTreasuryIx);

    if (
      autoWSol &&
      treasuryAssociatedTokenMint.equals(NATIVE_WSOL_MINT) &&
      destination.equals(treasurer) // the ata authority needs to be signer for the unwrap to work
    ) {
      const closeWSolIx = Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        destinationToken,
        destination,
        destination,
        [],
      );
      ixs.push(closeWSolIx);
    }

    const tx = new Transaction().add(...ixs);

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (txSigners.length > 0) {
      tx.partialSign(...txSigners);
    }

    return tx;
  }

  public async refreshTreasuryData(
    payer: PublicKey,
    treasurer: PublicKey,
    treasury: PublicKey,
  ): Promise<Transaction> {
    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    const associatedToken = new PublicKey(
      treasuryInfo.associatedToken as string,
    );
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      associatedToken,
      treasury,
      true,
    );

    // get treasury streams amount
    const memcmpFilters = [
      { memcmp: { offset: 8 + 170, bytes: treasury.toBase58() } },
    ];
    const totalStreams = (await this.program.account.stream.all(memcmpFilters))
      .length;

    const tx = this.program.transaction.refreshTreasuryData(
      LATEST_IDL_FILE_VERSION,
      {
        accounts: {
          treasurer: treasurer,
          associatedToken: associatedToken,
          treasury: treasury,
          treasuryToken: treasuryToken,
        },
      },
    );

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  public async transferStream(
    beneficiary: PublicKey,
    newBeneficiary: PublicKey,
    stream: PublicKey,
  ): Promise<Transaction> {
    const streamInfo = (await this.getStream(stream)) as Stream;

    if (!streamInfo) {
      throw Error("Stream doesn't exist");
    }

    const beneficiaryAddress = new PublicKey(streamInfo.beneficiary as string);

    if (!beneficiary.equals(beneficiaryAddress)) {
      throw Error('Not authorized');
    }

    const tx = this.program.transaction.transferStream(
      LATEST_IDL_FILE_VERSION,
      newBeneficiary,
      {
        accounts: {
          beneficiary: beneficiaryAddress,
          stream: stream,
          feeTreasury: Constants.FEE_TREASURY,
          systemProgram: SystemProgram.programId,
        },
      },
    );

    tx.feePayer = beneficiary;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  public async createStreamFromPda(
    payer: PublicKey,
    treasurer: PublicKey,
    treasury: PublicKey,
    beneficiary: PublicKey,
    associatedToken: PublicKey,
    stream: PublicKey,
    streamName: string,
    allocationAssigned: number,
    rateAmount?: number,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: number,
    cliffVestPercent?: number,
    feePayedByTreasurer?: boolean,
  ): Promise<any> {
    if (treasurer.equals(beneficiary)) {
      throw Error('Beneficiary can not be the same Treasurer');
    }

    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    if (treasuryInfo.associatedToken !== associatedToken.toBase58()) {
      throw Error('Incorrect associated token address');
    }

    // Get the treasury token account
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      associatedToken,
      treasury,
      true,
    );

    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      associatedToken,
      Constants.FEE_TREASURY,
      true,
    );

    const cliffVestPercentValue = cliffVestPercent
      ? cliffVestPercent * Constants.CLIFF_PERCENT_NUMERATOR
      : 0;
    const now = new Date();
    const startDate =
      startUtc && startUtc.getTime() >= now.getTime() ? startUtc : now;
    const startUtcInSeconds = parseInt((startDate.getTime() / 1000).toString());

    // Create Stream
    const tx = this.program.transaction.createStream(
      LATEST_IDL_FILE_VERSION,
      streamName,
      new BN(startUtcInSeconds),
      new BN(rateAmount as number),
      new BN(rateIntervalInSeconds as number),
      new BN(allocationAssigned),
      new BN(cliffVestAmount as number),
      new BN(cliffVestPercentValue),
      feePayedByTreasurer ?? false,
      {
        accounts: {
          payer: payer,
          treasurer: treasurer,
          treasury: treasury,
          treasuryToken: treasuryToken,
          associatedToken: associatedToken,
          beneficiary: beneficiary,
          stream: stream,
          feeTreasury: Constants.FEE_TREASURY,
          feeTreasuryToken: feeTreasuryToken,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      },
    );

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  public async createStreamsFromPda(
    payer: PublicKey,
    treasurer: PublicKey,
    treasury: PublicKey,
    associatedToken: PublicKey,
    streams: StreamBeneficiary[],
    allocationAssigned: number,
    rateAmount?: number,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: number,
    cliffVestPercent?: number,
    feePayedByTreasurer?: boolean,
  ): Promise<Transaction[]> {
    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    if (treasuryInfo.associatedToken !== associatedToken.toBase58()) {
      throw Error('Incorrect associated token address');
    }

    // Get the treasury token account
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      associatedToken,
      treasury,
      true,
    );

    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      associatedToken,
      Constants.FEE_TREASURY,
      true,
    );

    const cliffVestPercentValue = cliffVestPercent
      ? cliffVestPercent * Constants.CLIFF_PERCENT_NUMERATOR
      : 0;
    const now = new Date();
    const startDate =
      startUtc && startUtc.getTime() >= now.getTime() ? startUtc : now;
    const startUtcInSeconds = parseInt((startDate.getTime() / 1000).toString());

    // Create Streams
    const txs: Transaction[] = [];
    const group = (size: number, data: any) => {
      const result = [];
      for (let i = 0; i < data.length; i += size) {
        result.push(data.slice(i, i + size));
      }
      return result;
    };

    for (const groupItem of group(3, streams)) {
      const ixs: TransactionInstruction[] = [];

      for (const streamBeneficiary of groupItem) {
        if (streamBeneficiary.address.toBase58() === treasurer.toBase58()) {
          continue;
        }

        const ix = this.program.instruction.createStream(
          LATEST_IDL_FILE_VERSION,
          streamBeneficiary.streamName,
          new BN(startUtcInSeconds),
          new BN(rateAmount as number),
          new BN(rateIntervalInSeconds as number),
          new BN(allocationAssigned),
          new BN(cliffVestAmount as number),
          new BN(cliffVestPercentValue),
          feePayedByTreasurer ?? false,
          {
            accounts: {
              payer: payer,
              treasurer: treasurer,
              treasury: treasury,
              treasuryToken: treasuryToken,
              associatedToken: associatedToken,
              beneficiary: streamBeneficiary.beneficiary,
              stream: streamBeneficiary.address,
              feeTreasury: Constants.FEE_TREASURY,
              feeTreasuryToken: feeTreasuryToken,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          },
        );

        ixs.push(ix);
      }

      const tx = new Transaction().add(...ixs);
      tx.feePayer = payer;
      const { blockhash } = await this.connection.getRecentBlockhash(
        (this.commitment as Commitment) || 'finalized',
      );
      tx.recentBlockhash = blockhash;

      txs.push(tx);
    }

    return txs;
  }

  public async treasuryWithdraw(
    payer: PublicKey,
    destination: PublicKey,
    treasury: PublicKey,
    amount: number,
    autoWSol = false,
  ): Promise<Transaction> {
    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error('Treasury not found');
    }

    const treasurer = new PublicKey(treasuryInfo.treasurer as string);
    const treasuryAssociatedTokenMint = new PublicKey(
      treasuryInfo.associatedToken as string,
    );
    const destinationToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      destination,
      true,
    );

    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      treasury,
      true,
    );

    // Get the money streaming program operations token account or create a new one
    const feeTreasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      Constants.FEE_TREASURY,
      true,
    );

    const ixs: TransactionInstruction[] = [];
    const txSigners: Signer[] = [];

    const treasuryWithdrawIx = this.program.instruction.treasuryWithdraw(
      LATEST_IDL_FILE_VERSION,
      new BN(amount),
      {
        accounts: {
          payer: payer,
          treasurer: treasurer,
          destinationAuthority: destination,
          destinationTokenAccount: destinationToken,
          associatedToken: treasuryAssociatedTokenMint,
          treasury: treasury,
          treasuryToken: treasuryToken,
          feeTreasury: Constants.FEE_TREASURY,
          feeTreasuryToken: feeTreasuryToken,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      },
    );
    ixs.push(treasuryWithdrawIx);

    if (
      autoWSol &&
      treasuryAssociatedTokenMint.equals(NATIVE_WSOL_MINT) &&
      destination.equals(treasurer) // the ata authority needs to be signer for the unwrap to work
    ) {
      const closeWSolIx = Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        destinationToken,
        destination,
        destination,
        [],
      );
      ixs.push(closeWSolIx);
    }

    const tx = new Transaction().add(...ixs);

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getRecentBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (txSigners.length > 0) {
      tx.partialSign(...txSigners);
    }

    return tx;
  }

  private async ensureAutoWrapSolInstructions(
    autoWSol: boolean,
    amountInLamports: number,
    owner: PublicKey,
    ownerWSolTokenAccount: PublicKey,
    ownerWSolTokenAccountInfo: AccountInfo<Buffer> | null,
    instructions: TransactionInstruction[],
    signers: Signer[],
  ) {
    if (autoWSol) {
      const [wrapSolIxs, wrapSolSigners] = await createWrapSolInstructions(
        this.connection,
        amountInLamports,
        owner,
        ownerWSolTokenAccount,
        ownerWSolTokenAccountInfo,
      );
      if (wrapSolIxs && wrapSolIxs.length > 0) {
        instructions.push(...wrapSolIxs);
        if (wrapSolSigners && wrapSolSigners.length > 0)
          signers.push(...wrapSolSigners);
      }
    } else {
      if (!ownerWSolTokenAccountInfo) {
        throw Error('Sender token account not found');
      }
    }
  }

  /**
   * Validates the given address
   * @param address Solana public address
   * @returns one of the WARNING_TYPES as result
   */
  public async checkAddressForWarnings(
    address: string,
  ): Promise<WARNING_TYPES> {
    let pkAddress: PublicKey;
    //check the address validity
    try {
      pkAddress = new PublicKey(address);
    } catch (error) {
      console.warn(`Invalid Solana address: ${address}`);
      return WARNING_TYPES.INVALID_ADDRESS;
    }

    //check address PDA
    const isAddressOnCurve = PublicKey.isOnCurve(pkAddress);
    if (isAddressOnCurve) {
      return WARNING_TYPES.WARNING;
    }

    //check address exists and owned by system program
    try {
      const accountInfo = await this.connection.getAccountInfo(pkAddress);
      if (!accountInfo || !accountInfo.owner.equals(SystemProgram.programId)) {
        return WARNING_TYPES.WARNING;
      }
    } catch (error) {
      return WARNING_TYPES.WARNING;
    }

    return WARNING_TYPES.NO_WARNING;
  }
}
