import crypto from 'crypto';

/**
 * Generates a placeholder for a Stellar Contract ID.
 * NOTE: This is a placeholder for client-side generation. The final contract ID
 * is determined upon deployment on the Soroban network. This just provides a unique
 * identifier for the 'declare_id!' macro during development.
 * @returns A new placeholder Stellar Contract ID as a hex string.
 */
export function generateStellarContractId(): string {
  // A Soroban contract ID is a 32-byte hash. We'll generate a random one.
  return crypto.randomBytes(32).toString('hex').toUpperCase();
}
