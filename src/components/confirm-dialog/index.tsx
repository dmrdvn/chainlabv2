import type { DialogProps } from '@mui/material/Dialog';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

interface Props extends Omit<DialogProps, 'title' | 'content'> {
  title: React.ReactNode;
  content?: React.ReactNode;
  action?: React.ReactNode;
  onClose: VoidFunction;
}

export function ConfirmDialog({ title, content, action, onClose, ...other }: Props) {
  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} {...other}>
      <DialogTitle sx={{ pb: 2 }}>{title}</DialogTitle>

      {content && <DialogContent sx={{ typography: 'body2' }}>{content}</DialogContent>}

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          İptal
        </Button>

        {action}
      </DialogActions>
    </Dialog>
  );
}
