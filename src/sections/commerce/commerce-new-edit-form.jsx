import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import { Upload } from 'src/components/upload';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

// ----------------------------------------------------------------------
const { VITE_API_COMIDIN } = import.meta.env;

// 🔒 Límite duro de imagen: 600KB (archivo)
const MAX_IMAGE_SIZE_KB = 600;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_KB * 1024;

// Días de la semana
const DAYS_OF_WEEK = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

// ----------------------------------------------------------------------

/**
 * Parsea un string de días ("0,1,2,3") a array de números [0,1,2,3]
 */
function parseDaysString(daysStr) {
  if (!daysStr) return [];
  if (Array.isArray(daysStr)) return daysStr.map(Number);
  return daysStr
    .split(',')
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => !Number.isNaN(d));
}

/**
 * Parsea un string de hora "HH:mm:ss" o "HH:mm" a un objeto Date
 */
function parseTimeString(timeStr) {
  if (!timeStr) return null;
  if (timeStr instanceof Date) return timeStr;

  const parts = timeStr.split(':');
  if (parts.length < 2) return null;

  const date = new Date();
  date.setHours(parseInt(parts[0], 10));
  date.setMinutes(parseInt(parts[1], 10));
  date.setSeconds(0);
  return date;
}

/**
 * Convierte un Date a string "HH:mm"
 */
