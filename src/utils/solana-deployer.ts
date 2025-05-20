import type { Connection } from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';

import {
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
  BPF_LOADER_PROGRAM_ID,
  TransactionInstruction,
} from '@solana/web3.js';

// Solana program deployment artifacts interface
export interface SolanaProgramArtifacts {
  idl: any; // Anchor IDL JSON format
  programBinaryBase64: string; // Base64 encoded .so file
  keypair: number[]; // Program keypair secret key as byte array
}

// Deployment options interface
export interface DeploySolanaProgramOptions {
  artifacts: SolanaProgramArtifacts;
  wallet: WalletContextState; // From useWallet() hook
  connection: Connection; // From useConnection() hook
  onProgress?: (message: string) => void; // Optional progress callback
}

// Deployment result interface
export interface DeploySolanaProgramResult {
  programId: string;
  transactionSignature: string;
}

/**
 * Deploys a compiled Solana program using the BPF Loader.
 * Optimized for browser wallets like Phantom.
 */
export async function deploySolanaProgram({
  artifacts,
  wallet,
  connection,
  onProgress,
}: DeploySolanaProgramOptions): Promise<DeploySolanaProgramResult> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet is not connected or does not support transaction signing');
  }

  if (!artifacts.programBinaryBase64 || !artifacts.keypair) {
    throw new Error('Program binary or keypair is missing from artifacts');
  }

  onProgress?.('Starting deployment process...');

  try {
    // Create program keypair from the provided secret key
    const programKeypair = Keypair.fromSecretKey(Uint8Array.from(artifacts.keypair));
    const programId = programKeypair.publicKey;

    onProgress?.(`Program ID: ${programId.toBase58()}`);

    // Convert program binary from base64 to Buffer
    const programBuffer = Buffer.from(artifacts.programBinaryBase64, 'base64');
    onProgress?.(`Program binary size: ${(programBuffer.length / 1024).toFixed(2)} KB`);

    // ADIM 1: Programın zaten var olup olmadığını kontrol et
    let programExists = false;
    try {
      const accountInfo = await connection.getAccountInfo(programId);
      if (accountInfo !== null) {
        programExists = true;
        onProgress?.('Program already exists on blockchain! Attempting to upgrade it...');
      }
    } catch (error) {
      console.log(error);
    }

    // Calculate rent for program account (yeni hesap oluşturulacaksa gerekli)
    const rentExemptionAmount = await connection.getMinimumBalanceForRentExemption(
      programBuffer.length
    );

    onProgress?.(`Required SOL for program account: ${rentExemptionAmount / LAMPORTS_PER_SOL} SOL`);

    let lastSignature = '';

    // Yeni program hesabı oluşturma adımı - sadece program yoksa!
    if (!programExists) {
      // 1. Create account transaction
      const createAccountTransaction = new Transaction().add(
        // Set compute budget for larger transactions
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
        // Create the program account
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: programId,
          lamports: rentExemptionAmount,
          space: programBuffer.length,
          programId: BPF_LOADER_PROGRAM_ID,
        })
      );

      createAccountTransaction.feePayer = wallet.publicKey;
      createAccountTransaction.recentBlockhash = (
        await connection.getLatestBlockhash('confirmed')
      ).blockhash;

      onProgress?.('Requesting account creation approval...');

      // Sign with both the wallet and programKeypair
      const signedCreateAccountTx = await wallet.signTransaction(createAccountTransaction);
      // Program keypair must also sign since it's the new account being created
      signedCreateAccountTx.partialSign(programKeypair);

      // Send create account transaction
      const createAccountSignature = await connection.sendRawTransaction(
        signedCreateAccountTx.serialize(),
        { preflightCommitment: 'confirmed' }
      );

      // Wait for confirmation with more detailed status
      onProgress?.(`Creating program account (tx: ${createAccountSignature.slice(0, 8)}...)...`);
      const createConfirmation = await connection.confirmTransaction(
        {
          signature: createAccountSignature,
          blockhash: createAccountTransaction.recentBlockhash,
          lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
        },
        'confirmed'
      );

      if (createConfirmation.value.err) {
        throw new Error(
          `Failed to create program account: ${JSON.stringify(createConfirmation.value.err)}`
        );
      }

      onProgress?.('Program account created successfully!');
      lastSignature = createAccountSignature;
    } else {
      onProgress?.('Using existing program account - skipped account creation step');
    }

    // 2. Load program data in smaller chunks for better browser wallet compatibility
    const CHUNK_SIZE = 700; // Smaller chunk size for better wallet compatibility
    let offset = 0;

    onProgress?.(
      `Uploading program data in ${Math.ceil(programBuffer.length / CHUNK_SIZE)} chunks...`
    );

    while (offset < programBuffer.length) {
      const endIndex = Math.min(offset + CHUNK_SIZE, programBuffer.length);
      const chunk = programBuffer.slice(offset, endIndex);
      const percentComplete = Math.round((offset / programBuffer.length) * 100);

      onProgress?.(
        `Uploading chunk ${Math.floor(offset / CHUNK_SIZE) + 1}: ${percentComplete}% complete...`
      );

      // Prepare write transaction for this chunk
      const writeTransaction = new Transaction().add(
        // Add compute budget instruction
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),

        // Write instruction
        new TransactionInstruction({
          keys: [{ pubkey: programId, isSigner: true, isWritable: true }],
          programId: BPF_LOADER_PROGRAM_ID,
          data: Buffer.concat([
            Buffer.from([0x02, 0x00, 0x00, 0x00]), // Write instruction code
            new Uint8Array(new Uint32Array([offset]).buffer), // Offset as u32 LE
            new Uint8Array(new Uint32Array([chunk.length]).buffer), // Length as u32 LE
            chunk, // The actual chunk data
          ]),
        })
      );

      // Set transaction metadata
      writeTransaction.feePayer = wallet.publicKey;
      writeTransaction.recentBlockhash = (
        await connection.getLatestBlockhash('confirmed')
      ).blockhash;

      // Sign transaction - needs both wallet and program signatures
      const signedWriteTx = await wallet.signTransaction(writeTransaction);
      signedWriteTx.partialSign(programKeypair);

      // Send the write transaction
      try {
        const writeSignature = await connection.sendRawTransaction(signedWriteTx.serialize(), {
          preflightCommitment: 'confirmed',
          skipPreflight: true,
        });

        lastSignature = writeSignature;

        // Wait for confirmation
        await connection.confirmTransaction(
          {
            signature: writeSignature,
            blockhash: writeTransaction.recentBlockhash,
            lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
          },
          'confirmed'
        );

        // Update progress
        offset = endIndex;

        // Wait briefly between chunks to avoid overwhelming the wallet or RPC
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (error: any) {
        console.error(`Error uploading chunk at offset ${offset}:`, error);
        onProgress?.(`Error uploading chunk: ${error.message}. Retrying...`);

        // Wait a bit longer before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Eğer tekrar denememize rağmen aşağıdaki hatayı alırsak, bu chunk zaten yazılmış olabilir
        if (error.message && error.message.includes('custom program error: 0x1')) {
          onProgress?.(
            `Chunk at offset ${offset} might already be written, continuing to next chunk...`
          );
          offset = endIndex; // Bir sonraki chunka geç
        }
        // Don't increment offset - we'll retry this chunk
      }
    }

    onProgress?.('Program data uploaded successfully. Finalizing...');

    // 3. Finalize the program
    const finalizeTransaction = new Transaction().add(
      // Add compute budget instruction
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),

      // Finalize instruction
      new TransactionInstruction({
        keys: [{ pubkey: programId, isSigner: true, isWritable: true }],
        programId: BPF_LOADER_PROGRAM_ID,
        data: Buffer.from([0x03, 0x00, 0x00, 0x00]), // Finalize instruction code
      })
    );

    finalizeTransaction.feePayer = wallet.publicKey;
    finalizeTransaction.recentBlockhash = (
      await connection.getLatestBlockhash('confirmed')
    ).blockhash;

    // Sign finalize transaction
    const signedFinalizeTx = await wallet.signTransaction(finalizeTransaction);
    signedFinalizeTx.partialSign(programKeypair);

    // Send finalize transaction
    const finalizeSignature = await connection.sendRawTransaction(signedFinalizeTx.serialize(), {
      preflightCommitment: 'confirmed',
      skipPreflight: true,
    });

    // Wait for confirmation
    onProgress?.('Finalizing program deployment...');
    try {
      await connection.confirmTransaction(
        {
          signature: finalizeSignature,
          blockhash: finalizeTransaction.recentBlockhash,
          lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
        },
        'confirmed'
      );
      lastSignature = finalizeSignature;
    } catch (error: any) {
      // Program zaten finalize edilmiş olabilir - bu durumda, bir sorun değil
      if (error.message && error.message.includes('custom program error: 0x0')) {
        onProgress?.('Program may already be finalized, continuing...');
      } else {
        throw error;
      }
    }

    onProgress?.(
      programExists ? 'Program upgraded successfully! 🚀' : 'Program deployed successfully! 🚀'
    );

    return {
      programId: programId.toBase58(),
      transactionSignature: lastSignature,
    };
  } catch (error: any) {
    onProgress?.(`Deployment error: ${error.message}`);
    console.error('Solana program deployment error:', error);
    throw new Error(`Deployment failed: ${error.message}`);
  }
}

/**
 * Simplified version that redirects to the standard deployment function.
 */
export async function deploySolanaUpgradeableProgram({
  artifacts,
  wallet,
  connection,
  onProgress,
}: DeploySolanaProgramOptions): Promise<DeploySolanaProgramResult> {
  onProgress?.('Using standard BPF Loader deployment instead of upgradeable loader...');
  return deploySolanaProgram({
    artifacts,
    wallet,
    connection,
    onProgress,
  });
}
