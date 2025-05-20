'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type { ButtonBaseProps } from '@mui/material/ButtonBase';

import { useRouter } from 'next/navigation';
import { usePopover } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { Iconify } from 'src/components/iconify';

import { paths } from 'src/routes/paths';

import { useProjects, useCurrentProject } from 'src/hooks/projects';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { CustomPopover } from 'src/components/custom-popover';
// ----------------------------------------------------------------------

export type WorkspacesPopoverProps = ButtonBaseProps & {
  data?: {
    id: string;
    name: string;
    logo: string;
    visibility: string;
  }[];
  loading?: boolean;
};

export function WorkspacesPopover({ data = [], loading, sx, ...other }: WorkspacesPopoverProps) {
  const mediaQuery = 'sm';
  const router = useRouter();

  const { open, anchorEl, onClose, onOpen } = usePopover();
  const [isChangingWorkspace, setIsChangingWorkspace] = useState(false);

  // useProjects hook'u ile projeleri çek
  const { projects, projectsLoading, projectsError, projectsEmpty } = useProjects();

  // useCurrentProject hook'u ile aktif proje ID'sini al ve değiştir
  const { projectId, setCurrentProject } = useCurrentProject();

  // Projeleri workspace formatına dönüştür
  const projectsAsWorkspaces = useMemo<WorkspacesPopoverProps['data']>(
    () =>
      projects?.map((project) => ({
        id: project.id,
        name: project.name,
        logo: project.logo_url || `${CONFIG.assetsDir}/assets/icons/workspaces/logo-1.webp`,
        visibility: project.visibility === 'private' ? 'Private' : 'Public',
      })) || [],
    [projects]
  );

  // Eğer projeler yüklenmemişse, boş bir dizi göster
  const workspaceData: WorkspacesPopoverProps['data'] =
    projectsLoading || !projectsAsWorkspaces
      ? []
      : projectsAsWorkspaces.length > 0
        ? projectsAsWorkspaces
        : data || [];

  // Seçili workspace'i tut, başlangıçta null
  const [workspace, setWorkspace] = useState<(typeof workspaceData)[0] | null>(null);

  // Projeler değiştiğinde veya projectId değiştiğinde seçili workspace'i güncelle
  useEffect(() => {
    if (!projectsLoading && workspaceData.length > 0) {
      // Eğer localStorage'da geçerli bir proje ID varsa ve bu proje listemizde varsa onu bul ve ayarla
      if (projectId) {
        const savedProject = workspaceData.find((w) => w.id === projectId);
        if (savedProject) {
          setWorkspace(savedProject);
          return; // Proje bulundu ve ayarlandı, devam etme
        }
        // Eğer localStorage'daki ID listede yoksa (örn. projeden çıkarıldı), seçimi temizle
        setCurrentProject(null); // localStorage'daki geçersiz ID'yi temizle
      }
      // Geçerli bir proje ID bulunamadıysa veya ID listede yoksa, workspace'i null yap (veya bırak)
      setWorkspace(null);
    } else if (!projectsLoading && workspaceData.length === 0) {
      // Eğer proje yoksa seçili workspace'i null yap ve localStorage'ı temizle
      setWorkspace(null);
      setCurrentProject(null);
    }
  }, [workspaceData, projectsLoading, projectId, setCurrentProject]);

  const handleChangeWorkspace = useCallback(
    async (newValue: (typeof data)[0]) => {
      if (newValue.id === projectId) {
        onClose();
        return;
      }

      setIsChangingWorkspace(true);
      onClose();

      try {
        // Önce yeni projeyi localStorage'a kaydet
        if (newValue && newValue.id) {
          await setCurrentProject(newValue.id);
          console.log(`Aktif proje değiştirildi: ${newValue.id}`);
        }

        // Workspace değişikliğini uygula
        setWorkspace(newValue);

        // Kısa bir gecikme ile sayfayı yenile
        setTimeout(() => {
          window.location.href = paths.dashboard.root;
        }, 500);
      } catch (error) {
        console.error('Workspace değiştirilirken hata:', error);
        setIsChangingWorkspace(false);
      }
    },
    [onClose, setCurrentProject, projectId]
  );

  const buttonBg: SxProps<Theme> = {
    height: 1,
    zIndex: -1,
    opacity: 0,
    content: "''",
    borderRadius: 1,
    position: 'absolute',
    visibility: 'hidden',
    bgcolor: 'action.hover',
    width: 'calc(100% + 8px)',
    transition: (theme) =>
      theme.transitions.create(['opacity', 'visibility'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shorter,
      }),
    ...(open && {
      opacity: 1,
      visibility: 'visible',
    }),
  };

  // Loading overlay bileşeni
  const LoadingOverlay = () => (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 9999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress sx={{ color: 'white', mb: 2 }} />
      <Typography color="white" variant="h6">
        Changing workspace...
      </Typography>
    </Box>
  );

  const renderButton = () => {
    // Eğer workspace null ise veya yükleniyorsa farklı bir buton göster
    if (projectsLoading || !workspace) {
      return (
        <ButtonBase
          disableRipple
          onClick={onOpen}
          sx={[
            {
              py: 0.5,
              gap: 1,
              color: 'text.secondary', // Daha soluk bir renk
              '&::before': buttonBg,
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
          {...other}
        >
          {projectsLoading ? (
            <CircularProgress size={20} sx={{ color: 'inherit' }} /> // Yükleniyor ikonu
          ) : (
            <Iconify icon="mingcute:add-line" width={24} /> // Varsayılan ikon
          )}
          <Box
            component="span"
            sx={{ typography: 'subtitle2', display: { xs: 'none', [mediaQuery]: 'inline-flex' } }}
          >
            {projectsLoading ? 'Loading...' : 'Select Project'}
          </Box>
          <Iconify width={16} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
        </ButtonBase>
      );
    }

    // Seçili bir workspace varsa normal butonu göster
    return (
      <ButtonBase
        disableRipple
        onClick={onOpen}
        sx={[
          {
            py: 0.5,
            gap: { xs: 0.5, [mediaQuery]: 1 },
            '&::before': buttonBg,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {/* Mevcut logo, isim, visibility label ve chevron ikonu */}
        <Box
          component="img"
          alt={workspace?.name}
          src={workspace?.logo}
          sx={{ width: 24, height: 24, borderRadius: '50%' }}
        />

        <Box
          component="span"
          sx={{ typography: 'subtitle2', display: { xs: 'none', [mediaQuery]: 'inline-flex' } }}
        >
          {workspace?.name}
        </Box>

        <Label
          color={workspace?.visibility === 'Public' ? 'default' : 'info'}
          sx={{
            height: 22,
            cursor: 'inherit',
            display: { xs: 'none', [mediaQuery]: 'inline-flex' },
          }}
        >
          {workspace?.visibility}
        </Label>

        <Iconify width={16} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
      </ButtonBase>
    );
  };

  const renderMenuList = () => {
    const projectsEmpty = !projectsLoading && workspaceData.length === 0;

    return (
      <CustomPopover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        slotProps={{
          arrow: { placement: 'top-left' },
          paper: { sx: { mt: 0.5, ml: -1.55 } },
        }}
      >
        <MenuList sx={{ width: 240 }}>
          {projectsLoading ? (
            <MenuItem
              disabled
              sx={{ height: 48, justifyContent: 'center', color: 'text.secondary' }}
            >
              <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
            </MenuItem>
          ) : projectsEmpty ? (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                You don't have any projects yet.
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<Iconify icon="carbon:chevron-sort" />}
                onClick={() => {
                  onClose();
                  router.push(paths.dashboard.projects.new);
                }}
              >
                Create New Project
              </Button>
            </Box>
          ) : (
            // Proje listesi
            workspaceData.map((option) => (
              <MenuItem
                key={option.id}
                selected={option.id === workspace?.id}
                onClick={() => handleChangeWorkspace(option)}
                sx={{ height: 48 }}
              >
                {/* Mevcut öğe içeriği */}
                <Avatar alt={option.name} src={option.logo} sx={{ width: 24, height: 24, mr: 1 }} />

                <Box component="span" sx={{ flexGrow: 1, fontWeight: 'fontWeightMedium' }}>
                  {option.name}
                </Box>

                <Label color={option.visibility === 'Public' ? 'default' : 'info'}>
                  {option.visibility}
                </Label>
              </MenuItem>
            ))
          )}
        </MenuList>
      </CustomPopover>
    );
  };

  return (
    <>
      {renderButton()}
      {renderMenuList()}
      {isChangingWorkspace && <LoadingOverlay />}
    </>
  );
}