function formatTimeToString(date) {
  if (!date || !(date instanceof Date)) return null;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ----------------------------------------------------------------------

// Schema de validación (fuera del componente para evitar errores de ESLint con `this`)
const CommerceSchema = Yup.object().shape({
  name: Yup.string().required('El nombre del comercio es requerido'),
  commerce_category_id: Yup.number()
    .typeError('La categoría es requerida')
    .required('La categoría es requerida'),
  street_name: Yup.string().required('La dirección es requerida'),
  number: Yup.string()
    .required('La altura es requerida')
    .matches(/^[0-9]{1,6}$/, 'La altura debe ser numérica'),
  postal_code: Yup.string()
    .required('El código postal es requerido')
    .matches(/^[0-9]{3,10}$/, 'El código postal debe ser numérico'),
  open_at: Yup.date()
    .nullable()
    .typeError('La hora de apertura es requerida')
    .required('La hora de apertura es requerida'),
  close_at: Yup.date()
    .nullable()
    .typeError('La hora de cierre es requerida')
    .required('La hora de cierre es requerida')
    .test(
      'is-later-than-open',
      'La hora de cierre debe ser posterior a la hora de apertura',
      function validateCloseAt(value) {
        const { open_at: openAtVal } = this.parent;
        if (!openAtVal || !value) return true;
        try {
          return value.getTime() > openAtVal.getTime();
        } catch (_e) {
          return true;
        }
      }
    ),
  available_days: Yup.array()
    .min(1, 'Debe seleccionar al menos un día disponible')
    .required('Debe seleccionar los días disponibles'),
  image_url: Yup.string().nullable(),
});

// ----------------------------------------------------------------------

export default function CommerceNewEditForm({ currentCommerce, isMyCommerce = false }) {
  const router = useRouter();
  const mdUp = useResponsive('up', 'md');
  const { enqueueSnackbar } = useSnackbar();

  const [commerceCategories, setCommerceCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [openAt, setOpenAt] = useState(null);
  const [closeAt, setCloseAt] = useState(null);

  const isEdit = Boolean(currentCommerce?.id);

  // Cargar categorías de comercio
  useEffect(() => {
    const fetchCommerceCategories = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/commerceCategory`);
        const data = await response.json();
        setCommerceCategories(data || []);
      } catch (error) {
        console.error('Error al obtener categorías de comercio:', error);
      }
    };
    fetchCommerceCategories();
  }, []);

  // Valores por defecto
  const defaultValues = useMemo(
    () => ({
      name: currentCommerce?.name || '',
      commerce_category_id: currentCommerce?.commerce_category_id || '',
      street_name: currentCommerce?.street_name || '',
      number: currentCommerce?.number || '',
      postal_code: currentCommerce?.postal_code || '',
      open_at: parseTimeString(currentCommerce?.open_at) || null,
      close_at: parseTimeString(currentCommerce?.close_at) || null,
      available_days: parseDaysString(currentCommerce?.available_days) || [],
      image_url: currentCommerce?.image_url || '',
    }),
    [currentCommerce]
  );

  const methods = useForm({
    resolver: yupResolver(CommerceSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const selectedDays = watch('available_days') || [];

  // Sincronizar valores cuando cambia currentCommerce
  useEffect(() => {
    if (currentCommerce) {
      reset(defaultValues);

      // Sincronizar TimePickers
      const parsedOpenAt = parseTimeString(currentCommerce?.open_at);
      const parsedCloseAt = parseTimeString(currentCommerce?.close_at);
      setOpenAt(parsedOpenAt);
      setCloseAt(parsedCloseAt);

      // Sincronizar imagen preview
      if (currentCommerce?.image_url) {
        setFile({ preview: currentCommerce.image_url });
      }
    }
  }, [currentCommerce, defaultValues, reset]);

  // Manejo de imagen
  const handleDropSingleFile = useCallback(
    (acceptedFiles) => {
      const newFile = acceptedFiles?.[0];
      if (!newFile) return;

      if (newFile.size > MAX_IMAGE_SIZE_BYTES) {
        setFile(null);
        setValue('image_url', '', { shouldValidate: false });
        setError('image_url', {
          type: 'manual',
          message: `Error: la imagen no debe superar los ${MAX_IMAGE_SIZE_KB}KB.`,
        });
        return;
      }

      clearErrors('image_url');

      const preview = URL.createObjectURL(newFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFile({ ...newFile, preview, base64: base64String });
        setValue('image_url', base64String, { shouldValidate: true });
      };
      reader.readAsDataURL(newFile);
    },
    [setValue, setError, clearErrors]
  );

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setValue('image_url', '');
  }, [setValue]);

  // Submit
  const onSubmit = handleSubmit(async (data) => {
    try {
      // Formatear horarios
      const formattedData = {
        ...data,
        open_at: formatTimeToString(data.open_at),
        close_at: formatTimeToString(data.close_at),
        available_days: data.available_days.join(','),
      };

      // Si la imagen no cambió (es URL), no la mandamos en base64
      if (formattedData.image_url && !formattedData.image_url.startsWith('data:')) {
        // Es una URL existente, la mandamos tal cual
      }

      const url = isEdit
        ? `${VITE_API_COMIDIN}/commerce/${currentCommerce.id}`
        : `${VITE_API_COMIDIN}/commerce`;

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el comercio');
      }

      enqueueSnackbar(isEdit ? 'Comercio actualizado con éxito' : 'Comercio creado con éxito', {
        variant: 'success',
      });

      if (isMyCommerce) {
        // Si es "Mi Comercio", quedarse en la misma página
        router.reload();
      } else {
        router.push(paths.dashboard.commerce.root);
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar(error.message || 'Ocurrió un error al guardar el comercio', {
        variant: 'error',
      });
    }
  });

  // Renderizado del formulario
  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Columna izquierda - Info */}
        {mdUp && (
          <Grid item md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Información del comercio
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Datos básicos y ubicación del comercio
            </Typography>
          </Grid>
        )}

        {/* Columna derecha - Formulario Info básica */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            {!mdUp && <CardHeader title="Información del comercio" />}

            <Stack spacing={3}>
              <RHFTextField name="name" label="Nombre del comercio" />

              <RHFAutocomplete
                name="commerce_category_id"
                label="Categoría del comercio"
                options={commerceCategories}
                getOptionLabel={(option) => {
                  if (typeof option === 'number') {
                    const found = commerceCategories.find((cat) => cat.id === option);
                    return found?.name || '';
                  }
                  return option?.name || '';
                }}
                onChange={(_, value) => setValue('commerce_category_id', value?.id || '')}
                value={
                  commerceCategories.find(
                    (cat) => cat.id === watch('commerce_category_id')
                  ) || null
                }
                isOptionEqualToValue={(option, value) => option.id === (value?.id || value)}
              />

              <Box
                columnGap={2}
                rowGap={3}
                display="grid"
                gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }}
              >
                <RHFTextField name="street_name" label="Calle" />
                <RHFTextField name="number" label="Altura" />
                <RHFTextField name="postal_code" label="Código Postal" />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Columna izquierda - Horarios */}
        {mdUp && (
          <Grid item md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Horarios y disponibilidad
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Configura cuándo tu comercio está abierto
            </Typography>
          </Grid>
        )}

        {/* Columna derecha - Horarios */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            {!mdUp && <CardHeader title="Horarios y disponibilidad" />}

            <Stack spacing={3}>
              <Box
                columnGap={2}
                rowGap={3}
                display="grid"
                gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
              >
                <TimePicker
                  label="Horario de apertura"
                  value={openAt}
                  ampm={false}
                  onChange={(newValue) => {
                    setOpenAt(newValue);
                    setValue('open_at', newValue, { shouldValidate: true });
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.open_at,
                      helperText: errors.open_at?.message,
                    },
                  }}
                />

                <TimePicker
                  label="Horario de cierre"
                  value={closeAt}
                  ampm={false}
                  onChange={(newValue) => {
                    setCloseAt(newValue);
                    setValue('close_at', newValue, { shouldValidate: true });
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.close_at,
                      helperText: errors.close_at?.message,
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Días disponibles
                </Typography>
                <Grid container spacing={1}>
                  {DAYS_OF_WEEK.map((day) => (
                    <Grid item xs={6} sm={4} md={3} key={day.value}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedDays.includes(day.value)}
                            onChange={(event) => {
                              const current = selectedDays;
                              let newValue;

                              if (event.target.checked) {
                                newValue = [...current, day.value];
                              } else {
                                newValue = current.filter((v) => v !== day.value);
                              }

                              setValue('available_days', newValue, { shouldValidate: true });
                            }}
                          />
                        }
                        label={day.label}
                      />
                    </Grid>
                  ))}
                </Grid>
                {errors.available_days && (
                  <Typography variant="caption" color="error">
                    {errors.available_days.message}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Columna izquierda - Imagen */}
        {mdUp && (
          <Grid item md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Logo del comercio
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Imagen que identificará a tu comercio (máx. {MAX_IMAGE_SIZE_KB}KB)
            </Typography>
          </Grid>
        )}

        {/* Columna derecha - Imagen */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            {!mdUp && <CardHeader title="Logo del comercio" />}

            <Upload
              file={file}
              onDrop={handleDropSingleFile}
              onDelete={handleRemoveFile}
              helperText={
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: 'block',
                    textAlign: 'center',
                    color: errors.image_url ? 'error.main' : 'text.secondary',
                  }}
                >
                  {errors.image_url?.message ||
                    `Formatos permitidos: JPG, PNG. Tamaño máximo: ${MAX_IMAGE_SIZE_KB}KB`}
                </Typography>
              }
            />
          </Card>
        </Grid>

        {/* Botón Submit */}
        {mdUp && <Grid item md={4} />}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
              {isEdit ? 'Guardar cambios' : 'Crear comercio'}
            </LoadingButton>
          </Box>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

CommerceNewEditForm.propTypes = {
  currentCommerce: PropTypes.object,
  isMyCommerce: PropTypes.bool,
};
