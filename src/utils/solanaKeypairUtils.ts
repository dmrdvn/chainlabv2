import { Keypair as SolanaKeypair } from '@solana/web3.js';

/**
 * Generates a new Solana keypair.
 * @returns {SolanaKeypair} A new Solana keypair.
 */
export function generateSolanaKeypair(): SolanaKeypair {
  return SolanaKeypair.generate();
}

/**
 * Gets the program ID (public key as a Base58 string) from a keypair.
 * @param {SolanaKeypair} keypair - The Solana keypair.
 * @returns {string} The public key as a Base58 encoded string.
 */
export function getProgramIdFromKeypair(keypair: SolanaKeypair): string {
  if (!keypair || !keypair.publicKey) {
    throw new Error('Invalid keypair provided.');
  }
  return keypair.publicKey.toBase58();
}

/**
 * Gets the secret key from a keypair as a JSON string representing the byte array.
 * This format is often used for storing/transmitting keypair files.
 * @param {SolanaKeypair} keypair - The Solana keypair.
 * @returns {string} A JSON string of the secret key byte array.
 */
export function getKeypairJsonContent(keypair: SolanaKeypair): string {
  if (!keypair || !keypair.secretKey) {
    throw new Error('Invalid keypair provided or secret key missing.');
  }
  // The secretKey is a Uint8Array. We convert it to a regular array of numbers
  // to ensure it's correctly serialized by JSON.stringify.
  return JSON.stringify(Array.from(keypair.secretKey));
}

/**
 * Defines the structure of the object returned by `generateProgramIdAndKeypairContent`.
 */
export interface ProgramIdAndKeypair {
  programId: string;
  keypairJsonContent: string;
  newKeypair: SolanaKeypair;
}

/**
 * A helper function that generates a keypair and returns both the
 * program ID (publicKey Base58) and the keypair JSON content (secretKey JSON).
 * @returns {ProgramIdAndKeypair}
 *          An object containing the programId, keypairJsonContent, and the generated Keypair object.
 */
export function generateProgramIdAndKeypairContent(): ProgramIdAndKeypair {
  const newKeypair = generateSolanaKeypair();
  const programId = getProgramIdFromKeypair(newKeypair);
  const keypairJsonContent = getKeypairJsonContent(newKeypair);
  return {
    programId,
    keypairJsonContent,
    newKeypair, // Return the full keypair object in case it's needed elsewhere
  };
}

// Example Usage (you can remove this or keep for testing):
/*
try {
  const { programId, keypairJsonContent, newKeypair }: ProgramIdAndKeypair = generateProgramIdAndKeypairContent();
  console.log("Generated Program ID:", programId);
  console.log("Generated Keypair JSON Content:", keypairJsonContent);
  console.log("Full Keypair Object:", newKeypair);
} catch (error) {
  console.error("Error generating keypair info:", error);
}
*/ 