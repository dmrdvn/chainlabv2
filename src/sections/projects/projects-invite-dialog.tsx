import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useRoleForm, useMemberInvite, usePermissionFlags } from 'src/hooks/projects';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// Geçerli e-posta kontrolü
const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Props tanımı
type InviteDialogProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function ProjectsInviteDialog({ projectId, open, onClose, onSuccess }: InviteDialogProps) {
  // Form durumları
  const [step, setStep] = useState<1 | 2>(1); // 1: Email seçimi, 2: İzin seçimi
  const [email, setEmail] = useState<string>('');
  const [inviteMessage, setInviteMessage] = useState<string>('');
  const [showPresets, setShowPresets] = useState<boolean>(false); // Hazır şablonları göstersin mi?
  const [showNotRegisteredModal, setShowNotRegisteredModal] = useState<boolean>(false); // Kayıtlı olmayan kullanıcı modalı

  // Hook'lar
  const { sendInvite, loading, error, inviteResponse, resetInviteResponse } =
    useMemberInvite(projectId);
  const { flags, allFlags } = usePermissionFlags();
  const {
    role,
    updateRoleName,
    updateRoleDescription,
    toggleFlag,
    updateRoleFlags,
    resetRole,
    applyTemplate,
  } = useRoleForm();

  // Dialog açıldığında varsayılan olarak Görüntüleyici rolünü uygula
  useEffect(() => {
    if (open) {
      applyTemplate('viewer');
    }
  }, [open]);

  // Dialog kapandığında form sıfırlanır
  const handleClose = () => {
    setStep(1);
    setEmail('');
    resetRole();
    setInviteMessage('');
    setShowPresets(true);
    setShowNotRegisteredModal(false);
    resetInviteResponse();
    onClose();
  };

  // Bilgilendirme modalını kapat
  const handleCloseModal = () => {
    setShowNotRegisteredModal(false);
    handleClose();
  };

  // Sonraki adıma geçiş
  const handleNextStep = () => {
    setStep(2);
  };

  // Önceki adıma dönüş
  const handleBackStep = () => {
    setStep(1);
  };

  // Rol şablonları arasında geçiş yapma
  const handlePresetTemplate = (template: 'viewer' | 'editor' | 'admin') => {
    applyTemplate(template);
    setShowPresets(false); // Kullanıcı özel ayarlara geçtiş yaptı
  };

  // Hazır rol şablonlarına geri dönme
  const handleShowPresets = () => {
    setShowPresets(true);
    applyTemplate('viewer');
  };

  // Davet gönderme
  const handleSendInvite = async () => {
    try {
      // İsim boşsa varsayılan rol adı kullan
      if (!role.name) {
        updateRoleName(`Özel Rol ${new Date().toLocaleTimeString()}`);
      }

      const result = await sendInvite(email, role, inviteMessage);

      // Davet başarılı fakat kullanıcı kayıtlı değil
      if (result.success && result.isUserRegistered === false) {
        setShowNotRegisteredModal(true);
        return;
      }

      // Normal başarılı davet (kayıtlı kullanıcı)
      toast.success('Invitation sent successfully');
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth={step === 1 ? 'sm' : 'md'} fullWidth>
        {loading && <LinearProgress color="primary" />}

        <DialogTitle>
          {step === 1 ? 'Invite User to Project' : `Set Permissions for ${email}`}
        </DialogTitle>

        <DialogContent>
          {step === 1 ? (
            <>
              <TextField
                autoFocus
                fullWidth
                label="Email"
                placeholder="example@mail.com"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText="Enter the email address of the person you want to invite"
              />

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                This email address will receive an invitation. The user will receive an invitation
                email even if they are not registered in the system.
              </Typography>
            </>
          ) : (
            <>
              {showPresets ? (
                // Hazır rol şablonları
                <>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Select a role for this user
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{ justifyContent: 'flex-start', py: 2 }}
                      onClick={() => handlePresetTemplate('viewer')}
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="subtitle2">Viewer</Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          Has view permissions only
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {flags
                            .filter((f) => f.flag.startsWith('view_'))
                            .map((f) => (
                              <Chip key={f.flag} label={f.name} size="small" variant="outlined" />
                            ))}
                        </Box>
                      </Box>
                    </Button>

                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{ justifyContent: 'flex-start', py: 2 }}
                      onClick={() => handlePresetTemplate('editor')}
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="subtitle2">Editor</Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          Has view and edit permissions
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {flags
                            .filter((f) => f.flag.startsWith('view_') || f.flag.startsWith('edit_'))
                            .slice(0, 4)
                            .map((f) => (
                              <Chip key={f.flag} label={f.name} size="small" variant="outlined" />
                            ))}
                          <Chip label="+" size="small" variant="outlined" />
                        </Box>
                      </Box>
                    </Button>

                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{ justifyContent: 'flex-start', py: 2 }}
                      onClick={() => handlePresetTemplate('admin')}
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="subtitle2">Admin</Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          Has all permissions
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {flags.slice(0, 3).map((f) => (
                            <Chip key={f.flag} label={f.name} size="small" variant="outlined" />
                          ))}
                          <Chip label={`+${flags.length - 3}`} size="small" variant="outlined" />
                        </Box>
                      </Box>
                    </Button>

                    <Divider sx={{ my: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        or
                      </Typography>
                    </Divider>

                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<Iconify icon="mdi:pencil-outline" />}
                      onClick={() => setShowPresets(false)}
                    >
                      Create Custom Role
                    </Button>
                  </Box>
                </>
              ) : (
                // Özel rol oluşturma formu
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle2">Custom Role Permissions</Typography>
                    <Button
                      variant="text"
                      color="primary"
                      size="small"
                      startIcon={<Iconify icon="mdi:format-list-bulleted" />}
                      onClick={handleShowPresets}
                    >
                      Go to Presets
                    </Button>
                  </Box>

                  <TextField
                    fullWidth
                    label="Role Name ( You can choose any name you want )"
                    placeholder="e.g. Contract Developer"
                    margin="normal"
                    value={role.name}
                    onChange={(e) => updateRoleName(e.target.value)}
                  />

                  <TextField
                    fullWidth
                    label="Role Description"
                    placeholder="e.g. Permission to write and deploy contracts"
                    margin="normal"
                    value={role.description}
                    onChange={(e) => updateRoleDescription(e.target.value)}
                  />

                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Permissions
                  </Typography>

                  <FormGroup sx={{ mt: 1 }}>
                    {flags.map((permission) => (
                      <FormControlLabel
                        key={permission.flag}
                        control={
                          <Checkbox
                            checked={role.flags.includes(permission.flag)}
                            onChange={(e) => toggleFlag(permission.flag, e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">{permission.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {permission.description}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </>
              )}

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Invitation Message (Optional)"
                placeholder="Add a personal message to your invitation"
                margin="normal"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
            </>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error.message}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>

          {step === 1 ? (
            <Button variant="contained" onClick={handleNextStep} disabled={!isValidEmail(email)}>
              Next
            </Button>
          ) : (
            <>
              <Button onClick={handleBackStep}>Back</Button>
              <LoadingButton variant="contained" onClick={handleSendInvite} loading={loading}>
                Send Invitation
              </LoadingButton>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Kayıtlı olmayan kullanıcı için bilgilendirme modalı */}
      <Modal
        open={showNotRegisteredModal}
        onClose={handleCloseModal}
        aria-labelledby="not-registered-modal-title"
        aria-describedby="not-registered-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 1,
          }}
        >
          <Typography id="not-registered-modal-title" variant="h6" component="h2" gutterBottom>
            User Not Registered in System
          </Typography>

          <Typography id="not-registered-modal-description" variant="body2" sx={{ mb: 2 }}>
            <strong>{email}</strong> is not yet registered in our system. An email with an
            invitation link has been sent. The user will be able to join your project automatically
            after registering.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleCloseModal} variant="contained">
              Got it
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
