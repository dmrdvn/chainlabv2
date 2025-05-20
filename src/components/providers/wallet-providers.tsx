'use client';

import { ReactNode } from 'react';
import { EvmWalletProviders } from './evm-providers';
import { SolanaWalletProviders } from './solana-providers';

// It's good practice to ensure UI styles for wallet modals are imported at a high level.
// Solana Wallet UI CSS is typically imported here or in the layout if not handled by SolanaWalletProviders itself.
// import '@solana/wallet-adapter-react-ui/styles.css';
// Wagmi v2 does not typically require a separate CSS import for its modal as it's more integrated.

interface WalletProvidersProps {
  children: ReactNode;
}

export function WalletProviders({ children }: WalletProvidersProps) {
  return (
    <EvmWalletProviders>
      <SolanaWalletProviders>
        {children}
      </SolanaWalletProviders>
    </EvmWalletProviders>
  );
}