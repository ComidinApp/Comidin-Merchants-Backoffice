import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';

export default function RHFTextField({ name, helperText, InputProps, inputProps, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          fullWidth
          error={!!error}
          helperText={error?.message || helperText}
          autoComplete="off"               
          InputProps={{
            ...InputProps,
            inputProps: {
              ...(InputProps?.inputProps || {}),
              ...inputProps,
              autoComplete: 'off',                
            },
          }}
          {...other}
        />
      )}
    />
  );
}

RHFTextField.propTypes = {
  name: PropTypes.string.isRequired,
  helperText: PropTypes.node,
  InputProps: PropTypes.object,
  inputProps: PropTypes.object,
};
