import type { Frontend } from 'src/types/frontend';
import type { CardProps } from '@mui/material/Card';
import type { TableHeadCellProps } from 'src/components/table';

import { useState } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import ListItemText from '@mui/material/ListItemText';

import { useDeleteFrontend } from 'src/hooks/use-frontends';

import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import { CustomPopover } from 'src/components/custom-popover';
import { ConfirmDialog } from 'src/components/confirm-dialog';
import { LoadingButton } from 'src/components/loading-button';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  headCells: TableHeadCellProps[];
  tableData: Frontend[];
  onViewAll?: () => void;
};

export function LabsFrontends({
  title,
  subheader,
  headCells,
  tableData,
  onViewAll,
  sx,
  ...other
}: Props) {
  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <Scrollbar sx={{ minHeight: 462 }}>
        <Table sx={{ minWidth: 960 }}>
          <TableHeadCustom headCells={headCells} />

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

const FRAMEWORK_MAP = {
  react: { label: 'React', color: 'info' },
  nextjs: { label: 'Next.js', color: 'success' },
  vanilla: { label: 'Vanilla', color: 'warning' },
} as const;

const STATUS_MAP = {
  published: { label: 'Published', color: 'success' },
  draft: { label: 'Draft', color: 'warning' },
  archived: { label: 'Archived', color: 'default' },
  error: { label: 'Error', color: 'error' },
} as const;

type RowItemProps = {
  row: Frontend;
};

function RowItem({ row }: RowItemProps) {
  const theme = useTheme();
  const menuActions = usePopover();
  const lightMode = theme.palette.mode === 'light';

  const [openConfirm, setOpenConfirm] = useState(false);
  const { deleteFrontend, isDeleting } = useDeleteFrontend();

  const handleDownload = () => {
    menuActions.onClose();
    console.info('DOWNLOAD', row.id);
  };

  const handlePrint = () => {
    menuActions.onClose();
    console.info('PRINT', row.id);
  };

  const handleShare = () => {
    menuActions.onClose();
    console.info('SHARE', row.id);
  };

  const handleDelete = async () => {
    menuActions.onClose();
    setOpenConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (row.id && row.project_id) {
      await deleteFrontend(row.id, row.project_id);
    }
    setOpenConfirm(false);
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        {row.can_deploy && (
          <MenuItem onClick={handleDownload}>
            <Iconify icon="eva:cloud-download-fill" />
            Download
          </MenuItem>
        )}

        {row.can_edit && (
          <MenuItem onClick={handlePrint}>
            <Iconify icon="solar:printer-minimalistic-bold" />
            Print
          </MenuItem>
        )}

        <MenuItem onClick={handleShare}>
          <Iconify icon="solar:share-bold" />
          Share
        </MenuItem>

        {row.can_edit && (
          <>
            <Divider sx={{ borderStyle: 'dashed' }} />

            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete
            </MenuItem>
          </>
        )}
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <TableRow>
        {/* UI Name */}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              variant="rounded"
              alt={row.name}
              src={row.logo_url || ''}
              sx={{ width: 48, height: 48, bgcolor: 'primary.dark' }}
            >
              {row.name.charAt(0).toUpperCase()}
            </Avatar>
            {row.name}
          </Box>
        </TableCell>

        {/* Framework */}
        <TableCell>
          <Label
            variant={lightMode ? 'soft' : 'filled'}
            color={FRAMEWORK_MAP[row.framework]?.color || 'default'}
          >
            {FRAMEWORK_MAP[row.framework]?.label || row.framework}
          </Label>
        </TableCell>

        {/* Status */}
        <TableCell>
          <Label
            variant={lightMode ? 'soft' : 'filled'}
            color={STATUS_MAP[row.status]?.color || 'default'}
          >
            {STATUS_MAP[row.status]?.label || row.status}
          </Label>
        </TableCell>

        {/* Created */}
        <TableCell>
          {row.created_at ? (
            <ListItemText
              primary={fDate(row.created_at)}
              secondary={fTime(row.created_at)}
              slotProps={{
                primary: {
                  noWrap: true,
                  sx: { typography: 'body2' },
                },
                secondary: {
                  sx: { mt: 0.5, typography: 'caption' },
                },
              }}
            />
          ) : (
            '-'
          )}
        </TableCell>

        {/* Updated */}
        <TableCell>
          {row.updated_at ? (
            <ListItemText
              primary={fDate(row.updated_at)}
              secondary={fTime(row.updated_at)}
              slotProps={{
                primary: {
                  noWrap: true,
                  sx: { typography: 'body2' },
                },
                secondary: {
                  sx: { mt: 0.5, typography: 'caption' },
                },
              }}
            />
          ) : (
            '-'
          )}
        </TableCell>

        {/* Actions */}
        <TableCell align="right" sx={{ pr: 1 }}>
          <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {renderMenuActions()}

      <ConfirmDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title="Delete"
        content="Are you sure you want to delete this frontend?"
        action={
          <LoadingButton
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            loading={isDeleting}
          >
            Sil
          </LoadingButton>
        }
      />
    </>
  );
}
