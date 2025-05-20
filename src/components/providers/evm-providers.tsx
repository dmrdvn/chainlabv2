"use client";

import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains"; // Add other chains you need
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, metaMask /* safe, walletConnect */ } from "wagmi/connectors";

// 1. Get projectId from https://cloud.walletconnect.com
// It's recommended to store this in an environment variable
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
if (!WALLETCONNECT_PROJECT_ID) {
  console.warn(
    "WalletConnect projectId is not set for EVM providers. WalletConnect functionality will be limited.",
  );
}

// Create a Wagmi config
const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    /* walletConnect({ projectId: WALLETCONNECT_PROJECT_ID }), */
    metaMask(),
    /* safe(), */
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true, // Important for Next.js App Router or SSR in Pages Router
});

// Create a react-query client
const queryClient = new QueryClient();

interface EvmWalletProvidersProps {
  children: ReactNode;
}

export function EvmWalletProviders({ children }: EvmWalletProvidersProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
