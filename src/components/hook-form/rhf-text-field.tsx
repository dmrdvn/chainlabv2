import type { TextFieldProps } from '@mui/material/TextField';

import { Controller, useFormContext } from 'react-hook-form';
import { transformValue, transformValueOnBlur, transformValueOnChange } from 'minimal-shared/utils';

import TextField from '@mui/material/TextField';

// ----------------------------------------------------------------------

export type RHFTextFieldProps = TextFieldProps & {
  name: string;
};

export function RHFTextField({
  name,
  helperText,
  slotProps,
  type = 'text',
  ...other
}: RHFTextFieldProps) {
  const { control } = useFormContext();

  const isNumberType = type === 'number';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const currentValue = field.value ?? '';

        return (
          <TextField
            {...field}
            fullWidth
            value={isNumberType ? transformValue(currentValue) : currentValue}
            onChange={(event) => {
              const rawValue = event.target.value;
              const transformedValue = isNumberType ? transformValueOnChange(rawValue) : rawValue;

              field.onChange(transformedValue);
            }}
            onBlur={(event) => {
              const rawValue = event.target.value;
              const transformedValueOnBlur = isNumberType
                ? transformValueOnBlur(rawValue)
                : rawValue;

              field.onChange(transformedValueOnBlur);
            }}
            type={isNumberType ? 'text' : type}
            error={!!error}
            helperText={error?.message ?? helperText}
            slotProps={{
              ...slotProps,
              htmlInput: {
                autoComplete: 'off',
                ...slotProps?.htmlInput,
                ...(isNumberType && { inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }),
              },
            }}
            {...other}
          />
        );
      }}
    />
  );
}
