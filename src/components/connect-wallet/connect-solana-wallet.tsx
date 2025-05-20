"use client";

import { useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { Iconify } from "src/components/iconify";

// Define and export SolanaAccountInfo type
export interface SolanaAccountInfo {
  address: string;
  name: string;
}

interface ConnectSolanaWalletProps {
  onAccountsChange: (accounts: SolanaAccountInfo[]) => void;
}

/**
 * Component for connecting to Solana wallets using wallet adapter
 */
export function ConnectSolanaWallet({
  onAccountsChange,
}: ConnectSolanaWalletProps) {
  const { publicKey, connected, disconnect, wallet } = useWallet();

  const memoizedOnAccountsChange = useCallback(onAccountsChange, [onAccountsChange]);

  useEffect(() => {
    if (connected && publicKey) {
      const walletName = wallet?.adapter.name || 'Solana';
      memoizedOnAccountsChange([
        {
          address: publicKey.toBase58(),
          name: `${walletName} (${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)})`,
        },
      ]);
    } else {
      memoizedOnAccountsChange([]);
    }
  }, [connected, publicKey, wallet, memoizedOnAccountsChange]);

  // Custom styling for the Solana wallet connect button container to match existing design preference
  const walletButtonStyle = {
    width: '100%', // Ensure the button takes full width if needed by parent
    '& .wallet-adapter-button-trigger': { // Target the actual button inside WalletMultiButton
      width: '100%',
      fontSize: "13px",
      padding: "4px 12px", // Adjusted padding for consistency
      height: "auto", // Let content define height, or set to match EVM button
      minHeight: '32px', // Ensure minimum height
      borderRadius: "8px", // MUI default is usually 8px for Button, adjust if needed
      backgroundColor: "transparent",
      border: (theme: any) => `1px solid ${theme.palette.divider}`,
      color: "text.primary",
      textTransform: 'none' as 'none', // Keep text as is
      justifyContent: 'center', // Center content like a normal button
      '&:hover': {
        backgroundColor: (theme: any) => theme.palette.action.hover,
      },
      '&:disabled': {
        opacity: 0.5,
      }
    },
  };

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      {connected && publicKey ? (
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
            <Iconify icon="cryptocurrency:sol" width={16} sx={{ mr: 0.5, flexShrink: 0 }} />
            {publicKey.toBase58().substring(0, 7) + "..." + publicKey.toBase58().substring(publicKey.toBase58().length - 5)}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: 12 }}
          >
            Network: Solana {/* Consider making this dynamic if RPC changes */}
          </Typography>

          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => disconnect().catch(e => console.error('Failed to disconnect Solana wallet:', e))}
            sx={{ mt: 0.5, fontSize: '0.75rem', py: 0.4, textTransform: 'none' }}
          >
            Disconnect
          </Button>
        </>
      ) : (
        <Stack sx={walletButtonStyle}>
          <WalletMultiButton />
        </Stack>
      )}
    </Stack>
  );
}
