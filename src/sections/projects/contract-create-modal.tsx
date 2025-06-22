'use client';

import type {
  CreateNewEvmContractFilesPayload,
  CreateNewEvmContractFilesResponse,
  CreateNewSolanaProgramFilesPayload,
  CreateNewSolanaProgramFilesResponse,
  CreateNewStellarContractPayload,
  CreateNewStellarContractResponse,
} from 'src/actions/project/resources';

import { useMemo, useState, useEffect } from 'react';

import {
  Stack,
  Alert,
  Dialog,
  Button,
  TextField,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import {
  useCreateEvmContractFiles,
  useCreateSolanaProgramFiles,
  useCreateStellarContractFiles,
} from 'src/hooks/projects/use-project-mutations';

import { generateProgramIdAndKeypairContent } from 'src/utils/solanaKeypairUtils';
import { generateStellarContractId } from 'src/utils/stellar-utils';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  platform: 'evm' | 'solana' | 'stellar';
  onSuccess?: (newItemIdOrPath: string) => void;
};

export default function ContractCreateModal({
  open,
  onClose,
  projectId = '',
  platform,
  onSuccess,
}: Props) {
  const evmCreation = useCreateEvmContractFiles();
  const solanaCreation = useCreateSolanaProgramFiles();
  const stellarCreation = useCreateStellarContractFiles();

  const { isLoading: isCreating, error: createError } = useMemo(() => {
    if (platform === 'evm') {
      return {
        isLoading: evmCreation.isLoading,
        error: evmCreation.error,
      };
    }
    if (platform === 'stellar') {
      return {
        isLoading: stellarCreation.isLoading,
        error: stellarCreation.error,
      };
    }
    return {
      isLoading: solanaCreation.isLoading,
      error: solanaCreation.error,
    };
  }, [platform, evmCreation, solanaCreation, stellarCreation]);

  const defaultFormValues = {
    name: '',
  };

  const [formValues, setFormValues] = useState(defaultFormValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setFormValues(defaultFormValues);
      setErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formValues.name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      let result:
        | CreateNewEvmContractFilesResponse
        | CreateNewSolanaProgramFilesResponse
        | CreateNewStellarContractResponse
        | null = null;

      if (platform === 'evm') {
        const payload: CreateNewEvmContractFilesPayload = {
          projectId,
          contractName: formValues.name,
        };
        result = await evmCreation.createEvmContractFiles(payload);
      } else if (platform === 'solana') {
        const { programId, keypairJsonContent } = generateProgramIdAndKeypairContent();

        const payload: CreateNewSolanaProgramFilesPayload = {
          projectId,
          programName: formValues.name,
          programIdStr: programId,
          keypairJsonContent,
        };
        result = await solanaCreation.createSolanaProgramFiles(payload);
      } else if (platform === 'stellar') {
        const contractId = generateStellarContractId();
        const payload: CreateNewStellarContractPayload = {
          projectId,
          contractName: formValues.name,
          contractIdStr: contractId,
        };
        result = await stellarCreation.createStellarContractFiles(payload);
      } else {
        // Should not happen if platform is always 'evm' or 'solana'
        console.error('Invalid platform:', platform);
        // setAlertMessage({ type: 'error', message: 'Invalid platform specified.' });
        return;
      }

      if (result) {
        const newItemIdentifier =
          Array.isArray(result) && result.length > 0 ? result[0].id : (result as any).id; // Cast to any if result is not an array to access id, assuming single object response might also have id.
        // A more robust way would be to ensure single object responses also conform to a known type with an 'id' property.
        // For now, let's assume the first item's ID is what we need if it's an array, or the direct ID if not.
        // This part might need refinement based on actual API response structure for single items.

        if (newItemIdentifier) {
          onClose();
          if (onSuccess) {
            onSuccess(newItemIdentifier);
          }
          console.log(`${platform.toUpperCase()} item created successfully:`, result);
          // Consider setting a success alert message here if needed
        } else {
          console.error(
            `Failed to get identifier for the new ${platform} item from result:`,
            result
          );
          // setAlertMessage({ type: 'error', message: `Failed to get identifier after creating ${platform} item.` });
        }
      } else {
        // Error handling is likely done within the hooks, but we can also set a generic error here if result is null
        console.error(`Failed to create ${platform} item. Result was null.`);
        // The hooks (useCreateEvmContractFiles/useCreateSolanaProgramFiles) already show toasts on error.
        // setAlertMessage({ type: 'error', message: `An error occurred while creating the ${platform} item.` });
      }
    } catch (error: any) {
      // This catch block might be redundant if hooks handle all errors and throw them,
      // or it can catch errors thrown before/after the hook call.
      console.error(`Error in handleSubmit for ${platform}:`, error);
      // setAlertMessage({ type: 'error', message: error.message || `An unexpected error occurred.` });
    }
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isCreating ? undefined : onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="item-create-dialog-title"
      PaperProps={{
        component: 'form',
        onSubmit: (e: React.FormEvent) => {
          e.preventDefault();
          handleSubmit();
        },
      }}
    >
      <DialogTitle id="item-create-dialog-title">
        {platform === 'solana' ? 'Create New Program' : 'Create New Contract'}
        {!isCreating && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Iconify icon="eva:close-fill" />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent>
        {createError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof createError === 'string' ? createError : 'An unexpected error occurred.'}
          </Alert>
        )}

        <Stack spacing={3} mt={1}>
          <TextField
            name="name"
            label={platform === 'solana' ? 'Program Name' : 'Contract Name'}
            fullWidth
            value={formValues.name}
            onChange={handleTextFieldChange}
            error={!!errors.name}
            helperText={errors.name}
            disabled={isCreating}
            required
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={isCreating} type="button">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isCreating}
          startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isCreating
            ? 'Creating...'
            : platform === 'solana'
              ? 'Create Program'
              : 'Create Contract'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
