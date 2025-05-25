import React, { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import { useTheme, styled } from '@mui/material/styles';
import { Iconify } from '../iconify';

interface ActionButtonProps {
  title: string;
  icon: string;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning';
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[2],
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ActionButton: React.FC<ActionButtonProps> = ({ title, icon, onClick, color }) => (
  <Tooltip title={title} placement="top">
    <StyledIconButton onClick={onClick} size="small" color={color}>
      <Iconify icon={icon} width={18} />
    </StyledIconButton>
  </Tooltip>
);

export interface ExpandingActionsButtonProps {
  onAttachFile?: () => void;
  onStartVoiceInput?: () => void;
}

const ExpandingActionsButton: React.FC<ExpandingActionsButtonProps> = ({
  onAttachFile,
  onStartVoiceInput,
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleActionClick = (action?: () => void) => {
    if (action) {
      action();
    }
    setIsOpen(false);
  };

  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <StyledIconButton
        onClick={handleToggle}
        size="small"
        sx={{
          zIndex: 1,
          transition: 'transform 0.3s ease-in-out',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        <Iconify icon="mdi:plus" width={15} />
      </StyledIconButton>
      <Collapse in={isOpen} timeout="auto" orientation="horizontal">
        <Stack
          direction="row"
          spacing={1}
          sx={{
            ml: 1,
            p: 0.5,
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.background.neutral,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <ActionButton
            title="Attach File (Soon)"
            icon="mdi:attachment"
            onClick={() => handleActionClick(onAttachFile)}
            color="primary"
          />
          <ActionButton
            title="Voice Chat (Soon)"
            icon="mdi:microphone"
            onClick={() => handleActionClick(onStartVoiceInput)}
            color="secondary"
          />
        </Stack>
      </Collapse>
    </Box>
  );
};

export default ExpandingActionsButton;
