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
  u64,
} from '@solana/spl-token';
import { BN, Program } from '@project-serum/anchor';

import { Msp } from './msp_idl_005';

/**
 * MSP
 */
import {
  Category,
  ListStreamParams,
  Stream,
  StreamEventData,
  StreamTemplate,
  STREAM_STATUS,
  SubCategory,
  TimeUnit,
  Treasury,
  TreasuryType,
  VestingTreasuryActivity,
  VestingTreasuryActivityRaw,
} from './types';
import {
  createProgram,
  createWrapSolInstructions,
  findStreamTemplateAddress,
  getStream,
  getStreamCached,
  getStreamEventData,
  getStreamTemplate,
  getTreasury,
  getValidTreasuryAllocation,
  listStreamActivity,
  listStreams,
  listStreamsCached,
  listVestingTreasuryActivity,
} from './utils';
import { Constants, WARNING_TYPES, LATEST_IDL_FILE_VERSION } from './constants';
import { Beneficiary, listTreasuries, StreamBeneficiary } from '.';
import { u64Number } from './u64n';

/**
 * API class with functions to interact with the Money Streaming Program using Solana Web3 JS API
 */
export class MSP {
  private connection: Connection;
  private program: Program<Msp>;
  private commitment: Commitment | ConnectionConfig | undefined;

  /**
   * Create a Streaming API object
   *
   * @param cluster The solana cluster endpoint used for the connecton
   */
  constructor(
    rpcUrl: string,
    programId: string,
    commitment: Commitment | string = 'finalized',
  ) {
    this.commitment = commitment as Commitment;
    this.connection = new Connection(
      rpcUrl,
      (this.commitment as Commitment) || 'finalized',
    );
    this.program = createProgram(this.connection, programId);
  }

  public async getStream(id: PublicKey): Promise<Stream | null> {
    return getStream(this.program, id);
  }

  public async getStreamRaw(id: PublicKey): Promise<StreamEventData | null> {
    return getStreamEventData(this.program, id);
  }

  public async refreshStream(
    streamInfo: any,
    hardUpdate = false,
  ): Promise<any> {
    const copyStreamInfo = Object.assign({}, streamInfo);

    if (hardUpdate) {
      const streamId =
        typeof copyStreamInfo.id === 'string'
          ? new PublicKey(copyStreamInfo.id)
          : (copyStreamInfo.id as PublicKey);

      return await getStream(this.program, streamId);
    }

    return getStreamCached(copyStreamInfo);
  }

  public async listStreams({
    treasurer,
    treasury,
    beneficiary,
    category = undefined,
    subCategory = undefined,
  }: ListStreamParams): Promise<Stream[]> {
    return listStreams(
      this.program,
      treasurer,
      treasury,
      beneficiary,
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
  ): Promise<Stream[]> {
    if (hardUpdate) {
      return await listStreams(
        this.program,
        treasurer,
        treasury,
        beneficiary,
      );
    }

    return listStreamsCached(streamInfoList);
  }

  /**
   *
   * @param id The address of the stream
   * @param before The signature to start searching backwards from.
   * @param limit The max amount of elements to retrieve
   * @param commitment Commitment to query the stream activity
   * @returns
   */
  public async listStreamActivity(
    id: PublicKey,
    before: string,
    limit = 10,
    commitment?: Finality | undefined,
  ): Promise<any[]> { // TODO: Remove any
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
    );
  }

  public async getTreasury(
    id: PublicKey,
    commitment?: Commitment | undefined,
  ): Promise<Treasury> {
    const accountInfo = await this.program.account.treasury.getAccountInfo(
      id,
      commitment,
    );

    if (!accountInfo) {
      throw Error("Treasury doesn't exists");
    }

    return getTreasury(this.program, id);
  }

