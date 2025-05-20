import type { ContractDeployment } from 'src/types/contract-deployment';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { fDate } from 'src/utils/format-time';
import { shortenAddress } from 'src/utils/format-string';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  deployments?: ContractDeployment[];
  contractName: string;
  isLoading?: boolean;
};

export function ContractDeploymentModal({
  open,
  onClose,
  deployments = [],
  contractName,
  isLoading = false,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} aria-labelledby="deployment-modal-title">
      <Card
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 800,
          maxHeight: '80vh',
          overflowY: 'auto',
          p: 3,
          boxShadow: 24,
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" id="deployment-modal-title">
                Deployments for {contractName}
              </Typography>
              <Chip label={deployments.length} size="small" color="primary" />
            </Stack>
          }
          action={
            <IconButton onClick={onClose}>
              <Iconify icon="eva:close-fill" />
            </IconButton>
          }
          sx={{ pb: 3 }}
        />

        {isLoading ? (
          <Box sx={{ width: '100%', p: 3 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              Loading deployment information...
            </Typography>
          </Box>
        ) : deployments.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1">No deployment data available</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Network</TableCell>
                  <TableCell>Contract Address</TableCell>
                  <TableCell>Deployer</TableCell>
                  <TableCell>Deployed At</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deployments.map((deployment) => (
                  <TableRow key={deployment.id} hover>
                    <TableCell>
                      <Chip
                        label={deployment.network_name}
                        size="small"
                        variant="soft"
                        color={getNetworkColor(deployment.network_name)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        component="a"
                        href={getBlockExplorerUrl(deployment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        {shortenAddress(deployment.contract_address)}
                        <Iconify icon="eva:external-link-fill" width={14} />
                      </Typography>
                    </TableCell>
                    <TableCell>{shortenAddress(deployment.deployer_address)}</TableCell>
                    <TableCell>{fDate(deployment.block_timestamp)}</TableCell>
                    <TableCell>
                      <Chip
                        label={deployment.deployment_type || 'initial'}
                        size="small"
                        variant="soft"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={deployment.verified ? 'Verified' : 'Not Verified'}
                        size="small"
                        color={deployment.verified ? 'success' : 'warning'}
                        variant="soft"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Modal>
  );
}

// Yardımcı fonksiyonlar
function getNetworkColor(network: string) {
  const networkColors: Record<string, any> = {
    Ethereum: 'info',
    Polygon: 'secondary',
    BSC: 'warning',
    Solana: 'success',
    Avalanche: 'error',
  };

  return networkColors[network] || 'default';
}

function getBlockExplorerUrl(deployment: ContractDeployment) {
  const explorers: Record<string, string> = {
    Ethereum: 'https://etherscan.io/address/',
    Polygon: 'https://polygonscan.com/address/',
    BSC: 'https://bscscan.com/address/',
    Avalanche: 'https://avascan.info/blockchain/c/address/',
  };

  const baseUrl = explorers[deployment.network_name] || '#';
  return baseUrl !== '#' ? `${baseUrl}${deployment.contract_address}` : '#';
}
