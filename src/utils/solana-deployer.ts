import type { Connection } from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';

import {
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';

// BPF_UPGRADEABLE_LOADER_ID sabit olarak tanımlanıyor
const BPF_UPGRADEABLE_LOADER_PROGRAM_ID = new PublicKey(
  'BPFLoaderUpgradeab1e111111111111111111111111'
);

// Solana program deployment artifacts interface (aynı kalabilir)
export interface SolanaProgramArtifacts {
  idl: any;
  programBinaryBase64: string;
  keypair: number[];
}

// Deployment options interface (aynı kalabilir)
export interface DeploySolanaProgramOptions {
  artifacts: SolanaProgramArtifacts;
  wallet: WalletContextState;
  connection: Connection;
  onProgress?: (message: string) => void;
}

// Deployment result interface (aynı kalabilir)
export interface DeploySolanaProgramResult {
  programId: string;
  transactionSignature: string;
}

// BPF Upgradeable Loader için instruction index'leri (Bunlar doğrulanmalı!)
const IX_INDEX_INITIALIZE_BUFFER = 0;
const IX_INDEX_WRITE = 1;
const IX_INDEX_DEPLOY_WITH_MAX_DATA_LEN = 2;
// const IX_INDEX_UPGRADE = 3;
// const IX_INDEX_SET_AUTHORITY = 4;

export async function deploySolanaProgramWithUpgradeableLoader({
  artifacts,
  wallet,
  connection,
  onProgress,
}: DeploySolanaProgramOptions): Promise<DeploySolanaProgramResult> {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    throw new Error(
      'Wallet is not connected or does not support required transaction signing methods'
    );
  }

  if (!artifacts.programBinaryBase64 || !artifacts.keypair) {
    throw new Error('Program binary or keypair is missing from artifacts');
  }

  onProgress?.('Starting upgradeable deployment process...');

  const programKeypair = Keypair.fromSecretKey(Uint8Array.from(artifacts.keypair));
  const programId = programKeypair.publicKey;
  const programBuffer = Buffer.from(artifacts.programBinaryBase64, 'base64');

  onProgress?.(`Deploying Program ID: ${programId.toBase58()}`);
  onProgress?.(`Program binary size: ${(programBuffer.length / 1024).toFixed(2)} KB`);

  const transactions: Transaction[] = [];
  let latestBlockhash = await connection.getLatestBlockhash('confirmed');

  // Adım 1: Programın veri (executable) hesabı için adres türetme
  const [programDataAddress] = PublicKey.findProgramAddressSync(
    [programId.toBuffer()],
    BPF_UPGRADEABLE_LOADER_PROGRAM_ID
  );
  onProgress?.(`Program executable data address: ${programDataAddress.toBase58()}`);

  // Adım 2: Buffer hesabı oluşturma
  const bufferAccountKeypair = Keypair.generate(); // Her deploy için yeni buffer
  const bufferSize = programBuffer.length;
  const bufferAccountRentLamports = await connection.getMinimumBalanceForRentExemption(bufferSize);

  onProgress?.(`Buffer account rent: ${bufferAccountRentLamports / LAMPORTS_PER_SOL} SOL`);

  const createBufferTx = new Transaction({
    feePayer: wallet.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
  }).add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: bufferAccountKeypair.publicKey,
      lamports: bufferAccountRentLamports,
      space: bufferSize,
      programId: BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
    }),
    // Buffer'ı initialize etme talimatı
    new TransactionInstruction({
      keys: [
        { pubkey: bufferAccountKeypair.publicKey, isSigner: true, isWritable: true }, // Buffer hesabı, kendisi imzalayacak
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false }, // Buffer yetkilisi (payer da olabilir)
      ],
      programId: BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
      data: Buffer.from([IX_INDEX_INITIALIZE_BUFFER]), // InitializeBuffer instruction index
    })
  );
  // createBufferTx için bufferAccountKeypair'in de imzalaması gerekiyor.
  // signAllTransactions bunu handle etmeyeceğinden, bu işlem ayrı gönderilebilir veya partialSign denenir.
  // Şimdilik bu işlemi diğerleriyle birleştirmeden önce ayrı göndermeyi düşünebiliriz.
  // VEYA bufferAccountKeypair'i transactionsToSign'a ekleyip partialSign deneyebiliriz.

  // Geçici Çözüm: Buffer oluşturma ve initialize işlemini ayrı yapalım, sonra write ve deploy
  try {
    onProgress?.('Preparing to create and initialize buffer account...');
    createBufferTx.partialSign(bufferAccountKeypair); // Buffer keypair'i initialize için imzalıyor
    const signedCreateBufferTx = await wallet.signTransaction(createBufferTx);
    const createBufferSig = await connection.sendRawTransaction(signedCreateBufferTx.serialize(), {
      skipPreflight: true,
    });
    onProgress?.(
      `Buffer account creation sent (Sig: ${createBufferSig.substring(0, 10)}...). Confirming...`
    );
    await connection.confirmTransaction(
      {
        signature: createBufferSig,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      'confirmed'
    );
    onProgress?.('Buffer account created and initialized successfully.');
    latestBlockhash = await connection.getLatestBlockhash('confirmed'); // Yeni blockhash al
  } catch (e: any) {
    onProgress?.(`Error creating/initializing buffer: ${e.message}`);
    throw e;
  }

  // Adım 3: Program verisini buffer'a yazma
  const CHUNK_SIZE = 850; // Deneyerek optimize edilebilir (işlem boyutu limitine yakın)
  let offset = 0;
  let chunkNumber = 1;

  while (offset < bufferSize) {
    const chunk = programBuffer.slice(offset, Math.min(offset + CHUNK_SIZE, bufferSize));
    const writeTx = new Transaction({
      feePayer: wallet.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
    }).add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
      new TransactionInstruction({
        keys: [
          { pubkey: bufferAccountKeypair.publicKey, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: false }, // Buffer yetkilisi
        ],
        programId: BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
        data: Buffer.concat([
          Buffer.from([IX_INDEX_WRITE]), // Write instruction index
          new Uint8Array(new Uint32Array([offset]).buffer), // offset
          chunk, // data (length'i data'dan çıkarılabilir)
        ]),
      })
    );
    transactions.push(writeTx);
    onProgress?.(
      `Prepared transaction to write chunk ${chunkNumber++} (${chunk.length} bytes at offset ${offset}).`
    );
    offset += chunk.length;
  }
  onProgress?.(`All ${chunkNumber - 1} data chunks prepared for buffer account.`);

  // Adım 4: Programı Deploy Etme
  // Program executable data account için rent
  const programMaxDataLen = bufferSize; // Genellikle buffer boyutu kadar veya biraz fazla
  const programAccountRentLamports =
    await connection.getMinimumBalanceForRentExemption(programMaxDataLen);

  const deployTx = new Transaction({
    feePayer: wallet.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
  }).add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
    // Deploy talimatı
    new TransactionInstruction({
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false }, // Payer
        { pubkey: programDataAddress, isSigner: false, isWritable: true }, // Program Data Account
        { pubkey: programId, isSigner: true, isWritable: true }, // Program Account (programKeypair imzalayacak)
        { pubkey: bufferAccountKeypair.publicKey, isSigner: false, isWritable: true }, // Buffer with data
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // Rent Sysvar
        { pubkey: PublicKey.default, /* clock sysvar */ isSigner: false, isWritable: false }, // Clock Sysvar (Solana web3.js SYSVAR_CLOCK_PUBKEY import edilebilir)
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // System Program
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false }, // Program'ın yeni upgrade authority'si
      ],
      programId: BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
      data: Buffer.concat([
        Buffer.from([IX_INDEX_DEPLOY_WITH_MAX_DATA_LEN]), // DeployWithMaxDataLen instruction
        new Uint8Array(new BigUint64Array([BigInt(programAccountRentLamports)]).buffer), // lamports for program account (bu talimatta olmayabilir, SystemProgram.createAccount ile yapılabilir)
        new Uint8Array(new BigUint64Array([BigInt(programMaxDataLen)]).buffer), // max_data_len
      ]),
    })
  );
  // Eğer program account (programId) henüz yoksa, SystemProgram.createAccount ile oluşturulmalı.
  // Genellikle deploy talimatı bunu kendisi yapar veya öncesinde bir createAccount gerekir.
  // Anchor CLI'ın deploy komutu bunu nasıl yaptığına bakmak lazım.
  // Şimdilik, programId'nin deploy sırasında oluşturulduğunu varsayıyoruz ve programKeypair imzalayacak.

  transactions.push(deployTx);
  onProgress?.('Prepared transaction to deploy program from buffer.');

  // Adım 5: Tüm İşlemleri İmzala ve Gönder
  onProgress?.(
    `Requesting ${transactions.length} transaction approvals from wallet for writing and deploying...`
  );

  try {
    const signedTransactions = await wallet.signAllTransactions(transactions);
    onProgress?.('All transactions signed by wallet.');

    let lastSignature = '';
    let txNumber = 0;
    for (const signedTx of signedTransactions) {
      txNumber++;
      // Deploy işlemi için programKeypair'in imzası gerekli
      // Bu, transactions listesindeki son işlem olmalı.
      if (txNumber === transactions.length) {
        // Son işlem deploy işlemi
        onProgress?.(`Applying program keypair signature to deploy transaction...`);
        signedTx.partialSign(programKeypair);
      }

      onProgress?.(
        `Sending transaction ${txNumber}/${signedTransactions.length} (Sig: ${lastSignature.substring(0, 10)}...). Confirming...`
      );
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true,
      });
      lastSignature = signature;

      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash, // Her işlem için blockhash'i ata
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'confirmed'
      );
      onProgress?.(`Transaction ${txNumber} confirmed.`);
      if (txNumber < signedTransactions.length) {
        // Son işlem değilse yeni blockhash al
        latestBlockhash = await connection.getLatestBlockhash('confirmed');
      }
    }

    onProgress?.('Program deployed successfully using Upgradeable Loader! 🚀');
    return {
      programId: programId.toBase58(),
      transactionSignature: lastSignature,
    };
  } catch (error: any) {
    onProgress?.(`Deployment error: ${error.message}`);
    console.error('Solana upgradeable program deployment error:', error);
    let friendlyMessage = `Deployment failed: ${error.message}`;
    if (error.message?.includes('Transaction too large')) {
      friendlyMessage =
        'Deployment failed: Program data is too large for a single transaction group. Consider optimizing program size or splitting data further.';
    } else if (error.message?.includes('Missing signature')) {
      friendlyMessage =
        'Deployment failed: A required signature was missing. This might be an issue with program keypair signing.';
    }
    throw new Error(friendlyMessage);
  }
}

// Eski fonksiyonu şimdilik koruyabilir veya kaldırabiliriz.
// export async function deploySolanaProgram(...)
