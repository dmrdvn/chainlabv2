import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useRoleForm, usePermissionFlags } from 'src/hooks/projects';

// ----------------------------------------------------------------------

type RoleSelectProps = {
  defaultValue?: string[];
  onChange: (selectedFlags: string[]) => void;
  onCancel?: () => void;
  disabled?: boolean;
};

export function RoleSelect({
  defaultValue = [],
  onChange,
  onCancel,
  disabled = false,
}: RoleSelectProps) {
  const [showPresets, setShowPresets] = useState<boolean>(true);
  const [selectedFlags, setSelectedFlags] = useState<string[]>(defaultValue);
  const { flags, allFlags } = usePermissionFlags();
  const {
    role,
    toggleFlag: baseToggleFlag,
    updateRoleFlags,
    applyTemplate: baseApplyTemplate,
  } = useRoleForm({
    name: '',
    description: '',
    flags: selectedFlags,
  });

  // Rol şablonları arasında geçiş yapma
  const handlePresetTemplate = (template: 'viewer' | 'editor' | 'admin') => {
    const newFlags =
      template === 'viewer'
        ? flags.filter((f) => f.flag.startsWith('view_')).map((f) => f.flag)
        : template === 'editor'
          ? flags
              .filter((f) => f.flag.startsWith('view_') || f.flag.startsWith('edit_'))
              .map((f) => f.flag)
          : allFlags;

    setSelectedFlags(newFlags);
    baseApplyTemplate(template);
    setShowPresets(false);
  };

  // Hazır rol şablonlarına geri dönme
  const handleShowPresets = () => {
    setShowPresets(true);
    const viewerFlags = flags.filter((f) => f.flag.startsWith('view_')).map((f) => f.flag);
    setSelectedFlags(viewerFlags);
    baseApplyTemplate('viewer');
  };

  // Toggle flag wrapper
  const handleToggleFlag = (flag: string, checked: boolean) => {
    const newFlags = checked ? [...selectedFlags, flag] : selectedFlags.filter((f) => f !== flag);
    setSelectedFlags(newFlags);
    baseToggleFlag(flag, checked);
  };

  // Kaydet butonuna tıklandığında çağrılacak
  const handleSave = () => {
    onChange(selectedFlags);
  };

  // İptal butonuna tıklandığında çağrılacak
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Box>
      {showPresets ? (
        // Hazır rol şablonları
        <>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Select a role
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              sx={{ justifyContent: 'flex-start', py: 2 }}
              onClick={() => handlePresetTemplate('viewer')}
              disabled={disabled}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2">Viewer</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
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
              disabled={disabled}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2">Editor</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
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
              disabled={disabled}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2">Admin</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
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
          </Box>

          <Divider sx={{ my: 3 }}>
            <Chip
              label="veya özel izinler seçin"
              onClick={() => setShowPresets(false)}
              disabled={disabled}
            />
          </Divider>
        </>
      ) : (
        <>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="subtitle2">Custom Permissions</Typography>
            <Button size="small" onClick={handleShowPresets} disabled={disabled}>
              Go to Presets
            </Button>
          </Box>

          <FormGroup>
            {flags.map((flag) => (
              <FormControlLabel
                key={flag.flag}
                control={
                  <Checkbox
                    checked={selectedFlags.includes(flag.flag)}
                    onChange={(e) => handleToggleFlag(flag.flag, e.target.checked)}
                    disabled={disabled}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">{flag.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {flag.description}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </FormGroup>
        </>
      )}

      <DialogActions sx={{ mt: 3 }}>
        <Button color="inherit" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={disabled}>
          Save
        </Button>
      </DialogActions>
    </Box>
  );
}
