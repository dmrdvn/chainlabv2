'use client';

import { ReactNode, useMemo, useCallback } from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider as SolanaWalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { clusterApiUrl } from '@solana/web3.js';
import { WalletError } from '@solana/wallet-adapter-base';

// Default Solana RPC endpoint (you can make this configurable, e.g., via environment variables)
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || clusterApiUrl('devnet');

interface SolanaWalletProvidersProps {
  children: ReactNode;
}

export function SolanaWalletProviders({ children }: SolanaWalletProvidersProps) {
  const wallets = useMemo(() => [new BackpackWalletAdapter(), new SolflareWalletAdapter()], []);

  const onError = useCallback((error: WalletError) => {
    console.error('Solana Wallet Error:', error);
  }, []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
      <SolanaWalletProvider wallets={wallets} onError={onError} autoConnect>
        <SolanaWalletModalProvider>{children}</SolanaWalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

// Re-exporting the UI component for Solana wallet connections can be useful.
export { WalletModalProvider as SolanaWalletModalUiProvider } from '@solana/wallet-adapter-react-ui';

// Remember to import Solana Wallet UI CSS in your global layout or main app file:
// import '@solana/wallet-adapter-react-ui/styles.css';
