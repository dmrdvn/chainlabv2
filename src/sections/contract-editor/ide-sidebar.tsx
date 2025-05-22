import type { ProjectFile } from 'src/types/project';
import type { TreeItem2Props } from '@mui/x-tree-view/TreeItem2';

import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { TreeItem2 } from '@mui/x-tree-view/TreeItem2';
import { treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { alpha, styled, useTheme } from '@mui/material/styles';

import { getFileIconElement } from 'src/utils/file-icons.utils';
import { buildFileTree, type FileTreeNode } from 'src/utils/build-file-tree';

import { Iconify } from 'src/components/iconify';
import { AnimateBorder } from 'src/components/animate';

import { useAuthContext } from 'src/auth/hooks';

import { IdeDeploy } from './ide-deploy';
import { IdeCompiler } from './ide-compiler';
import { createSettingsFile } from './ide-editor-area';

import type { DeployedEvmContractInfo, DeployedSolanaProgramInfo } from './ide-deploy';
import type {
  ArtifactForDeploy,
  EvmCompilerSettings,
  SolanaCompilerSettings,
  SimplifiedCompilationData,
} from './view/contract-editor-view';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getProjectFile } from 'src/actions/project';

interface IdeSidebarProps {
  activeView: string;
  onFileSelect: (file: ProjectFile) => void;
  files: ProjectFile[] | null | undefined;
  isLoading: boolean;
  onSettingsClick?: () => void;
  onOpenSettingsPanel?: () => void;
  platform?: 'evm' | 'solana' | null;
  onCompileEvm: (settings: EvmCompilerSettings) => Promise<void>;
  onCompileSolana: (settings: SolanaCompilerSettings) => Promise<void>;
  isCompiling: boolean;
  simplifiedCompilationData?: SimplifiedCompilationData | null;
  onDeployEvm: (deployConfig: {
    environmentId: string;
    walletAddress: string;
    gasLimit?: string;
    value?: string;
    valueUnit?: string;
    artifactToDeploy: ArtifactForDeploy;
  }) => Promise<void>;
  onDeploySolana: (deployConfig: {
    environmentId: string;
    walletAddress: string;
    artifactToDeploy: ArtifactForDeploy;
  }) => Promise<void>;
  isDeploying: boolean;
  deployedEvmContracts: DeployedEvmContractInfo[];
  deployedSolanaPrograms: DeployedSolanaProgramInfo[];
  expandedEvmAccordion: string | false;
  onEvmAccordionChange: (panel: string, isExpanded: boolean) => void;
  expandedSolanaAccordion: string | false;
  onSolanaAccordionChange: (panel: string, isExpanded: boolean) => void;
  compiledArtifactsForDeploy?: ArtifactForDeploy[];
  projectName?: string;
}

const StyledTreeItem = styled((props: TreeItem2Props) => {
  const { itemId, label, ...other } = props;
  const iconElement = getFileIconElement(itemId, {
    sx: { width: 15, height: 15, mr: 0.5 },
  });

  return <TreeItem2 itemId={itemId} label={label} slots={{ icon: () => iconElement }} {...other} />;
})(({ theme }) => ({
  [`& .${treeItemClasses.content}`]: {
    borderRadius: theme.spacing(0.5),
    paddingTop: theme.spacing(0.25),
    paddingBottom: theme.spacing(0.25),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: 'var(--tree-view-color)',
    },
  },
  [`& .${treeItemClasses.iconContainer}`]: {
    marginRight: theme.spacing(0),
  },
  [`& .${treeItemClasses.label}`]: {
    fontWeight: 'inherit',
    color: 'inherit',
    paddingLeft: theme.spacing(0),
    fontSize: `calc(${theme.typography.caption.fontSize} + 2px)`,
  },
}));

