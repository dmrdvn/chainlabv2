import type { BoxProps } from '@mui/material/Box';
import type { MuiOtpInputProps } from 'mui-one-time-password-input';
import type { FormHelperTextProps } from '@mui/material/FormHelperText';

import { MuiOtpInput } from 'mui-one-time-password-input';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import { inputBaseClasses } from '@mui/material/InputBase';

import { HelperText } from './help-text';

// ----------------------------------------------------------------------

export interface RHFCodesProps extends Omit<MuiOtpInputProps, 'sx'> {
  name: string;
  maxSize?: number;
  placeholder?: string;
  helperText?: React.ReactNode;
  slotProps?: {
    wrapper?: BoxProps;
    helperText?: FormHelperTextProps;
    textfield?: MuiOtpInputProps['TextFieldsProps'];
  };
}

export function RHFCode({
  name,
  slotProps,
  helperText,
  maxSize = 56,
  placeholder = '-',
  ...other
}: RHFCodesProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box
          {...slotProps?.wrapper}
          sx={[
            {
              [`& .${inputBaseClasses.input}`]: {
                p: 0,
                height: 'auto',
                aspectRatio: '1/1',
                maxWidth: maxSize,
              },
            },
            ...(Array.isArray(slotProps?.wrapper?.sx)
              ? (slotProps?.wrapper?.sx ?? [])
              : [slotProps?.wrapper?.sx]),
          ]}
        >
          <HelperText
            {...slotProps?.helperText}
            errorMessage={error?.message}
            helperText={helperText}
          />
        </Box>
      )}
    />
  );
}
