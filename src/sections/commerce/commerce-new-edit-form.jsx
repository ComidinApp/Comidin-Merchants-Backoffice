import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import {
  COMMERCE_SIZE_OPTIONS,
  COMMERCE_GENDER_OPTIONS,
  COMMERCE_COLOR_NAME_OPTIONS,
  COMMERCE_CATEGORY_GROUP_OPTIONS,
} from 'src/_mock/_commerce';

import { _tags } from 'src/_mock/assets';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFSelect,
  RHFEditor,
  RHFUpload,
  RHFSwitch,
  RHFTextField,
  RHFMultiSelect,
  RHFAutocomplete,
  RHFMultiCheckbox,
} from 'src/components/hook-form';

// ----------------------------------------------------------------------
const { VITE_API_COMIDIN } = import.meta.env;

// Tamaño máximo de imagen: 3MB
const MAX_IMAGE_SIZE_MB = 3;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export default function CommerceNewEditForm({ currentCommerce }) {
  const router = useRouter();

  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const [includeTaxes, setIncludeTaxes] = useState(false);

  const [commerces, setCommerces] = useState([]);

  useEffect(() => {
    const fetchCommerces = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/commerce`);
        const data = await response.json();
        setCommerces(data || []);
      } catch (error) {
        console.error('Error al obtener comercios:', error);
      }
    };
    fetchCommerces();
  }, []);

  const [commerce_categories, setCommerceCategories] = useState([]);

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

  const NewCommerceSchema = Yup.object().shape({
    name: Yup.string().required('El nombre es requerido'),
    description: Yup.string().required('La descripción es requerida'),
    image_url: Yup.array().min(1, 'La imagen es requerida'),
    commerce_category_id: Yup.number().required('La categoría de comercio es requerida'),
    commerce_id: Yup.number().required('El comercio es requerido'),
    commerce_code: Yup.string().required('El código de comercio es requerido'),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentCommerce?.name || '',
      description: currentCommerce?.description || '',
      image_url: currentCommerce?.image_url ? [currentCommerce.image_url] : [],
      commerce_code: currentCommerce?.commerce_code || '',
      commerce_id: currentCommerce?.commerce_id || '',
      commerce_category_id: currentCommerce?.commerce_category_id || '',
    }),
    [currentCommerce]
  );

  const methods = useForm({
    resolver: yupResolver(NewCommerceSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (currentCommerce) {
      reset(defaultValues);
    }
  }, [currentCommerce, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const url = currentCommerce
        ? `${VITE_API_COMIDIN}/commerce/${currentCommerce.id}`
        : `${VITE_API_COMIDIN}/commerce`;

      const method = currentCommerce ? 'PUT' : 'POST';

      // Si estamos editando, image_url viene como array, tomamos el primero
      data.image_url = currentCommerce ? data.image_url[0] : data.image_url;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al enviar los datos. Por favor, verificá la información.');
      }

      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);

      reset();
      enqueueSnackbar(
        currentCommerce ? 'Comercio actualizado con éxito' : 'Comercio creado con éxito',
        { variant: 'success' }
      );
      router.push(paths.dashboard.commerce.root);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(error.message || 'Ocurrió un error al guardar el comercio.', {
        variant: 'error',
      });
    }
  });

  async function handleFiles(acceptedFiles) {
    const newFiles = await Promise.all(
      acceptedFiles.slice(0, 1).map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file); // Leer el archivo como base64
            reader.onload = () =>
              resolve({
                ...file,
                preview: reader.result, // Guardar base64 en la propiedad 'preview'
              });
            reader.onerror = (error) => reject(error);
          })
      )
    );

    return newFiles;
  }

  const handleDrop = useCallback(
    async (acceptedFiles) => {
      const files = values.image_url || [];

      if (files.length >= 1) {
        enqueueSnackbar('Solo se permite una imagen', { variant: 'warning' });
        return;
      }

      if (!acceptedFiles || acceptedFiles.length === 0) return;

      // Validar tamaño máximo antes de procesar
      const hasBigFile = acceptedFiles.some((file) => file.size > MAX_IMAGE_SIZE_BYTES);
      if (hasBigFile) {
        enqueueSnackbar(
          `La imagen supera el tamaño máximo permitido de ${MAX_IMAGE_SIZE_MB}MB.`,
          { variant: 'error' }
        );
        return; // No agregamos la imagen ni dejamos que quede "cargada"
      }

      const newFiles = await handleFiles(acceptedFiles);

      setValue('image_url', [...files, ...newFiles], { shouldValidate: true });
    },
    [setValue, values.image_url, enqueueSnackbar]
  );

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered =
        values.image_url && values.image_url?.filter((file) => file !== inputFile);
      setValue('image_url', filtered);
    },
    [setValue, values.image_url]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('image_url', []);
  }, [setValue]);

  const handleChangeIncludeTaxes = useCallback((event) => {
    setIncludeTaxes(event.target.checked);
  }, []);

  const renderDetails = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Detalles
          </Typography>
          {/* <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Título, descripción corta, imagen...
          </Typography> */}
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Detalles" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField name="name" label="Nombre del comercio" />

            <RHFTextField name="description" label="Descripción" multiline rows={4} />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Imagen</Typography>
              <RHFUpload
                multiple
                thumbnail
                name="image_url"
                maxSize={MAX_IMAGE_SIZE_BYTES}
                onDrop={handleDrop}
                onRemove={handleRemoveFile}
                onRemoveAll={handleRemoveAllFiles}
                onUpload={() => console.info('ON UPLOAD')}
              />
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderProperties = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Propiedades
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Propiedades" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <Box
              columnGap={2}
              rowGap={3}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="commerce_code" label="Código de comercio" />

              <RHFAutocomplete
                name="commerce_id"
                label="Comercio"
                fullWidth
                options={commerces}
                getOptionLabel={(option) => option.name}
                onChange={(_, value) => setValue('commerce_id', value?.id || '')}
                value={commerces.find((commerce) => commerce.id === watch('commerce_id')) || null}
                isOptionEqualToValue={(option, value) => option.id === (value?.id || value)}
              />

              <RHFAutocomplete
                name="commerce_category_id"
                label="Categoría del comercio"
                fullWidth
                options={commerce_categories}
                getOptionLabel={(option) => option.name}
                onChange={(_, value) => setValue('commerce_category_id', value?.id || '')}
                value={
                  commerce_categories.find(
                    (commerce) => commerce.id === watch('commerce_category_id')
                  ) || null
                }
                isOptionEqualToValue={(option, value) => option.id === (value?.id || value)}
              />
            </Box>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderPricing = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Precios
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Campos relacionados al precio
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Precios" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField
              name="price"
              label="Precio regular"
              placeholder="0.00"
              type="number"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      $
                    </Box>
                  </InputAdornment>
                ),
              }}
            />

            <RHFTextField
              name="priceSale"
              label="Precio en oferta"
              placeholder="0.00"
              type="number"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      $
                    </Box>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={<Switch checked={includeTaxes} onChange={handleChangeIncludeTaxes} />}
              label="El precio incluye impuestos"
            />

            {!includeTaxes && (
              <RHFTextField
                name="taxes"
                label="Impuestos (%)"
                placeholder="0.00"
                type="number"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box component="span" sx={{ color: 'text.disabled' }}>
                        %
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderActions = (
    <>
      {mdUp && <Grid md={4} />}
      <Grid xs={12} md={8} sx={{ display: 'flex', alignItems: 'center' }}>
        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
          {!currentCommerce ? 'Crear comercio' : 'Guardar cambios'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {renderDetails}

        {renderProperties}

        {/* Si más adelante querés usar precios, solo descomentá esta línea */}
        {/* {renderPricing} */}

        {renderActions}
      </Grid>
    </FormProvider>
  );
}

CommerceNewEditForm.propTypes = {
  currentCommerce: PropTypes.object,
};