  public async listTreasuries(
    treasurer: PublicKey | undefined,
    excludeAutoClose?: boolean,
    category?: Category,
    subCategory?: SubCategory,
  ): Promise<Treasury[]> {
    return listTreasuries(
      this.program,
      treasurer,
      excludeAutoClose,
      category,
      subCategory,
    );
  }

  public async getStreamTemplate(
    treasury: PublicKey,
  ): Promise<StreamTemplate> {
    const [template] = await findStreamTemplateAddress(
      treasury,
      this.program.programId,
    );
    return getStreamTemplate(this.program, template);
  }

  /**
   * Performs simple transfer of tokens to a beneficiary
   * @param sender {PublicKey} - The public key of the wallet approving the transaction
   * @param beneficiary {PublicKey} - The public key of the beneficiary
   * @param mint {PublicKey} - The public key of the token to be sent
   * @param amount {string | number} - The token amount to be allocated to the stream. Use BN.toString() or BigNumber.toString() for best compatibility
   */
  public async transfer(
    sender: PublicKey,
    beneficiary: PublicKey,
    mint: PublicKey,
    amount: string | number,  // Allow both types for compatibility
  ): Promise<Transaction> {
    const ixs: TransactionInstruction[] = [];
    const amountBN = new u64(amount);

    if (mint.equals(Constants.SOL_MINT)) {
      ixs.push(
        SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: beneficiary,
          lamports: amountBN.toNumber(),
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
          amountBN,
        ),
      );
    }

    const tx = new Transaction().add(...ixs);
    tx.feePayer = sender;
    const { blockhash } = await this.connection.getLatestBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  /**
   * Schedules a transfer as a stream without rate.
   * @param treasurer {PublicKey} - The public key of the wallet approving the transaction.
   * @param beneficiary {PublicKey} - The public key of the beneficiary.
   * @param mint {PublicKey} - The public key of the token to be sent.
   * @param amount {string | number} - The token amount to be allocated to the stream. Use BN.toString() or BigNumber.toString() for best compatibility and to overcome javascript number size limitation when using large amounts.
   * @param startUtc {Date} - The date on which the transfer will be executed.
   * @param streamName {string} - The name of the transfer.
   * @param feePayedByTreasurer {boolean} - Decides if protocol fees will be paid by the treasurer or by the beneficiary at withdraw time.
   * @param category {Category} - Optional. The category of the transfer. It should be Category.default for all transfers.
   * @param subCategory {SubCategory} - Optional. The subcategory. It should be SubCategory.default for all transfers.
   */
  public async scheduledTransfer(
    treasurer: PublicKey,
    beneficiary: PublicKey,
    mint: PublicKey,
    amount: string | number,
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
      amount, // new BN(amount).toNumber(),
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

    // Get the treasury token account
    const treasuryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      treasury,
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
    const { blockhash } = await this.connection.getLatestBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (txSigners.length > 0) {
      tx.partialSign(...txSigners);
    }

    return tx;
  }