export default function IdeSidebar({
  activeView,
  onFileSelect,
  files,
  isLoading,
  onSettingsClick,
  onOpenSettingsPanel,
  platform,
  onCompileEvm,
  onCompileSolana,
  isCompiling,
  simplifiedCompilationData,
  onDeployEvm,
  onDeploySolana,
  isDeploying,
  deployedEvmContracts,
  deployedSolanaPrograms,
  expandedEvmAccordion,
  onEvmAccordionChange,
  expandedSolanaAccordion,
  onSolanaAccordionChange,
  compiledArtifactsForDeploy,
  projectName,
}: IdeSidebarProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const { user } = useAuthContext();

  const handleDownloadProject = async () => {
    if (!files || files.length === 0) {
      alert('No files available to download.');
      return;
    }

    const zip = new JSZip();
    const projectFolderName = 'project-files';
    const projectFolder = zip.folder(projectFolderName);

    if (!projectFolder) {
      alert('Error creating project archive.');
      return;
    }

    let filesProcessed = 0;

    for (const file of files) {
      if (!file.is_directory) {
        try {
          const fileDataWithContent = await getProjectFile(file.id);
          const content = fileDataWithContent?.content || '';

          let relativePath = file.file_path;
          if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
          }

          projectFolder.file(relativePath, content);
          filesProcessed++;
        } catch (error) {
          console.error(`Error fetching content for file ${file.file_path}:`, error);
        }
      }
    }

    if (filesProcessed === 0 && files.some((f) => !f.is_directory)) {
      alert('No file contents could be processed for download.');
      return;
    }

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${projectFolderName}.zip`);
    } catch (error) {
      console.error('Error generating zip file:', error);
      alert('Error generating project archive.');
    }
  };

  const fileTree = useMemo(() => {
    if (isLoading || !files || files.length === 0) {
      return [];
    }
    const rawBuiltTreeWithRoot = buildFileTree(files);

    if (rawBuiltTreeWithRoot.length === 1 && rawBuiltTreeWithRoot[0].id === '__artificial_root__') {
      return rawBuiltTreeWithRoot[0].children || [];
    }

    console.warn(
      'IdeSidebar: buildFileTree did not return the expected artificial root. Using empty tree as fallback.',
      rawBuiltTreeWithRoot
    );
    return [];
  }, [files, isLoading]);

  useEffect(() => {
    if (isLoading || !files || files.length === 0) {
      setExpanded([]);
    }
  }, [files, isLoading]);

  const handleToggle = useCallback((event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  }, []);

  const handleSelect = useCallback(
    (event: React.SyntheticEvent, itemId: string | null) => {
      setSelected(itemId);

      if (itemId && files) {
        const selectedFileNode = files.find((file) => {
          const normalizedPath = file.file_path.startsWith('/')
            ? file.file_path.substring(1)
            : file.file_path;
          return normalizedPath === itemId;
        });

        if (selectedFileNode) {
          if (!selectedFileNode.is_directory) {
            onFileSelect(selectedFileNode);
          }
        }
      }
    },
    [files, onFileSelect]
  );

  const getItemLabel = useCallback((item: FileTreeNode) => item.name, []);
  const getItemId = useCallback((item: FileTreeNode) => item.id, []);

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    }
    if (onOpenSettingsPanel) {
      onOpenSettingsPanel();
    } else {
      const settingsFile = createSettingsFile();
      onFileSelect(settingsFile);
    }
  };

  return (
    <Box
      sx={{
        width: 220,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* Explorer View */}
      {activeView === 'explorer' && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: theme.palette.action.hover,
              px: 2,
              py: 1,
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" alignItems="center">
              <Iconify icon="solar:folder-open-bold" sx={{ mr: 1, width: 18, height: 18 }} />
              <Typography
                variant="subtitle1"
                sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}
              >
                Explorer
              </Typography>
            </Stack>
            <IconButton
              onClick={handleDownloadProject}
              size="small"
              title="Download Project as ZIP"
              sx={{
                color: 'text.secondary',
                '&:hover': { backgroundColor: alpha(theme.palette.action.active, 0.1) },
              }}
            >
              <Iconify icon="mdi:download-box-outline" />
            </IconButton>
          </Box>
          <Divider />
          <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', p: 2 }}>
            {isLoading ? (
              <Typography sx={{ p: 2, color: 'text.secondary' }}>Loading files...</Typography>
            ) : fileTree.length > 0 ? (
              <RichTreeView
                items={fileTree}
                getItemId={getItemId}
                getItemLabel={getItemLabel}
                expandedItems={expanded}
                selectedItems={selected}
                onExpandedItemsChange={handleToggle}
                onSelectedItemsChange={handleSelect}
                aria-label="file explorer"
                sx={{
                  flexGrow: 1,
                }}
                slots={{
                  item: StyledTreeItem,
                }}
              />
            ) : (
              <Typography sx={{ p: 2, color: 'text.secondary' }}>No files found.</Typography>
            )}
          </Box>
        </>
      )}
      {/* Search View */}
      {activeView === 'search' && (
        <>
          {/* Header for Search */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: theme.palette.action.hover,
              px: 2,
              py: 1,
            }}
          >
            <Iconify icon="mdi:magnify" sx={{ mr: 1, width: 18, height: 18 }} />
            <Typography variant="subtitle1" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              Search
            </Typography>
          </Box>
          <Divider />
          {/* Content for Search */}
          <Box sx={{ p: 2 }}>
            <Typography sx={{ color: 'text.secondary' }}>
              Search functionality coming soon...
            </Typography>
          </Box>
        </>
      )}
      {/* Source Control View */}
      {activeView === 'source_control' && (
        <>
          {/* Header for Source Control */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: theme.palette.action.hover,
              px: 2,
              py: 1,
            }}
          >
            <Iconify icon="mdi:source-branch" sx={{ mr: 1, width: 18, height: 18 }} />
            <Typography variant="subtitle1" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              Source Control
            </Typography>
          </Box>
          <Divider />
          {/* Content for Source Control */}
          <Box sx={{ p: 2 }}>
            <Typography sx={{ color: 'text.secondary' }}>
              Source control integration coming soon...
            </Typography>
          </Box>
        </>
      )}
      {/* Debug View */}
      {activeView === 'debug' && (
        <>
          {/* Header for Debug */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: theme.palette.action.hover,
              px: 2,
              py: 1,
            }}
          >
            <Iconify icon="mdi:bug-outline" sx={{ mr: 1, width: 18, height: 18 }} />
            <Typography variant="subtitle1" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              Debug
            </Typography>
          </Box>
          <Divider />
          {/* Content for Debug */}
          <Box sx={{ p: 2 }}>
            <Typography sx={{ color: 'text.secondary' }}>Debugging tools coming soon...</Typography>
          </Box>
        </>
      )}

      {/* Compiler View */}
      {activeView === 'compiler' && (
        <>
          {/* Header for Compiler */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: theme.palette.action.hover,
              px: 2,
              py: 1,
            }}
          >
            <Iconify icon="mdi:play-circle-outline" sx={{ mr: 1, width: 18, height: 18 }} />
            <Typography variant="subtitle1" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              Compiler
            </Typography>
          </Box>
          <Divider />
          {/* Content for Compiler */}
          <Box
            sx={{
              p: 0,
              overflowY: 'auto',
              scrollbarWidth: '1px',
              scrollbarColor: 'transparent transparent',
            }}
          >
            <IdeCompiler
              platform={platform || null}
              onCompileEvm={onCompileEvm}
              onCompileSolana={onCompileSolana}
              isCompiling={isCompiling}
              compilationUpdate={simplifiedCompilationData || null}
            />
          </Box>
        </>
      )}
      {/* Deploy View */}
      {activeView === 'deploy' && (
        <>
          {/* Header for Deploy */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: theme.palette.action.hover,
              px: 2,
              py: 1,
            }}
          >
            <Iconify icon="mdi:cloud-upload-outline" sx={{ mr: 1, width: 18, height: 18 }} />
            <Typography variant="subtitle1" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              Deploy & Run
            </Typography>
          </Box>
          <Divider />
          {/* Content for Deploy */}
          <Box
            sx={{
              p: 0,
              overflowY: 'auto',
              scrollbarWidth: '1px',
              scrollbarColor: 'transparent transparent',
            }}
          >
            <IdeDeploy
              platform={platform || null}
              onDeployEvm={onDeployEvm}
              onDeploySolana={onDeploySolana}
              isDeploying={isDeploying}
              deployedEvmContracts={deployedEvmContracts}
              deployedSolanaPrograms={deployedSolanaPrograms}
              expandedEvmAccordion={expandedEvmAccordion}
              onEvmAccordionChange={onEvmAccordionChange}
              expandedSolanaAccordion={expandedSolanaAccordion}
              onSolanaAccordionChange={onSolanaAccordionChange}
              compiledArtifactsForDeploy={compiledArtifactsForDeploy || []}
            />
          </Box>
        </>
      )}
      {/* Extensions View */}
      {activeView === 'extensions' && (
        <>
          {/* Header for Extensions */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: theme.palette.action.hover,
              px: 2,
              py: 1,
            }}
          >
            <Iconify icon="mdi:puzzle-outline" sx={{ mr: 1, width: 18, height: 18 }} />
            <Typography variant="subtitle1" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              Extensions
            </Typography>
          </Box>
          <Divider />
          {/* Content for Extensions */}
          <Box sx={{ p: 2 }}>
            <Typography sx={{ color: 'text.secondary' }}>Manage extensions soon...</Typography>
          </Box>
        </>
      )}
      {/* Settings View */}
      {activeView === 'settings' && (
        <>
          {/* Header for Settings */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: theme.palette.action.hover,
              px: 2,
              py: 1,
            }}
          >
            <Iconify icon="mdi:cog-outline" sx={{ mr: 1, width: 18, height: 18 }} />
            <Typography variant="subtitle1" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              Settings
            </Typography>
          </Box>
          <Divider />
          {/* Content for Settings with profile information */}
          <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
            {/* User Profile Card - only show if user is logged in */}
            {user && (
              <Card
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 2,
                }}
              >
                <Stack spacing={1} alignItems="center">
                  <AnimateBorder
                    sx={{
                      p: '6px',
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                    }}
                    slotProps={{
                      primaryBorder: {
                        size: 120,
                        sx: { color: 'primary.main' },
                      },
                    }}
                  >
                    <Avatar
                      src={user?.photoURL}
                      alt={user?.displayName}
                      sx={{ width: 1, height: 1 }}
                    >
                      <Typography fontSize={40}>
                        {user?.displayName?.charAt(0).toUpperCase()}
                      </Typography>
                    </Avatar>
                  </AnimateBorder>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {user?.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {user?.email}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: 10,
                        color: theme.palette.primary.main,
                        fontWeight: 'medium',
                      }}
                    >
                      Developer
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            )}

            {/* Account Settings - only show if user is logged in */}
            {user && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="overline"
                  sx={{
                    display: 'block',
                    mb: 1,
                    color: 'text.secondary',
                    fontWeight: 'bold',
                  }}
                >
                  Account
                </Typography>
                <Stack spacing={1.5}>
                  <Button
                    fullWidth
                    startIcon={<Iconify icon="mdi:account-edit-outline" />}
                    sx={{
                      justifyContent: 'flex-start',
                      px: 2,
                      fontWeight: 'normal',
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    fullWidth
                    startIcon={<Iconify icon="mdi:account-details-outline" />}
                    sx={{
                      justifyContent: 'flex-start',
                      px: 2,
                      fontWeight: 'normal',
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    Account Settings
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Editor Settings - changed to Settings */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  mb: 1,
                  color: 'text.secondary',
                  fontWeight: 'bold',
                }}
              >
                Settings
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="mdi:cog-outline" />}
                onClick={handleSettingsClick}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: 2,
                }}
              >
                General Settings
              </Button>
            </Box>

            {/* Theme Settings - changed to Integrations */}
            <Box>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  mb: 1,
                  color: 'text.secondary',
                  fontWeight: 'bold',
                }}
              >
                Integrations
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  startIcon={<Iconify icon="mdi:code-braces" />}
                  sx={{
                    justifyContent: 'flex-start',
                    px: 2,
                    fontWeight: 'normal',
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  IDE Settings
                </Button>
                <Button
                  fullWidth
                  startIcon={<Iconify icon="mdi:api" />}
                  sx={{
                    justifyContent: 'flex-start',
                    px: 2,
                    fontWeight: 'normal',
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  API Integrations
                </Button>
              </Stack>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
