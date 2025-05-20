import type { ProjectFilters } from 'src/types/project';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  canReset: boolean;
  onOpen: () => void;
  onClose: () => void;
  filters: UseSetStateReturn<ProjectFilters>;
  options: {
    tags: string[];
    visibility: string[];
  };
};

export function ProjectsFilters({ open, canReset, onOpen, onClose, filters, options }: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleFilterVisibility = useCallback(
    (newValue: string) => {
      const checked = currentFilters.visibility.includes(newValue)
        ? currentFilters.visibility.filter((value) => value !== newValue)
        : [...currentFilters.visibility, newValue];

      updateFilters({ visibility: checked });
    },
    [updateFilters, currentFilters.visibility]
  );

  const handleFilterTags = useCallback(
    (newValue: string) => {
      const checked = currentFilters.tags.includes(newValue)
        ? currentFilters.tags.filter((value) => value !== newValue)
        : [...currentFilters.tags, newValue];

      updateFilters({ tags: checked });
    },
    [updateFilters, currentFilters.tags]
  );

  const renderHead = () => (
    <>
      <Box
        sx={{
          py: 2,
          pr: 1,
          pl: 2.5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Filters
        </Typography>

        <Tooltip title="Reset">
          <IconButton onClick={() => resetFilters()}>
            <Badge color="error" variant="dot" invisible={!canReset}>
              <Iconify icon="solar:restart-bold" />
            </Badge>
          </IconButton>
        </Tooltip>

        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />
    </>
  );

  const renderVisibility = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Visibility
      </Typography>
      {options.visibility.map((option) => (
        <FormControlLabel
          key={option}
          control={
            <Checkbox
              checked={currentFilters.visibility.includes(option)}
              onClick={() => handleFilterVisibility(option)}
            />
          }
          label={option}
        />
      ))}
    </Box>
  );

  const renderTags = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Tags
      </Typography>
      {options.tags.map((option) => (
        <FormControlLabel
          key={option}
          control={
            <Checkbox
              checked={currentFilters.tags.includes(option)}
              onClick={() => handleFilterTags(option)}
            />
          }
          label={option}
        />
      ))}
    </Box>
  );

  return (
    <>
      <Button
        disableRipple
        color="inherit"
        endIcon={
          <Badge color="error" variant="dot" invisible={!canReset}>
            <Iconify icon="ic:round-filter-list" />
          </Badge>
        }
        onClick={onOpen}
      >
        Filters
      </Button>

      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 320 } }}
      >
        {renderHead()}

        <Scrollbar sx={{ px: 2.5, py: 3 }}>
          <Stack spacing={3}>
            {renderVisibility()}
            {renderTags()}
          </Stack>
        </Scrollbar>
      </Drawer>
    </>
  );
}
