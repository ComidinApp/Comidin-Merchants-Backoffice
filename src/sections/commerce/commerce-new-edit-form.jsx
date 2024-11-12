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

export default function CommerceNewEditForm({ currentCommerce }) {
  const router = useRouter();

  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const [includeTaxes, setIncludeTaxes] = useState(false);

  const [commerces, setCommerces] = useState([]);
  useEffect(() => {
    const fetchCommerces = async () => {
      try {
        const response = await fetch('http://localhost:3000/commerce');
        const data = await response.json();
        setCommerces(data || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };
    fetchCommerces();
  }, []);

  const [commerce_categories, setCommerceCategories] = useState([]);
  useEffect(() => {
    const fetchCommerceCategories = async () => {
      try {
        const response = await fetch('http://localhost:3000/commerceCategory');
        const data = await response.json();
        setCommerceCategories(data || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };
    fetchCommerceCategories();
  }, []);

  const NewCommerceSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    description: Yup.string().required('Description is required'),
    image_url: Yup.array().min(1, 'Images is required'),
    commerce_category_id: Yup.number().required('Commerce category is required'),
    commerce_id: Yup.number().required('Commerce is required'),
    commerce_code: Yup.string().required('Commerce Code is required'),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentCommerce?.name || '',
      description: currentCommerce?.description || '',
      image_url: [currentCommerce?.image_url] || [],
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
        ? `http://localhost:3000/commerce/${currentCommerce.id}`
        : 'http://localhost:3000/commerce';

      const method = currentCommerce ? 'PUT' : 'POST';
      data.image_url = currentCommerce ? data.image_url[0] : data.image_url;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al enviar los datos');
      }

      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);

      reset();
      enqueueSnackbar(currentCommerce ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.commerce.root);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
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
      const files = values.images || [];

      if (files.length >= 1) {
        enqueueSnackbar('Solo se permite una imagen', { variant: 'warning' });
        return;
      }

      const newFiles = await handleFiles(acceptedFiles); // Espera la resolución de la promesa

      setValue('image_url', [...files, ...newFiles], { shouldValidate: true });
    },
    [setValue, values.images, enqueueSnackbar]
  );

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = values.image_url && values.image_url?.filter((file) => file !== inputFile);
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
            Title, short description, image...
          </Typography> */}
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField name="name" label="Nombre del Comercio" />

            <RHFTextField name="description" label="Descripcion" multiline rows={4} />

            {/* <Stack spacing={1.5}>
              <Typography variant="subtitle2">Content</Typography>
              <RHFEditor simple name="description" />
            </Stack> */}

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Imagen</Typography>
              <RHFUpload
                multiple
                thumbnail
                name="image_url"
                maxSize={3145728}
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
          {/* <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Additional functions and attributes...
          </Typography> */}
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Properties" />}

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
              <RHFTextField name="commerce_code" label="Codigo de Comercio" />

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
                label="Categoria del commerce"
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

              {/* <RHFTextField name="sku" label="Commerce SKU" />

              <RHFTextField
                name="quantity"
                label="Quantity"
                placeholder="0"
                type="number"
                InputLabelProps={{ shrink: true }}
              /> */}

              {/* <RHFSelect native name="category" label="Category" InputLabelProps={{ shrink: true }}>
                {COMMERCE_CATEGORY_GROUP_OPTIONS.map((category) => (
                  <optgroup key={category.group} label={category.group}>
                    {category.classify.map((classify) => (
                      <option key={classify} value={classify}>
                        {classify}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </RHFSelect>

              <RHFMultiSelect
                checkbox
                name="colors"
                label="Colors"
                options={COMMERCE_COLOR_NAME_OPTIONS}
              /> */}

              {/* <RHFMultiSelect checkbox name="sizes" label="Sizes" options={COMMERCE_SIZE_OPTIONS} /> */}
            </Box>

            {/* <RHFAutocomplete
              name="tags"
              label="Tags"
              placeholder="+ Tags"
              multiple
              freeSolo
              options={_tags.map((option) => option)}
              getOptionLabel={(option) => option}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  {option}
                </li>
              )}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    color="info"
                    variant="soft"
                  />
                ))
              }
            /> */}

            {/* <Stack spacing={1}>
              <Typography variant="subtitle2">Gender</Typography>
              <RHFMultiCheckbox row name="gender" spacing={2} options={COMMERCE_GENDER_OPTIONS} />
            </Stack> */}

            {/* <Divider sx={{ borderStyle: 'dashed' }} />

            <Stack direction="row" alignItems="center" spacing={3}>
              <RHFSwitch name="saleLabel.enabled" label={null} sx={{ m: 0 }} />
              <RHFTextField
                name="saleLabel.content"
                label="Sale Label"
                fullWidth
                disabled={!values.saleLabel.enabled}
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={3}>
              <RHFSwitch name="newLabel.enabled" label={null} sx={{ m: 0 }} />
              <RHFTextField
                name="newLabel.content"
                label="New Label"
                fullWidth
                disabled={!values.newLabel.enabled}
              />
            </Stack> */}
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
            Pricing
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Price related inputs
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Pricing" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField
              name="price"
              label="Regular Price"
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
              label="Sale Price"
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
              label="Price includes taxes"
            />

            {!includeTaxes && (
              <RHFTextField
                name="taxes"
                label="Tax (%)"
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
        {/* <FormControlLabel control={<Switch defaultChecked />} sx={{ flexGrow: 1, pl: 3 }} /> */}

        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
          {!currentCommerce ? 'Create Commerce' : 'Save Changes'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {renderDetails}

        {renderProperties}

        {/* {renderPricing} */}

        {renderActions}
      </Grid>
    </FormProvider>
  );
}

CommerceNewEditForm.propTypes = {
  currentCommerce: PropTypes.object,
};
