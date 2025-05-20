"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { Iconify } from "src/components/iconify";

// Define a type for account information
export interface EvmAccountInfo {
  address: `0x${string}`;
  name: string;
}

interface ConnectEvmWalletProps {
  onAccountsChange?: (accounts: EvmAccountInfo[]) => void;
}

/**
 * Component for connecting to EVM wallets using Wagmi v2 hooks
 */
export function ConnectEvmWallet({ onAccountsChange }: ConnectEvmWalletProps) {
  const { address, isConnected, chain, connector: activeConnector } = useAccount(); // Correctly get activeConnector
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();

  const [networkName, setNetworkName] = useState<string>("Unknown");
  const [connectedAccounts, setConnectedAccounts] = useState<EvmAccountInfo[]>([]); // Initialize with empty array of correct type

  // Find the browser wallet connector (MetaMask, etc. via EIP-6963 or window.ethereum)
  // We prioritize 'injected' as it's the standard EIP-6963, then 'metaMask' as a fallback.
  const browserConnector = connectors.find((c) => c.id === 'injected' || c.id === 'metaMask');

  useEffect(() => {
    // Define networkMap with number keys for chain.id
    const networkMap: { [key: number]: string } = {
      1: "Ethereum Mainnet",
      11155111: "Sepolia Testnet",
      137: "Polygon Mainnet",
      80001: "Polygon Mumbai Testnet",
      56: "BNB Smart Chain",
      97: "BNB Testnet",
      42161: "Arbitrum Mainnet",
      421611: "Arbitrum Goerli",
      10: "Optimism Mainnet",
      42000: "Optimism Goerli",
      1442: "Base Mainnet",
      8453: "Base Goerli",
      // Add more as needed
    };
    setNetworkName(chain?.id ? networkMap[chain.id] || `Chain ID #${chain.id}` : "Unknown");
  }, [chain?.id]);

  // Effect to update local connectedAccounts state based on wagmi state
  useEffect(() => {
    if (isConnected && address && chain && activeConnector) {
      const accountData: EvmAccountInfo[] = [{
        address,
        name: activeConnector.name ? `${activeConnector.name} (${chain.name})` : `Unnamed Account (${chain.name})`
      }];
      if (JSON.stringify(connectedAccounts) !== JSON.stringify(accountData)) {
        setConnectedAccounts(accountData);
      }
    } else {
      if (connectedAccounts.length > 0) {
        setConnectedAccounts([]);
      }
    }
    // Dependencies should reflect what's used to derive the state
  }, [isConnected, address, chain, activeConnector, connectedAccounts]); 

  // Effect to call onAccountsChange when local connectedAccounts state changes
  useEffect(() => {
    if (onAccountsChange) {
      onAccountsChange(connectedAccounts);
    }
  }, [connectedAccounts, onAccountsChange]);

  useEffect(() => {
    if (connectError) {
      console.error("Failed to connect EVM wallet:", connectError.message);
      // Optionally, display a user-friendly error message here
    }
  }, [connectError]);

  const handleConnect = () => {
    if (browserConnector) {
      connect({ connector: browserConnector });
    } else {
      console.warn("No suitable browser wallet connector found (e.g., MetaMask).");
      // Optionally, inform the user that they need a browser wallet extension.
    }
  };

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      {isConnected && address ? (
        <>
          <Typography
            variant="body2"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: 13,
              wordBreak: 'break-all',
            }}
          >
            <Iconify icon="logos:ethereum" width={16} sx={{ mr: 0.5, flexShrink: 0 }} />
            {address.slice(0, 6) + "..." + address.slice(-10)}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: 12 }}
          >
            Network: {networkName}
          </Typography>

          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => disconnect()}
            sx={{ mt: 0.5, fontSize: '0.75rem', py: 0.4 }}
          >
            Disconnect
          </Button>
        </>
      ) : (
        <Button
          variant="outlined"
          size="small"
          onClick={handleConnect}
          disabled={isConnecting || !browserConnector}
          startIcon={<Iconify icon="logos:metamask-icon" />}
          sx={{ fontSize: 12, textTransform: 'none' }}
        >
          {isConnecting ? "Connecting..." : (browserConnector ? "Connect MetaMask" : "MetaMask Not Found")}
        </Button>
      )}
    </Stack>
  );
}
