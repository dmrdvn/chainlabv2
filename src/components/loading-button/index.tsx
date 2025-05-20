import type { ButtonProps } from '@mui/material/Button';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

// ----------------------------------------------------------------------

interface Props extends ButtonProps {
  loading?: boolean;
}

export function LoadingButton({ loading, children, ...other }: Props) {
  return (
    <Button
      disabled={loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
      {...other}
    >
      {children}
    </Button>
  );
}
