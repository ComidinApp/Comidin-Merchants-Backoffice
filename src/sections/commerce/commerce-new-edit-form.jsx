import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFUpload,
  RHFTextField,
  RHFAutocomplete,
} from 'src/components/hook-form';

// ----------------------------------------------------------------------
const { VITE_API_COMIDIN } = import.meta.env;

// 🔒 Límite duro de imagen: 1 MB (archivo)
const MAX_IMAGE_SIZE_MB = 1;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// 🔒 Límite duro de la REQUEST (JSON que se manda al backend)
const MAX_REQUEST_SIZE_MB = 1;
const MAX_REQUEST_SIZE_BYTES = MAX_REQUEST_SIZE_MB * 1024 * 1024;

export default function CommerceNewEditForm({ currentCommerce }) {
  const router = useRouter();
  const mdUp = useResponsive('up', 'md');
  const { enqueueSnackbar } = useSnackbar();

  const [commerces, setCommerces] = useState([]);
  const [commerceCategories, setCommerceCategories] = useState([]);

  // 👉 flag para bloquear el submit si la imagen es demasiado grande
  const [imageTooBig, setImageTooBig] = useState(false);

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
    if (imageTooBig) {
      enqueueSnackbar(
        `La imagen que subiste supera el tamaño máximo permitido de ${MAX_IMAGE_SIZE_MB}MB. Por favor, elegí otra imagen más liviana.`,
        { variant: 'error' }
      );
      return;
    }

    if (!data.image_url || data.image_url.length === 0) {
      enqueueSnackbar('La imagen del comercio es requerida.', {
        variant: 'error',
      });
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const url = currentCommerce
        ? `${VITE_API_COMIDIN}/commerce/${currentCommerce.id}`
        : `${VITE_API_COMIDIN}/commerce`;

      const method = currentCommerce ? 'PUT' : 'POST';

      data.image_url = currentCommerce ? data.image_url[0] : data.image_url;

      const payload = JSON.stringify(data);
      const payloadSizeBytes = new Blob([payload]).size;

      if (payloadSizeBytes > MAX_REQUEST_SIZE_BYTES) {
        console.warn(
          `Payload demasiado grande: ${payloadSizeBytes} bytes (límite ${MAX_REQUEST_SIZE_BYTES})`
        );

        enqueueSnackbar(
          `La imagen es demasiado pesada. El tamaño total de la solicitud no puede superar ${MAX_REQUEST_SIZE_MB}MB. Probá con una imagen más liviana (menor a ${MAX_IMAGE_SIZE_MB}MB).`,
          { variant: 'error' }
        );
        return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      if (!response.ok) {
        let msg =
          'Error al enviar los datos. Por favor, verificá la información ingresada.';

        if (response.status === 413) {
          msg = `La imagen es demasiado pesada para el servidor. Probá con una imagen más liviana (menor a ${MAX_IMAGE_SIZE_MB}MB).`;
        }

        throw new Error(msg);
      }

      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);

      reset();
      enqueueSnackbar(
        currentCommerce ? 'Comercio actualizado con éxito' : 'Comercio creado con éxito',
        { variant: 'success' }
      );
      router.push(paths.dashboard.commerce.root);
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
            reader.readAsDataURL(file);
            reader.onload = () =>
              resolve({
                ...file,
                preview: reader.result,
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
        enqueueSnackbar('Solo se permite una imagen.', { variant: 'warning' });
        return;
      }

      if (!acceptedFiles || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setImageTooBig(true);
        enqueueSnackbar(
          `La imagen supera el tamaño máximo permitido de ${MAX_IMAGE_SIZE_MB}MB.`,
          { variant: 'error' }
        );
        return;
      }

      setImageTooBig(false);

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
      setImageTooBig(false);
    },
    [setValue, values.image_url]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('image_url', []);
    setImageTooBig(false);
  }, [setValue]);

  const renderDetails = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Detalles
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Detalles" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField
              name="name"
              label="Nombre del comercio"
              autoComplete="off"             
            />

            <RHFTextField
              name="description"
              label="Descripción"
              multiline
              rows={4}
              autoComplete="off"
            />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">
                Imagen del comercio (máx. {MAX_IMAGE_SIZE_MB}MB)
              </Typography>

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

              <Typography
                variant="caption"
                sx={{ color: imageTooBig ? 'error.main' : 'text.secondary' }}
              >
                Formatos recomendados: JPG o PNG. Tamaño máximo: {MAX_IMAGE_SIZE_MB}MB.
              </Typography>
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
              <RHFTextField
                name="commerce_code"
                label="Código de comercio"
                autoComplete="off"
              />

              <RHFAutocomplete
                name="commerce_id"
                label="Comercio"
                fullWidth
                options={commerces}
                getOptionLabel={(option) => option.name}
                onChange={(_, value) => setValue('commerce_id', value?.id || '')}
                value={
                  commerces.find((commerce) => commerce.id === watch('commerce_id')) ||
                  null
                }
                isOptionEqualToValue={(option, value) => option.id === (value?.id || value)}
              />

              <RHFAutocomplete
                name="commerce_category_id"
                label="Categoría del comercio"
                fullWidth
                options={commerceCategories}
                getOptionLabel={(option) => option.name}
                onChange={(_, value) =>
                  setValue('commerce_category_id', value?.id || '')
                }
                value={
                  commerceCategories.find(
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

  const renderActions = (
    <>
      {mdUp && <Grid md={4} />}

      <Grid xs={12} md={8} sx={{ display: 'flex', alignItems: 'center' }}>
        <LoadingButton
          type="submit"
          variant="contained"
          loading={isSubmitting}
          disabled={
            isSubmitting ||
            imageTooBig ||
            !values.image_url ||
            values.image_url.length === 0
          }
        >
          {!currentCommerce ? 'Crear comercio' : 'Guardar cambios'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider
      methods={methods}
      onSubmit={onSubmit}
      autoComplete="off" 
    >
      <Grid container spacing={3}>
        {renderDetails}
        {renderProperties}
        {renderActions}
      </Grid>
    </FormProvider>
  );
}

CommerceNewEditForm.propTypes = {
  currentCommerce: PropTypes.object,
};