  /**
   * Creates a recurring payment at a given rate to start immediately or scheduled
   * @param treasurer {PublicKey} - The public key of the wallet approving the transaction.
   * @param beneficiary {PublicKey} - The public key of the beneficiary.
   * @param mint {PublicKey} - The public key of the token to be sent.
   * @param streamName {string} - The name of the transfer.
   * @param allocationAssigned {string | number} - The token amount to be allocated to the stream. Use BN.toString() or BigNumber.toString() for best compatibility and to overcome javascript number size limitation when using large amounts.
   * @param rateAmount {string | number} - The rate at which the token will be sent. Use BN.toString() or BigNumber.toString() for best compatibility and to overcome javascript number size limitation when using large amounts.
   * @param rateIntervalInSeconds {number} - The number of seconds for the send rate (minute=60, hour=3600, day=86400 and so on)
   * @param startUtc {Date} - The date on which the transfer will be executed.
   * @param cliffVestAmount {string | number} - The cliff amount to be released at start date. Should be 0 for streamPayment.
   * @param cliffVestPercent {number} - The cliff percent of the total amount to be released at start date. Should be 0 for streamPayment.
   * @param feePayedByTreasurer {boolean} - Decides if protocol fees will be paid by the treasurer or by the beneficiary at withdraw time.
   * @param category {Category} - Optional. The category of the transfer. It should be Category.default for all transfers.
   * @param subCategory {SubCategory} - Optional. The subcategory. It should be SubCategory.default for all transfers.
   */
  public async streamPayment(
    treasurer: PublicKey,
    beneficiary: PublicKey,
    mint: PublicKey,
    streamName: string,
    allocationAssigned: string | number,
    rateAmount?: string | number,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: string | number,
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

    const slot = await this.connection.getSlot(
      (this.commitment as Commitment) || 'finalized',
    );
    const slotBuffer = new u64Number(slot).toBuffer();
    const treasurySeeds = [treasurer.toBuffer(), slotBuffer];
    const [treasury] = await PublicKey.findProgramAddress(
      treasurySeeds,
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
      new BN(allocationAssigned),
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

    const cliffVestPercentValue = cliffVestPercent
      ? cliffVestPercent * Constants.CLIFF_PERCENT_NUMERATOR
      : 0;

    // Create Stream
    ixs.push(
      this.program.instruction.createStream(
        LATEST_IDL_FILE_VERSION,
        streamName,
        new BN(startUtcInSeconds),
        new BN(rateAmount || 0), // rate amount units
        new BN(rateIntervalInSeconds || 0), // rate interval in seconds
        new BN(allocationAssigned), // allocation assigned
        new BN(cliffVestAmount || 0), // cliff vest amount
        new BN(cliffVestPercentValue), // cliff vest percent
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
    const { blockhash } = await this.connection.getLatestBlockhash(
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
    const { blockhash } = await this.connection.getLatestBlockhash(
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
    streamName: string,
    allocationAssigned: number | string,
    rateAmount?: number | string,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: number | string,
    cliffVestPercent?: number,
    feePayedByTreasurer?: boolean,
  ): Promise<Transaction> {
    const [tx] = await this.createStream2(
      payer,
      treasurer,
      treasury,
      beneficiary,
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
    streamName: string,
    allocationAssigned: number | string,
    rateAmount?: number | string,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: number | string,
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

    const treasuryAssociatedTokenMint = new PublicKey(
      treasuryInfo.associatedToken,
    );

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
      new BN(rateAmount || 0),
      new BN(rateIntervalInSeconds || 0),
      new BN(allocationAssigned),
      new BN(cliffVestAmount || 0),
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
    const { blockhash } = await this.connection.getLatestBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;
    tx.partialSign(...[streamAccount]);

    return [tx, streamAccount.publicKey];
  }

  /**
   * Creates a vesting contract and the stream template
   * @param payer {PublicKey} - The public key of the wallet approving the transaction
   * @param treasurer {PublicKey} - The public key of the contract treasurer
   * @param label {string} - The name of the vesting contract (up to 32 characters)
   * @param type {TreasuryType} - Locked or Open type of contract. Defaults to Locked
   * @param solFeePayedByTreasury {boolean} - Determines if the gas fees for contract operations will be paid from the contract account
   * @param treasuryAssociatedTokenMint {PublicKey} - The public key of the token to be vested.
   * @param numberOfDurationUnits {number} - The amount of durationUnit that comprises the vesting period (e.g. 3 months or 180 days)
   * @param durationUnit {TimeUnit} - The lapse in seconds for the send rate (minute=60, hour=3600, day=86400 and so on). @see TimeUnit TimeUnit enum for details.
   * @param fundingAmount {string | number} - The token amount to fund the account. Use BN.toString() or BigNumber.toString() for best compatibility and to overcome javascript number size limitation when using large amounts.
   * @param vestingCategory {SubCategory} - The category of the vesting contract for filtering purposes.
   * @param startUtc {Date} - The vesting contract start date.
   * @param cliffVestPercent {number} - The 0-100 cliff percent of the total amount to be released at start date. Use 0 to disable cliff.
   * @param feePayedByTreasurer {boolean} - Decides if protocol fees will be paid by the treasurer or by the beneficiary at withdraw time.
   */
  public async createVestingTreasury(
    payer: PublicKey,
    treasurer: PublicKey,
    label: string,
    type: TreasuryType,
    solFeePayedByTreasury: boolean,
    treasuryAssociatedTokenMint: PublicKey,
    numberOfDurationUnits: number,
    durationUnit: TimeUnit,
    fundingAmount: string | number,
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
      new BN(numberOfDurationUnits),
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
    const faBN = new BN(fundingAmount);
    if (faBN.gtn(0)) {
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
    const { blockhash } = await this.connection.getLatestBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (addFundsSigners.length > 0) {
      tx.partialSign(...addFundsSigners);
    }

    return [tx, treasury];
  }

  /**
   * This modifies values of vesting treasury
   * template if no streams have been created yet.
   */
  public async modifyVestingTreasuryTemplate(
    payer: PublicKey,
    treasurer: PublicKey,
    vestingTreasury: PublicKey,
    duration?: number,
    durationUnit?: TimeUnit,
    startUtc?: Date,
    cliffVestPercent?: number,
    feePayedByTreasurer?: boolean,
  ): Promise<Transaction> {
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
      throw Error("Template doesn't exist");
    }

    if (treasuryInfo.totalStreams > 0) {
      throw Error(
        'Cannot modify vesting treasury info after streams have been created',
      );
    }

    if (duration && !durationUnit) {
      throw Error('Duration unit is required');
    }

    if (durationUnit && !duration) {
      throw Error('Duration is required');
    }

    let updatedRateIntervalInSeconds: number =
      templateInfo.rateIntervalInSeconds;
    let updatedDuration: number = templateInfo.durationNumberOfUnits;
    if (duration && durationUnit) {
      updatedRateIntervalInSeconds = durationUnit as number;
      updatedDuration = duration;
    }

    let updatedClifPercentValue = templateInfo.cliffVestPercent;
    if (cliffVestPercent) {
      updatedClifPercentValue =
        cliffVestPercent * Constants.CLIFF_PERCENT_NUMERATOR;
    }

    let updatedStartUtcInSeconds: number = parseInt(
      (new Date(templateInfo.startUtc).getTime() / 1000).toString(),
    );
    if (startUtc) {
      const now = new Date();
      const startDate =
        startUtc && startUtc.getTime() >= now.getTime() ? startUtc : now;
      updatedStartUtcInSeconds = parseInt(
        (startDate.getTime() / 1000).toString(),
      );
    }

    let updatedFeePayedByTreasurer = templateInfo.feePayedByTreasurer;
    if (feePayedByTreasurer !== undefined) {
      updatedFeePayedByTreasurer = feePayedByTreasurer;
    }

    const tx = await this.program.methods
      .modifyStreamTemplate(
        LATEST_IDL_FILE_VERSION,
        new BN(updatedStartUtcInSeconds),
        new BN(updatedRateIntervalInSeconds),
        new BN(updatedDuration),
        new BN(updatedClifPercentValue),
        updatedFeePayedByTreasurer,
      )
      .accounts({
        payer: payer,
        template: templateAddress,
        treasurer: treasurer,
        treasury: vestingTreasury,
      })
      .transaction();

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getLatestBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  /**
   *
   * @param id The address of the treasury
   * @param before The signature to start searching backwards from.
   * @param limit The max amount of elements to retrieve
   * @param commitment Commitment to query the treasury activity
   * @returns
   */
  public async listVestingTreasuryActivity(
    id: PublicKey,
    before: string,
    limit = 10,
    commitment?: Finality | undefined,
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
  ): Promise<[BN, TimeUnit, BN]> {
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

    if (treasuryInfo.totalStreams === 0) {
      return [
        new BN(0),
        templateInfo.rateIntervalInSeconds as TimeUnit,
        new BN(0)
      ];
    }

    const streams = await listStreams(
      this.program,
      undefined,
      vestingTreasury,
      undefined,
      Category.vesting
    );

    let totalAllocation = new BN(0);
    let streamRate = new BN(0);
    
    for (const stream of streams) {
      totalAllocation = totalAllocation.add(stream.allocationAssigned)
      switch (stream.status) {
        case STREAM_STATUS.Paused:
        case STREAM_STATUS.Scheduled:
          continue;
      }
      if (stream.remainingAllocationAmount.lten(0)) {
        // all streamed
        continue;
      }

      const percentDenominator = new BN(Constants.CLIFF_PERCENT_DENOMINATOR);
      const allocationTotal = new BN(stream.allocationAssigned);
      const cliffAmount = allocationTotal
        .mul(new BN(templateInfo.cliffVestPercent))
        .div(percentDenominator);
      const allocationAfterCliff = allocationTotal.sub(cliffAmount);
      const rateAmount = allocationAfterCliff // TODO: Remove
        .div(new BN(templateInfo.durationNumberOfUnits));
      
      streamRate = streamRate.add(rateAmount);
    }

    return [
      streamRate,
      templateInfo.rateIntervalInSeconds as TimeUnit,
      totalAllocation,
    ];
  }

  /**
   * Creates a vesting stream based on the vesting contract template
   * @param payer {PublicKey} - The public key of the wallet approving the transaction
   * @param treasurer {PublicKey} - The public key of the contract treasurer
   * @param treasury {PublicKey} - The public key of the vesting contract
   * @param beneficiary {PublicKey} - The public key of the beneficiary
   * @param allocationAssigned {string | number} - The token amount to be allocated to the stream. Use BN.toString() or BigNumber.toString() for best compatibility
   * @param streamName {string} - The name of the string (up to 32 characters)
   */
  public async createStreamWithTemplate(
    payer: PublicKey,
    treasurer: PublicKey,
    treasury: PublicKey,
    beneficiary: PublicKey,
    allocationAssigned: string | number,
    streamName = '',
  ): Promise<[Transaction, PublicKey]> {

    if (treasurer.equals(beneficiary)) {
      throw Error('Beneficiary can not be the same Treasurer');
    }

    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }
    const treasuryAssociatedTokenMint = new PublicKey(
      treasuryInfo.associatedToken,
    );
    // Get the template
    const [template] = await findStreamTemplateAddress(
      treasury,
      this.program.programId,
    );
    const templateInfo = await getStreamTemplate(this.program, template);
    if (!templateInfo) {
      throw Error("Stream template doesn't exist");
    }

    const percentDenominator = new BN(Constants.CLIFF_PERCENT_DENOMINATOR);
    const allocationTotal = new BN(allocationAssigned);
    const cliffAmount = allocationTotal
      .mul(new BN(templateInfo.cliffVestPercent))
      .div(percentDenominator);
    const allocationAfterCliff = allocationTotal.sub(cliffAmount);

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
    const { blockhash } = await this.connection.getLatestBlockhash(
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
    allocationAssigned: number | string,
    streamName = '',
  ): Promise<Transaction> {
    if (treasurer.equals(beneficiary)) {
      throw Error('Beneficiary can not be the same Treasurer');
    }

    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }
    const treasuryAssociatedTokenMint = new PublicKey(
      treasuryInfo.associatedToken,
    );

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
    const percentDenominator = new BN(Constants.CLIFF_PERCENT_DENOMINATOR);
    const allocationTotal = new BN(allocationAssigned);
    const cliffAmount = allocationTotal
      .mul(new BN(templateInfo.cliffVestPercent))
      .div(percentDenominator);
    const allocationAfterCliff = allocationTotal.sub(cliffAmount);
    const rateAmount = allocationAfterCliff // TODO: Remove
      .div(new BN(templateInfo.durationNumberOfUnits));

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
    allocationAssigned: number | string,
    rateAmount?: number | string,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: number | string,
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
          new BN(rateAmount || 0),
          new BN(rateIntervalInSeconds || 0),
          new BN(allocationAssigned),
          new BN(cliffVestAmount || 0),
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
      const { blockhash } = await this.connection.getLatestBlockhash(
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
    amount: string | number,
    autoWSol = false,
  ): Promise<Transaction> {
    const ixs: TransactionInstruction[] = [];
    const txSigners: Signer[] = [];
    const amountBN = new BN(amount || 0);

    if (!amount || amountBN.isZero()) {
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

    if (treasuryInfo.associatedToken as string !== streamInfo.associatedToken.toBase58()) {
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
    const { blockhash } = await this.connection.getLatestBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (txSigners.length > 0) {
      tx.partialSign(...txSigners);
    }

    return tx;
  }

  /**
   * Add funds to a streaming account or a vesting contract
   * @param payer {PublicKey} - The public key of the wallet approving the transaction
   * @param contributor {PublicKey} - The public key of the contributor
   * @param treasury {PublicKey} - The public key of the vesting contract
   * @param mint {PublicKey} - The public key of the token to be sent.
   * @param amount {string | number} - The token amount to fund the account. Use BN.toString() or BigNumber.toString() for best compatibility and to overcome javascript number size limitation when using large amounts.
   */
  public async addFunds(
    payer: PublicKey,
    contributor: PublicKey,
    treasury: PublicKey,
    mint: PublicKey, // it can be the special value: Constants.SOL_MINT
    amount: string | number,
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
      amount, // new BN(amount).toNumber(),
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
    const { blockhash } = await this.connection.getLatestBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    if (txSigners.length > 0) {
      tx.partialSign(...txSigners);
    }

    return tx;
  }

  /**
   * Creates a stream by allocating funds from the streaming account or vesting contract
   * @param payer {PublicKey} - The public key of the wallet approving the transaction
   * @param treasurer {PublicKey} - The public key of the contract treasurer
   * @param treasury {PublicKey} - The public key of the vesting contract
   * @param stream {PublicKey} - The public key of the stream to be created
   * @param amount {string} - The token amount to be allocated to the stream. Use BN.toString() or BigNumber.toString() for best compatibility
   */
  public async allocate(
    payer: PublicKey,
    treasurer: PublicKey,
    treasury: PublicKey,
    stream: PublicKey,
    amount: string | number,
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

    if (treasuryInfo.associatedToken as string !== streamInfo.associatedToken.toBase58()) {
      throw Error('Invalid stream beneficiary associated token');
    }

    const treasuryAssociatedTokenMint = new PublicKey(
      treasuryInfo.associatedToken as string,
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

    const tx = this.program.transaction.allocate(
      LATEST_IDL_FILE_VERSION,
      new BN(amount),
      {
        accounts: {
          payer: payer,
          treasurer: treasurer,
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
    );

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getLatestBlockhash(
      (this.commitment as Commitment) || 'finalized',
    );
    tx.recentBlockhash = blockhash;

    return tx;
  }

  public async withdraw(
    payer: PublicKey,
    stream: PublicKey,
    amount: number | string,
    autoWSol = false,
  ): Promise<Transaction> {
    if (!amount) {
      throw Error('Amount should be greater than 0');
    }

    const streamInfo = (await this.getStream(stream)) as Stream;

    if (!streamInfo) {
      throw Error("Stream doesn't exist");
    }

    if (streamInfo.status === STREAM_STATUS.Scheduled) {
      throw Error('Stream has not started');
    }

    if (streamInfo.withdrawableAmount.isZero()) {
      throw Error('Stream withdrawable amount is zero');
    }

    const beneficiary = streamInfo.beneficiary;
    // Check for the beneficiary associated token account
    const treasuryAssociatedTokenMint = streamInfo.associatedToken;
    const beneficiaryToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryAssociatedTokenMint,
      beneficiary,
      true,
    );

    const treasury = streamInfo.treasury;
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
    const { blockhash } = await this.connection.getLatestBlockhash(
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

    const treasury = streamInfo.treasury;
    const treasuryInfo = await this.getTreasury(treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    const tx = this.program.transaction.pauseStream(LATEST_IDL_FILE_VERSION, {
      accounts: {
        initializer: treasurer, // TODO: payer = payer, inititlizer = treasurer (change initializer to treasurer in MSP)
        treasury: treasury,
        stream: stream,
      },
    });

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getLatestBlockhash(
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

    const treasury = streamInfo.treasury;
    const treasuryInfo = await this.getTreasury(treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    const tx = this.program.transaction.resumeStream(LATEST_IDL_FILE_VERSION, {
      accounts: {
        initializer: treasurer, // TODO: payer = payer, inititlizer = treasurer (change initializer to treasurer in MSP)
        treasury: treasury,
        stream: stream,
      },
    });

    tx.feePayer = payer;
    const { blockhash } = await this.connection.getLatestBlockhash(
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

    const treasury = streamInfo.treasury;
    const treasuryInfo = await getTreasury(this.program, treasury);

    if (!treasuryInfo) {
      throw Error("Treasury doesn't exist");
    }

    if (streamInfo.associatedToken.toBase58() !== treasuryInfo.associatedToken) {
      throw Error('Invalid stream beneficiary associated token');
    }

    const treasurer = streamInfo.treasurer;
    const beneficiary = streamInfo.beneficiary;
    const treasuryAssociatedTokenMint = streamInfo.associatedToken;
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
    const { blockhash } = await this.connection.getLatestBlockhash(
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
    const { blockhash } = await this.connection.getLatestBlockhash(
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
    // const memcmpFilters = [
    //   { memcmp: { offset: 8 + 170, bytes: treasury.toBase58() } },
    // ];
    // const totalStreams = (await this.program.account.stream.all(memcmpFilters))
    //   .length;

    const tx = this.program.transaction.refreshTreasuryData(
      LATEST_IDL_FILE_VERSION,
      {
        accounts: {
          associatedToken: associatedToken,
          treasury: treasury,
          treasuryToken: treasuryToken,
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

  public async transferStream(
    beneficiary: PublicKey,
    newBeneficiary: PublicKey,
    stream: PublicKey,
  ): Promise<Transaction> {
    const streamInfo = (await this.getStream(stream)) as Stream;

    if (!streamInfo) {
      throw Error("Stream doesn't exist");
    }

    const beneficiaryAddress = streamInfo.beneficiary;

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
    const { blockhash } = await this.connection.getLatestBlockhash(
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
    allocationAssigned: number | string,
    rateAmount?: number | string,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: number | string,
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
      new BN(rateAmount || 0),
      new BN(rateIntervalInSeconds || 0),
      new BN(allocationAssigned),
      new BN(cliffVestAmount || 0),
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
    const { blockhash } = await this.connection.getLatestBlockhash(
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
    allocationAssigned: number | string,
    rateAmount?: number | string,
    rateIntervalInSeconds?: number,
    startUtc?: Date,
    cliffVestAmount?: number | string,
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
          new BN(rateAmount || 0),
          new BN(rateIntervalInSeconds || 0),
          new BN(allocationAssigned),
          new BN(cliffVestAmount || 0),
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
      const { blockhash } = await this.connection.getLatestBlockhash(
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
    amount: number | string,
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
    const { blockhash } = await this.connection.getLatestBlockhash(
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
    amountInLamports: number | string | BN,
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
