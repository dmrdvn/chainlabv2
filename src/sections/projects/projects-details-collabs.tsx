import type { BoxProps } from '@mui/material/Box';
import type { ProjectCollaborator } from 'src/types/member';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import {
  useProjectOwner,
  useProjectMembers,
  useRemoveProjectMember,
  useUpdateMemberPermissions,
  useCancelPendingInvitationMutation, // Hook'u import et
} from 'src/hooks/projects';

import { Iconify } from 'src/components/iconify';

import { RoleSelect } from './role-select';
import { ProjectsInviteDialog } from './projects-invite-dialog';

// İzin ikonları için yardımcı bir map
const PERMISSION_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  view: { icon: 'mdi:eye', color: 'info.main', label: 'View' },
  edit: { icon: 'mdi:pencil', color: 'warning.main', label: 'Edit' },
  delete: { icon: 'mdi:delete', color: 'error.main', label: 'Delete' },
  create: { icon: 'mdi:plus-circle', color: 'success.main', label: 'Create' },
  admin: { icon: 'mdi:shield-crown', color: 'primary.main', label: 'Admin' },
  manage: { icon: 'mdi:cog', color: 'primary.dark', label: 'Manage' },
  default: { icon: 'mdi:check-circle', color: 'text.secondary', label: 'Permission' },
};

// ----------------------------------------------------------------------

type Props = BoxProps & {
  projectId: string;
  loading?: boolean;
  onSuccess?: () => void;
};

