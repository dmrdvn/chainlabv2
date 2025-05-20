import type { CardProps } from '@mui/material/Card';
import type { TableHeadCellProps } from 'src/components/table';
import type { DisplayableContractInfo } from 'src/types/project';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import CardHeader from '@mui/material/CardHeader';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';

import { DeploymentStatus, CompilationStatus } from 'src/types/project';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  tableLabels: TableHeadCellProps[];
  tableData: DisplayableContractInfo[];
  onViewAll?: () => void;
};

export default function LabsContracts({
  title,
  subheader,
  tableLabels,
  tableData,
  onViewAll,
  sx,
  ...other
}: Props) {
  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <Scrollbar>
        <Table sx={{ minWidth: 960 }}>
          <TableHeadCustom headCells={tableLabels} />

          <TableBody>
            {tableData.map((row) => (
              <RowItem key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </Scrollbar>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {onViewAll && (
        <Box sx={{ p: 2, textAlign: 'right' }}>
          <Button
            size="small"
            color="inherit"
            onClick={onViewAll}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
          >
            View All
          </Button>
        </Box>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------

type RowItemProps = {
  row: DisplayableContractInfo;
};

function RowItem({ row }: RowItemProps) {
  const theme = useTheme();
  const lightMode = theme.palette.mode === 'light';

  const { name, compilation_status, deployment_status, created_at, platform, file_path } = row;

  return (
    <TableRow hover key={row.id}>
      <TableCell>{name}</TableCell>

      <TableCell>{file_path}</TableCell>

      <TableCell>{platform.toUpperCase()}</TableCell>

      <TableCell>
        <Label
          variant="soft"
          color={
            (compilation_status === CompilationStatus.COMPILED_SUCCESS && 'success') ||
            (compilation_status === CompilationStatus.FAILED_COMPILATION && 'error') ||
            (compilation_status === CompilationStatus.COMPILING && 'warning') ||
            'default'
          }
        >
          {compilation_status.replace('_', ' ').toUpperCase()}
        </Label>
      </TableCell>

      <TableCell>
        <Label
          variant="soft"
          color={
            (deployment_status === DeploymentStatus.DEPLOYED_SUCCESS && 'info') ||
            (deployment_status === DeploymentStatus.FAILED_DEPLOYMENT && 'error') ||
            (deployment_status === DeploymentStatus.DEPLOYING && 'warning') ||
            'default'
          }
        >
          {deployment_status.replace('_', ' ').toUpperCase()}
        </Label>
      </TableCell>

      {/* Audit Status (opsiyonel olduğu için kontrol eklenebilir) */}
      {/* <TableCell>
        {row.audit_status && (
          <Label
            variant="soft"
            color={(
              (row.audit_status === AuditProcessStatus.AUDIT_COMPLETED_PASSED && 'success') ||
              (row.audit_status === AuditProcessStatus.AUDIT_COMPLETED_FAILED && 'error') ||
              (row.audit_status === AuditProcessStatus.PENDING_AUDIT && 'warning') ||
              'default'
            )}
          >
            {row.audit_status.replace('_', ' ').toUpperCase()}
          </Label>
        )}
      </TableCell> */}
    </TableRow>
  );
}
