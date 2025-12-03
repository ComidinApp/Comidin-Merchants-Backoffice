import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import FormHelperText from '@mui/material/FormHelperText';

import { useSnackbar } from 'src/components/snackbar'; // 👈 agregado

import { Upload, UploadBox, UploadAvatar } from '../upload';

// ----------------------------------------------------------------------

export function RHFUploadAvatar({ name, ...other }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div>
          <UploadAvatar error={!!error} file={field.value} {...other} />

          {!!error && (
            <FormHelperText error sx={{ px: 2, textAlign: 'center' }}>
              {error.message}
            </FormHelperText>
          )}
        </div>
      )}
    />
  );
}

RHFUploadAvatar.propTypes = {
  name: PropTypes.string,
};

// ----------------------------------------------------------------------

export function RHFUploadBox({ name, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <UploadBox files={field.value} error={!!error} {...other} />
      )}
    />
  );
}

RHFUploadBox.propTypes = {
  name: PropTypes.string,
};

// ----------------------------------------------------------------------

// 🔒 Límite global por defecto: 1 MB
const DEFAULT_MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export function RHFUpload({ name, multiple, helperText, maxSize, ...other }) {
  const { control } = useFormContext();
  const { enqueueSnackbar } = useSnackbar();

  // Si no nos pasan maxSize desde el formulario, usamos 1MB
  const effectiveMaxSize = maxSize || DEFAULT_MAX_SIZE_BYTES;
  const effectiveMaxSizeMB = Math.round((effectiveMaxSize / (1024 * 1024)) * 10) / 10;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const baseProps = {
          ...other,
          accept: { 'image/*': [] },
          error: !!error,
          helperText:
            (!!error || helperText) && (
              <FormHelperText error={!!error} sx={{ px: 2 }}>
                {error ? error?.message : helperText}
              </FormHelperText>
            ),
          maxSize: effectiveMaxSize,
        };

        const originalOnDrop = other?.onDrop;

        const handleDropGuard = (acceptedFiles, ...args) => {
          if (acceptedFiles && acceptedFiles.length > 0) {
            const tooBig = acceptedFiles.some((file) => file.size > effectiveMaxSize);

            if (tooBig) {
              enqueueSnackbar(
                `La imagen supera el tamaño máximo permitido de ${effectiveMaxSizeMB}MB.`,
                { variant: 'error' }
              );
              // 👇 MUY IMPORTANTE: NO llamamos al onDrop original → el form no guarda el archivo
              return;
            }
          }

          // Si pasó la validación, delegamos al onDrop original (el del formulario)
          if (typeof originalOnDrop === 'function') {
            originalOnDrop(acceptedFiles, ...args);
          }
        };

        return multiple ? (
          <Upload
            multiple
            files={field.value}
            {...baseProps}
            onDrop={handleDropGuard}
          />
        ) : (
          <Upload
            file={field.value}
            {...baseProps}
            onDrop={handleDropGuard}
          />
        );
      }}
    />
  );
}

RHFUpload.propTypes = {
  helperText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  multiple: PropTypes.bool,
  name: PropTypes.string,
  maxSize: PropTypes.number, // en bytes
};
