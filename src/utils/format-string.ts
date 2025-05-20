/**
 * Adres formatını kısaltır, örneğin: 0x1234...5678
 */
export function shortenAddress(address: string | null | undefined, prefixLength = 6, suffixLength = 4): string {
  if (!address) return '-';
  
  return `${address.substring(0, prefixLength)}...${address.slice(-suffixLength)}`;
}
