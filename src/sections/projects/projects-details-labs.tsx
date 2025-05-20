import type { BoxProps } from '@mui/material/Box';
import type { Frontend } from 'src/types/frontend';
import type { ProjectHierarchyItem } from 'src/types/project';

import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import ListItemText from '@mui/material/ListItemText';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import {
  useProjectDetails,
  useProjectFrontends,
  useDeleteProjectItem,
  useProjectEvmContracts,
  useProjectSolanaPrograms,
} from 'src/hooks/projects';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';

import ContractCreateModal from './contract-create-modal';
import { ContractDeploymentModal } from './contract-deployment-modal';

// ----------------------------------------------------------------------

type Props = BoxProps & {
  projectId: string;
  sx?: any;
};

export function ProjectsDetailsLabs({ projectId, sx, ...other }: Props) {
  const { project, projectLoading } = useProjectDetails(projectId);
  const platform = project?.platform as 'evm' | 'solana' | undefined;

  // Call hooks with only projectId if they don't support an options object
  const evmContractsQuery = useProjectEvmContracts(projectId);
  const solanaProgramsQuery = useProjectSolanaPrograms(projectId);

  const { displayedItems, itemsLoading, itemsError, refreshItems } = useMemo(() => {
    // If project details are still loading, the items are also considered loading.
    if (projectLoading) {
      return {
        displayedItems: [] as ProjectHierarchyItem[],
        itemsLoading: true,
        itemsError: undefined as Error | undefined,
        refreshItems: () => {}, // Or refreshProjectDetails if available
      };
    }

    // Project details are loaded, now determine items based on platform
    if (platform === 'evm') {
      return {
        displayedItems: evmContractsQuery.evmContracts || [],
        itemsLoading: evmContractsQuery.isLoading,
        itemsError: evmContractsQuery.error,
        refreshItems: evmContractsQuery.refreshContracts,
      };
    }

    if (platform === 'solana') {
      // Ensure solanaProgramsQuery returns a similar structure
      return {
        displayedItems: solanaProgramsQuery.solanaPrograms || [],
        itemsLoading: solanaProgramsQuery.isLoading,
        itemsError: solanaProgramsQuery.error,
        refreshItems: solanaProgramsQuery.refreshPrograms,
      };
    }

    // Default case: platform is not set or not supported for labs view
    return {
      displayedItems: [] as ProjectHierarchyItem[],
      itemsLoading: false, // Not actively loading anything specific here
      itemsError: undefined,
      refreshItems: () => {},
    };
  }, [
    projectLoading,
    platform,
    evmContractsQuery.evmContracts,
    evmContractsQuery.isLoading,
    evmContractsQuery.error,
    evmContractsQuery.refreshContracts,
    solanaProgramsQuery.solanaPrograms, // Add null checks or ensure structure if different
    solanaProgramsQuery.isLoading,
    solanaProgramsQuery.error,
    solanaProgramsQuery.refreshPrograms,
  ]);

  // Frontend data fetching
  const {
    frontends: frontendsResult,
    frontendsLoading,
    frontendsError,
    refreshFrontends,
  } = useProjectFrontends(projectId);
  const frontends: Frontend[] =
    frontendsResult && 'data' in frontendsResult && frontendsResult.data
      ? frontendsResult.data
      : [];

  const { deleteItem, isLoading: isDeleting, error: deleteItemError } = useDeleteProjectItem();

  const deleteDialog = useBoolean();
  const createModal = useBoolean();
  const deploymentModal = useBoolean();

  const [itemPathToDelete, setItemPathToDelete] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ProjectHierarchyItem | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null); // This should be the item's path or ID

  const handleOpenDeploymentModal = (item: ProjectHierarchyItem) => {
    setSelectedItem(item);
    deploymentModal.onTrue();
  };

  const handleCloseDeploymentModal = () => {
    deploymentModal.onFalse();
  };

  const handleOpenCreateModal = () => {
    createModal.onTrue();
  };

  const handleCloseCreateModal = () => {
    createModal.onFalse();
  };

  const handleItemCreated = useCallback(
    (newItemIdOrPath: string) => {
      console.log('New item created, ID/Path:', newItemIdOrPath);
      refreshItems();
      createModal.onFalse();
    },
    [refreshItems, createModal]
  );

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, itemId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveItemId(itemId); // Use the item's unique identifier (path or id)
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setActiveItemId(null);
  };

  const handleOpenDeleteDialog = (itemPath: string) => {
    setItemPathToDelete(itemPath);
    deleteDialog.onTrue();
    handleCloseMenu();
  };

  const handleCloseDeleteDialog = () => {
    deleteDialog.onFalse();
    setItemPathToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemPathToDelete || !projectId) return;

    try {
      console.log(`Deleting item with path: ${itemPathToDelete} for project: ${projectId}`);
      const success = await deleteItem({ projectId, itemPath: itemPathToDelete });

      if (success) {
        console.log('Item deleted successfully');
        refreshItems(); // Refresh list after successful deletion
      } else {
        console.error('Error deleting item');
        // Potentially show a toast message for the error from deleteItemError
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      // Potentially show a toast message for the error
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const platformName = platform === 'evm' ? 'Contract' : platform === 'solana' ? 'Program' : 'Item';
  const createNewText = `Create New ${platformName}`;

  const renderItems = () => {
    if (itemsLoading) {
      // This covers projectLoading initially
      return (
        <Card>
          <CardHeader
            title={platform === 'evm' ? 'Contracts' : platform === 'solana' ? 'Programs' : 'Items'}
            // Yüklenirken sağ üstte buton göstermiyoruz.
          />
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}
            >
              <CircularProgress />
            </Box>
          </CardContent>
        </Card>
      );
    }

    if (itemsError) {
      return (
        <Card>
          <CardHeader
            title={
              platform === 'evm' ? 'Kontratlar' : platform === 'solana' ? 'Programlar' : 'Öğeler'
            }
          />
          <CardContent>
            <Typography color="error">Veri yüklenirken hata: {itemsError.message}</Typography>
          </CardContent>
        </Card>
      );
    }

    if (!displayedItems || displayedItems.length === 0) {
      return (
        <Card>
          <CardHeader
            title={platform === 'evm' ? 'Contracts' : platform === 'solana' ? 'Programs' : 'Items'}
            // Sağ üstte buton YOK, çünkü veri yok.
          />
          <CardContent>
            <EmptyContent
              title={`No ${platform === 'evm' ? 'Contracts' : platform === 'solana' ? 'Programs' : 'Items'} Yet`}
              description={`Get started by creating a new ${platform === 'evm' ? 'contract' : platform === 'solana' ? 'program' : 'item'}.`}
              action={
                !projectLoading &&
                platform && ( // Platform tanımlı ve proje yüklenmediyse
                  <Box sx={{ mt: 4, mb: 2 }}>
                    <Button
                      color="primary"
                      onClick={createModal.onTrue} // onClick eklendi
                    >
                      {createNewText}
                    </Button>
                  </Box>
                )
              }
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader
          title={platform === 'evm' ? 'Contracts' : platform === 'solana' ? 'Programs' : 'Items'}
          action={
            !projectLoading &&
            platform &&
            displayedItems &&
            displayedItems.length > 0 && ( // Sadece veri varsa göster
              <Button
                color="primary"
                variant="contained"
                onClick={createModal.onTrue}
                startIcon={<Iconify icon="material-symbols:add" />}
              >
                {createNewText}
              </Button>
            )
          }
        />
        <CardContent>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Path</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedItems.map((item: ProjectHierarchyItem) => (
                  <TableRow key={item.id || item.path} hover>
                    <TableCell>
                      <ListItemText
                        primary={item.name || 'Nameless Item'}
                        primaryTypographyProps={{ typography: 'subtitle2', fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>{item.file_type || item.type}</TableCell>
                    <TableCell>{item.path}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          color="default"
                          onClick={(event) => handleOpenMenu(event, item.id || item.path)}
                        >
                          <Iconify icon="solar:menu-dots-bold" />
                        </IconButton>
                      </Tooltip>

                      <Menu
                        keepMounted
                        id={`actions-menu-${item.id || item.path}`}
                        anchorEl={menuAnchorEl}
                        open={Boolean(menuAnchorEl) && activeItemId === (item.id || item.path)}
                        onClose={handleCloseMenu}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        {platform === 'evm' && item.file_type === 'sol' && (
                          <MenuItem
                            onClick={() => {
                              handleOpenDeploymentModal(item);
                              handleCloseMenu();
                            }}
                          >
                            <Iconify icon="eva:external-link-fill" sx={{ mr: 1 }} />
                            Deploy
                          </MenuItem>
                        )}
                        <MenuItem
                          onClick={() => {
                            handleOpenDeleteDialog(item.path);
                            handleCloseMenu();
                          }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
                          Delete
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderFrontends = () => {
    if (frontendsLoading) {
      return (
        <Card sx={{ p: 3, minHeight: 300 }}>
          <EmptyContent
            title="No Frontends Yet"
            description="Get started by creating a new frontend to the project."
            action={
              <Box sx={{ mt: 4, mb: 2 }}>
                <Button color="primary">Create New Frontend</Button>
              </Box>
            }
          />
        </Card>
      );
    }

    if (frontendsError) {
      return (
        <Card>
          <CardHeader title="Frontends" />

          <CardContent>
            <Typography color="error">Error loading frontends: {frontendsError.message}</Typography>
          </CardContent>
        </Card>
      );
    }

    if (!frontends || frontends.length === 0) {
      return (
        <Card sx={{ p: 3, minHeight: 300 }}>
          <EmptyContent
            title="No Frontends Yet"
            description="Start by adding a new frontend to the project."
            action={
              <Box sx={{ mt: 4, mb: 2 }}>
                <Button color="primary">Create New Frontend</Button>
              </Box>
            }
          />
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader title="Frontends" action={<Button color="primary">Create New</Button>} />

        <CardContent>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Framework</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Deployment Provider</TableCell>
                  <TableCell>Live URL</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {frontends.map((frontend: Frontend) => {
                  const deployment = Array.isArray(frontend.frontend_deployments)
                    ? frontend.frontend_deployments[0]
                    : frontend.frontend_deployments;
                  return (
                    <TableRow key={frontend.id} hover>
                      <TableCell>
                        <ListItemText
                          primary={frontend.name || 'Unnamed Frontend'}
                          secondary={frontend.created_at ? fDate(frontend.created_at) : '-'}
                          primaryTypographyProps={{ typography: 'subtitle2', fontWeight: 'bold' }}
                          secondaryTypographyProps={{ typography: 'caption', component: 'span' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={frontend.framework || 'Unknown'}
                          color="default"
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={frontend.status || 'draft'}
                          color={
                            (frontend.status === 'published' && 'success') ||
                            (frontend.status === 'draft' && 'warning') ||
                            (frontend.status === 'error' && 'error') ||
                            'default'
                          }
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        {deployment?.provider ? (
                          <Chip
                            size="small"
                            label={deployment.provider}
                            color="info"
                            variant="soft"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {deployment?.url ? (
                          <Typography
                            variant="body2"
                            component="a"
                            href={deployment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: 'primary.main',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {deployment.url.replace(/^https?:\/\//i, '')}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {deployment?.url && (
                            <Button
                              size="small"
                              color="primary"
                              variant="soft"
                              startIcon={<Iconify icon="eva:external-link-fill" />}
                              href={deployment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open
                            </Button>
                          )}
                          <Button
                            size="small"
                            color="secondary"
                            variant="soft"
                            startIcon={<Iconify icon="eva:code-fill" />}
                          >
                            Code
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={sx} {...other}>
      <Stack spacing={3}>
        {renderItems()}
        {renderFrontends()}
      </Stack>

      {/* Conditionally render ContractCreateModal only if platform is defined */}
      {platform && (
        <ContractCreateModal
          open={createModal.value}
          onClose={createModal.onFalse}
          projectId={projectId}
          platform={platform}
          onSuccess={handleItemCreated}
        />
      )}

      {selectedItem && (
        <ContractDeploymentModal
          open={deploymentModal.value}
          onClose={deploymentModal.onFalse}
          contractName={selectedItem.name || 'Öğe'}
          deployments={[]}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.value}
        onClose={deleteDialog.onFalse}
        title={`${platformName} Sil`}
        content={`Emin misiniz? ${itemPathToDelete ? `'${itemPathToDelete}' yolundaki ${platformName.toLowerCase()}` : `${platformName.toLowerCase()}`} silinecek. Bu işlem geri alınamaz.`}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Siliniyor...' : 'Sil'}
          </Button>
        }
      />
    </Box>
  );
}
