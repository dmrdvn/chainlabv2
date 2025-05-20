'use client';

import { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider as SolanaWalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Default Solana RPC endpoint (you can make this configurable, e.g., via environment variables)
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || clusterApiUrl('devnet');

interface SolanaWalletProvidersProps {
  children: ReactNode;
}

export function SolanaWalletProviders({ children }: SolanaWalletProvidersProps) {
  const solanaWallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    [SOLANA_RPC_ENDPOINT] // Re-initialize if RPC endpoint changes, though typically it's static once app loads
  );

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
      <SolanaWalletProvider wallets={solanaWallets} autoConnect>
        <SolanaWalletModalProvider>
          {children}
        </SolanaWalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

// Re-exporting the UI component for Solana wallet connections can be useful.
export { WalletModalProvider as SolanaWalletModalUiProvider } from '@solana/wallet-adapter-react-ui';

// Remember to import Solana Wallet UI CSS in your global layout or main app file:
// import '@solana/wallet-adapter-react-ui/styles.css';