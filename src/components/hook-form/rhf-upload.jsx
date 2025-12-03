import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import FormHelperText from '@mui/material/FormHelperText';

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

// Si querés, podés dejar este límite como referencia, pero ya no lo usamos
// directamente en el drop. La validación fuerte está en el formulario.
const DEFAULT_MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export function RHFUpload({ name, multiple, helperText, maxSize, ...other }) {
  const { control } = useFormContext();

  // Solo lo usamos si en algún momento querés mostrarlo como dato,
  // pero no se lo pasamos al componente Upload para no mezclar validaciones.
  const effectiveMaxSize = maxSize || DEFAULT_MAX_SIZE_BYTES;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const baseProps = {
          ...other, // 👈 acá ya NO va maxSize, porque lo destruimos en los args
          accept: { 'image/*': [] },
          error: !!error,
          helperText:
            (!!error || helperText) && (
              <FormHelperText error={!!error} sx={{ px: 2 }}>
                {error ? error?.message : helperText}
              </FormHelperText>
            ),
          // effectiveMaxSize queda disponible si querés usarlo en algún lado
          // pero no lo pasamos como prop al Upload.
        };

        return multiple ? (
          <Upload
            multiple
            files={field.value}
            {...baseProps}
          />
        ) : (
          <Upload
            file={field.value}
            {...baseProps}
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