export function ProjectsDetailsCollabs({
  projectId,
  loading = false,
  onSuccess,
  sx,
  ...other
}: Props) {
  // üye davet modal durumu
  const [inviteOpen, setInviteOpen] = useState(false);

  // İşlem yapılan daveti takip eden state
  const [processingInvitation, setProcessingInvitation] = useState<string>('');

  // Sayfalama için state'ler
  const [currentPage, setCurrentPage] = useState(1); // Mevcut sayfayı takip et
  const itemsPerPage = 9; // Sayfa başına gösterilecek öğe sayısı

  // Menü kontrolleri için state'ler
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCollaborator, setSelectedCollaborator] = useState<ProjectCollaborator | null>(
    null
  );

  // Silme onayı için dialog state'i
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // İzin düzenleme dialog state'i
  const [editPermissionsOpen, setEditPermissionsOpen] = useState(false);
  const [processingPermissions, setProcessingPermissions] = useState(false);

  // Aktif üyeyi ve rol modalını yönetmek için state'ler
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);

  // Gerekli hook'ları kullan
  const { collaborators, collaboratorsLoading } = useProjectMembers(projectId);
  const { owner } = useProjectOwner(projectId);
  const { removeMember, loading: removeLoading } = useRemoveProjectMember();
  const { updatePermissions, loading: updateLoading } = useUpdateMemberPermissions();
  // Hook'u initialize et
  const {
    cancelPendingInvitation,
    loading: cancelLoading,
    error: cancelError,
  } = useCancelPendingInvitationMutation();

  // Modal açma/kapama işlemleri
  const handleOpenInvite = () => setInviteOpen(true);
  const handleCloseInvite = () => setInviteOpen(false);

  // Sayfalama için fonksiyonlar
  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  }, []);

  // Menü açma işlemi
  const handleOpenMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>, collaborator: ProjectCollaborator) => {
      setMenuAnchorEl(event.currentTarget);
      setSelectedCollaborator(collaborator);
    },
    [setMenuAnchorEl, setSelectedCollaborator]
  );

  // Menü kapatma işlemi
  const handleCloseMenu = useCallback(() => {
    setMenuAnchorEl(null);
    setSelectedCollaborator(null);
  }, [setMenuAnchorEl, setSelectedCollaborator]);

  // Silme dialog'unu açma işlemi
  const handleOpenDeleteDialog = useCallback(
    (collaborator: ProjectCollaborator) => {
      handleCloseMenu();
      setSelectedCollaborator(collaborator);
      setOpenDeleteDialog(true);
    },
    [handleCloseMenu, setSelectedCollaborator, setOpenDeleteDialog]
  );

  // Silme dialog'unu kapatma işlemi
  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
    setSelectedCollaborator(null);
  }, [setOpenDeleteDialog, setSelectedCollaborator]);

  // İzin düzenleme dialog'unu açma işlemi
  const handleOpenEditPermissions = useCallback(
    (collaborator: ProjectCollaborator) => {
      handleCloseMenu();
      setSelectedCollaborator(collaborator);
      setEditPermissionsOpen(true);
    },
    [handleCloseMenu, setSelectedCollaborator, setEditPermissionsOpen]
  );

  // İzin düzenleme dialog'unu kapatma işlemi
  const handleCloseEditPermissions = useCallback(() => {
    setEditPermissionsOpen(false);
    setSelectedCollaborator(null);
  }, [setEditPermissionsOpen, setSelectedCollaborator]);

  // Üye izinlerini güncelleme işlemi
  const handleUpdatePermissions = useCallback(
    async (selectedFlags: string[]) => {
      // Sadece üyelerin (user_id'si olanların) izinleri güncellenebilir
      if (
        !selectedCollaborator ||
        selectedCollaborator.collaborator_type !== 'member' ||
        !selectedCollaborator.user_id ||
        !projectId
      )
        return;

      // Artık user_id'nin null olmadığından eminiz
      const success = await updatePermissions(
        projectId,
        selectedCollaborator.user_id,
        selectedFlags
      );
      if (success) {
        handleCloseEditPermissions();
      }
    },
    [selectedCollaborator, projectId, updatePermissions, handleCloseEditPermissions]
  );

  // Üye silme işlemi
  const handleRemoveMember = useCallback(async () => {
    // Sadece üyeler kaldırılabilir
    if (!selectedCollaborator || selectedCollaborator.collaborator_type !== 'member' || !projectId)
      return;
    console.log('Removing member with project_members.id:', selectedCollaborator.id);

    const success = await removeMember(projectId, selectedCollaborator.id); // selectedCollaborator.id KULLANILMALI
    if (success) {
      handleCloseDeleteDialog();
    }
  }, [selectedCollaborator, projectId, removeMember, handleCloseDeleteDialog]);

  // Davet başarılı olduğunda çağrılacak fonksiyon
  const handleInviteSuccess = useCallback(() => {
    if (onSuccess) onSuccess();
  }, [onSuccess]);

  // Debug bilgileri - üyeleri ve yükleme durumunu göster
  /*  console.log('ProjectsDetailsCollabs - Debug Info:');
  console.log('- Loading:', loading || collaboratorsLoading);
  console.log('- Collaborators:', collaborators);
  console.log('- Collaborators length:', collaborators?.length || 0);
  console.log('- Project ID:', projectId); */

  if (loading || collaboratorsLoading) {
    return (
      <Box
        sx={[
          {
            gap: 3,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {[...Array(3)].map((_, index) => (
          <Card key={index} sx={{ p: 3, gap: 2, display: 'flex' }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
              <ListItemText
                primary={<Skeleton variant="text" width="60%" />}
                secondary={<Skeleton variant="text" width="40%" />}
              />
              <Box sx={{ gap: 1, display: 'flex' }}>
                <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>
    );
  }

  if (collaborators.length === 0) {
    return (
      <>
        <Box
          sx={{
            p: 5,
            display: 'flex',
            textAlign: 'center',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            No Collaborators Found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            This project doesn&apos;t have any collaborators yet.
          </Typography>

          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:person-add-fill" />}
            onClick={handleOpenInvite}
          >
            Add Team Member
          </Button>
        </Box>

        {/* Üye davet modalini render et */}
        <ProjectsInviteDialog
          projectId={projectId}
          open={inviteOpen}
          onClose={handleCloseInvite}
          onSuccess={handleInviteSuccess}
        />
      </>
    );
  }

  return (
    <>
      <Box
        sx={[
          {
            gap: 3,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {collaborators
          .slice(
            (currentPage - 1) * itemsPerPage, // Başlangıç index'i
            currentPage * itemsPerPage // Bitiş index'i
          )
          .map((collaborator) => {
            // Davet durumunu kontrol et
            const isPending = collaborator.invitation_status === 'pending'; // Bu hala kullanılabilir, RPC'den geliyor
            // Email daveti mi kontrol et
            const isEmailInvitation = collaborator.collaborator_type === 'pending_email_invite'; // Bu şekilde kontrol et

            // Adı soyadı al
            const fullname = collaborator.display_name || collaborator.email || 'Collaborator'; // Doğrudan erişim

            // E-posta adresini al, string olduğundan emin ol
            const email = collaborator.email || 'No email'; // Doğrudan erişim

            // Avatar URL'sini al
            const avatarUrl = collaborator.avatar_url; // Doğrudan erişim

            // İzinleri guard clause ile kontrol et
            const permissions = Array.isArray(collaborator.custom_flags)
              ? collaborator.custom_flags
              : []; // custom_flags kullan

            return (
              <Card key={collaborator.id} sx={{ p: 3, gap: 2, display: 'flex' }}>
                <IconButton
                  onClick={(e) => handleOpenMenu(e, collaborator)}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>

                <Avatar alt={fullname} src={avatarUrl || ''} sx={{ width: 48, height: 48 }}>
                  {/* Davet ise e-posta ikonu göster */}
                  {collaborator.collaborator_type === 'pending_email_invite' && (
                    <Iconify icon="mingcute:invite-fill" />
                  )}
                  {/* Üye ise ve avatarı yoksa baş harf (opsiyonel) */}
                  {collaborator.collaborator_type === 'member' &&
                    !collaborator.avatar_url &&
                    collaborator.display_name?.charAt(0).toUpperCase()}
                </Avatar>

                <Stack spacing={2} sx={{ flexGrow: 1 }}>
                  <ListItemText
                    primary={collaborator.display_name || 'No name'}
                    secondary={collaborator.email || 'No email'}
                    primaryTypographyProps={{ typography: 'subtitle2' }}
                    secondaryTypographyProps={{ component: 'span', typography: 'caption' }}
                  />

                  {/* Bekleyen Davet Chip'i */}
                  {isEmailInvitation && (
                    <Chip
                      label="Pending Invite"
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ mt: 0.5, alignSelf: 'flex-start' }}
                    />
                  )}

                  {/* Kayıtlı Üye Chip'i */}
                  {collaborator.collaborator_type === 'member' && (
                    <Chip
                      label="Registered Member"
                      size="small"
                      color="success" // veya "primary"
                      variant="outlined"
                      sx={{ mt: 0.5, alignSelf: 'flex-start' }}
                    />
                  )}

                  {/* İzinleri Şık İkonlar ile göster */}
                  {permissions.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                      {permissions.slice(0, 5).map((permission, index) => {
                        // İzin adını basitleştir ve PERMISSION_ICONS'dan uygun ikonu bul
                        const permissionKey = permission
                          .toLowerCase()
                          .replace(/[_\s]+/g, '_') // boşlukları ve alt çizgileri normalize et
                          .replace(/[^a-z_]/g, '') // sadece harfleri ve alt çizgileri koru
                          .split('_')[0]; // ilk kelimeyi al

                        // İkon bilgilerini al veya varsayılanı kullan
                        const iconData =
                          PERMISSION_ICONS[permissionKey] || PERMISSION_ICONS.default;

                        return (
                          <Tooltip key={index} title={`${iconData.label}: ${permission}`}>
                            <Box
                              sx={{
                                p: 0.75,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: (theme) =>
                                  theme.palette.mode === 'light'
                                    ? `${iconData.color}`
                                    : 'background.paper',
                                border: (theme) => `1px solid ${theme.palette.divider}`,
                                color: (theme) =>
                                  theme.palette.mode === 'light' ? 'white' : iconData.color,
                                '&:hover': {
                                  boxShadow: (theme) => theme.shadows[2],
                                },
                              }}
                            >
                              <Iconify icon={iconData.icon} width={18} height={18} />
                            </Box>
                          </Tooltip>
                        );
                      })}

                      {permissions.length > 5 && (
                        <Tooltip title={permissions.slice(5).join(', ')}>
                          <Box
                            sx={{
                              p: 0.75,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'background.paper',
                              border: (theme) => `1px solid ${theme.palette.divider}`,
                              color: 'text.secondary',
                              '&:hover': {
                                boxShadow: (theme) => theme.shadows[2],
                              },
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              +{permissions.length - 5}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </Stack>
              </Card>
            );
          })}
      </Box>

      {/* --- BUTONU BURAYA EKLE (KOŞULLU) --- */}
      {collaborators.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
          <Button
            variant="outlined" // Alt tarafta outlined daha iyi durabilir
            startIcon={<Iconify icon="eva:person-add-fill" />}
            onClick={handleOpenInvite}
          >
            Add Team Member
          </Button>
        </Box>
      )}

      {collaborators.length > 9 && (
        <Pagination
          page={currentPage}
          onChange={handlePageChange}
          count={Math.ceil(collaborators.length / itemsPerPage)}
          sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
        />
      )}

      {/* Üye davet modalini render et */}
      <ProjectsInviteDialog
        projectId={projectId}
        open={inviteOpen}
        onClose={handleCloseInvite}
        onSuccess={handleInviteSuccess}
      />

      {/* Üye işlemleri için popup menü */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { width: 200, maxWidth: '100%' },
        }}
      >
        {selectedCollaborator?.collaborator_type === 'member' && (
          <>
            <MenuItem onClick={() => handleOpenEditPermissions(selectedCollaborator)}>
              <ListItemIcon>
                <Iconify icon="eva:edit-fill" width={24} />
              </ListItemIcon>
              <Typography variant="body2" noWrap>
                Edit Permissions
              </Typography>
            </MenuItem>

            <MenuItem
              onClick={() => handleOpenDeleteDialog(selectedCollaborator)}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <Iconify icon="eva:trash-2-outline" width={24} />
              </ListItemIcon>
              <Typography variant="body2" noWrap>
                Remove
              </Typography>
            </MenuItem>
          </>
        )}

        {selectedCollaborator?.collaborator_type === 'pending_email_invite' && (
          <MenuItem
            onClick={() => {
              if (selectedCollaborator?.id) {
                cancelPendingInvitation(projectId, selectedCollaborator.id);
                handleCloseMenu(); // Menüyü kapat
              } else {
                console.error('Invitation ID not found for collaborator:', selectedCollaborator);
                // Opsiyonel: Hata mesajı göster
              }
            }}
            sx={{ color: 'warning.main' }}
            disabled={cancelLoading} // İşlem sırasında devre dışı bırak
          >
            <ListItemIcon>
              <Iconify icon="material-symbols:cancel-outline" width={24} />
            </ListItemIcon>
            <Typography variant="body2" noWrap>
              Cancel Invite
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Silme onayı dialog'u */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Member Removal</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {selectedCollaborator && (
              <>
                <Typography variant="body1" component="span" sx={{ fontWeight: 'bold' }}>
                  {selectedCollaborator.display_name || selectedCollaborator.email || 'This member'}
                </Typography>{' '}
                Are you sure you want to remove this member? This action cannot be undone.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleRemoveMember}
            color="error"
            autoFocus
            disabled={!!processingInvitation || removeLoading}
          >
            {processingInvitation || removeLoading ? 'Processing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* İzin düzenleme modalini render et */}
      <Dialog
        fullWidth
        maxWidth="sm"
        open={editPermissionsOpen}
        onClose={handleCloseEditPermissions}
      >
        <DialogTitle>Edit Permissions</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {selectedCollaborator && (
              <>
                <Typography variant="body1" component="span" sx={{ fontWeight: 'bold' }}>
                  {selectedCollaborator.display_name || selectedCollaborator.email || 'This member'}
                </Typography>{' '}
                You are editing the permissions for this member.
              </>
            )}
          </DialogContentText>

          <RoleSelect
            defaultValue={selectedCollaborator?.custom_flags || []} // custom_flags kullan
            onChange={handleUpdatePermissions}
            onCancel={handleCloseEditPermissions}
            disabled={processingPermissions || updateLoading}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
