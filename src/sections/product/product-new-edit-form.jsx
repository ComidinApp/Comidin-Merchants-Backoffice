import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
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
import { Upload } from 'src/components/upload';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import {
  _tags,
  PRODUCT_SIZE_OPTIONS,
  PRODUCT_GENDER_OPTIONS,
  PRODUCT_COLOR_NAME_OPTIONS,
  PRODUCT_CATEGORY_GROUP_OPTIONS,
} from 'src/_mock';

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
export default function ProductNewEditForm({ currentProduct }) {
  const router = useRouter();

  const authUser = useAuthContext();

  const mdUp = useResponsive('up', 'md');

  const [file, setFile] = useState(null);

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
        console.error('Error fetching roles:', error);
      }
    };
    fetchCommerces();
  }, []);

  const [product_categories, setProductCategories] = useState([]);
  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/productCategory`);
        const data = await response.json();
        setProductCategories(data || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };
    fetchProductCategories();
  }, []);

  const NewProductSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    description: Yup.string().required('Description is required'),
    image_url: Yup.string().required('Images is required'),
    product_category_id: Yup.number().required('Product category is required'),
    commerce_id: Yup.number().required('Commerce is required'),
    product_code: Yup.string().required('Product Code is required'),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentProduct?.name || '',
      description: currentProduct?.description || '',
      image_url: currentProduct?.image_url || '',
      product_code: currentProduct?.product_code || '',
      commerce_id: currentProduct?.commerce_id || '',
      product_category_id: currentProduct?.product_category_id || '',
    }),
    [currentProduct]
  );

  const methods = useForm({
    resolver: yupResolver(NewProductSchema),
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
    if (currentProduct) {
      reset(defaultValues);

      // Establecer el preview de la imagen si hay una URL
      if (currentProduct.image_url) {
        setFile({
          preview: currentProduct.image_url,
          base64: currentProduct.image_url,
          name: 'Current Product Image',
        });
      }
    }
  }, [currentProduct, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const url = currentProduct
        ? `${VITE_API_COMIDIN}/product/${currentProduct.id}`
        : `${VITE_API_COMIDIN}/product`;

      const method = currentProduct ? 'PUT' : 'POST';
      data.image_url = currentProduct ? data.image_url : data.image_url;

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
      enqueueSnackbar(currentProduct ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.product.root);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  /* async function handleFiles(acceptedFiles) {
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
  ); */

  const handleDropSingleFile = useCallback(
    (acceptedFiles) => {
      const newFile = acceptedFiles[0];

      if (newFile) {
        const preview = URL.createObjectURL(newFile);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result;

          setFile({
            ...newFile,
            preview,
            base64: base64String,
          });

          methods.setValue('image_url', base64String);
          methods.setValue('image_name', newFile.name);
        };

        reader.readAsDataURL(newFile);
      }
    },
    [methods]
  );

  /* const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = values.image_url && values.image_url?.filter((file) => file !== inputFile);
      setValue('image_url', filtered);
    },
    [setValue, values.image_url]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('image_url', []);
  }, [setValue]); */

  const handleChangeIncludeTaxes = useCallback((event) => {
    setIncludeTaxes(event.target.checked);
  }, []);

  useEffect(() => {
    if (authUser.user.role_id !== 1) {
      setValue('commerce_id', authUser.user.commerce.id);
    } else if (currentProduct?.commerce_id) {
      setValue('commerce_id', currentProduct.commerce_id);
    }
  }, [authUser, currentProduct, setValue]);

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
            <RHFTextField name="name" label="Nombre del Producto" />

            <RHFTextField name="description" label="Descripcion" multiline rows={4} />

            {/* <Stack spacing={1.5}>
              <Typography variant="subtitle2">Content</Typography>
              <RHFEditor simple name="description" />
            </Stack> */}

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Imagen</Typography>
              <Upload file={file} onDrop={handleDropSingleFile} onDelete={() => setFile(null)} />
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
              <RHFTextField name="product_code" label="Codigo de Producto" />

              {authUser.user.role_id === 1 && (
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
              )}

              <RHFAutocomplete
                name="product_category_id"
                label="Categoria del producto"
                fullWidth
                options={product_categories}
                getOptionLabel={(option) => option.name}
                onChange={(_, value) => setValue('product_category_id', value?.id || '')}
                value={
                  product_categories.find(
                    (commerce) => commerce.id === watch('product_category_id')
                  ) || null
                }
                isOptionEqualToValue={(option, value) => option.id === (value?.id || value)}
              />

              {/* <RHFTextField name="sku" label="Product SKU" />

              <RHFTextField
                name="quantity"
                label="Quantity"
                placeholder="0"
                type="number"
                InputLabelProps={{ shrink: true }}
              /> */}

              {/* <RHFSelect native name="category" label="Category" InputLabelProps={{ shrink: true }}>
                {PRODUCT_CATEGORY_GROUP_OPTIONS.map((category) => (
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
                options={PRODUCT_COLOR_NAME_OPTIONS}
              /> */}

              {/* <RHFMultiSelect checkbox name="sizes" label="Sizes" options={PRODUCT_SIZE_OPTIONS} /> */}
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
              <RHFMultiCheckbox row name="gender" spacing={2} options={PRODUCT_GENDER_OPTIONS} />
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
          {!currentProduct ? 'Create Product' : 'Save Changes'}
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

ProductNewEditForm.propTypes = {
  currentProduct: PropTypes.object,
};
