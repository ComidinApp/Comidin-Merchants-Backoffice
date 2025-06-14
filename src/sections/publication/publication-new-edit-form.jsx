import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
export const VITE_API_COMIDIN = import.meta.env.VITE_API_COMIDIN;
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';
import { useBoolean } from 'src/hooks/use-boolean';
import { useGetProducts } from 'src/api/product';

import Iconify from 'src/components/iconify';

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

export default function PublicationNewEditForm({ currentPublication }) {
  const router = useRouter();

  const authUser = useAuthContext();

  const dialog = useBoolean();

  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const commerceId = authUser.user.role_id === 1 ? null : authUser.user.commerce.id;
  const { products, productsLoading } = useGetProducts(commerceId);

  const [includeTaxes, setIncludeTaxes] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [price, setPrice] = useState(currentPublication?.price || 0);
  const [discount, setDiscount] = useState(currentPublication?.discount_percentaje || 0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (currentPublication?.product_id) {
        try {
          const response = await fetch(
            `${VITE_API_COMIDIN}/product/${currentPublication.product_id}`
          );
          if (response.ok) {
            const product = await response.json();
            setSelectedProduct(product);
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      }
    };
    fetchProduct();
  }, [currentPublication?.product_id]);

  const [selectedValue, setSelectedValue] = useState();

  const NewPublicationSchema = Yup.object().shape({
    commerce_id: Yup.number().required('Commerce is required'),
    product_id: Yup.number().required('Product is required'),
    price: Yup.number().moreThan(0, 'Price should be greater than 0'),
    discount_percentaje: Yup.number().min(0).max(100, 'Discount should be between 0 and 100'),
    discounted_price: Yup.number(),
    available_stock: Yup.number().required('Stock is required'),
    is_active: Yup.string().required('Status is required'),
    expiration_date: Yup.date().required('Expiration date is required'),
  });

  const defaultValues = useMemo(
    () => ({
      commerce_id: currentPublication?.commerce_id || '',
      product_id: currentPublication?.product_id || '',
      price: currentPublication?.price || 0,
      discount_percentaje: currentPublication?.discount_percentaje || 0,
      discounted_price: currentPublication?.discounted_price || 0,
      available_stock: currentPublication?.available_stock || 0,
      expiration_date: new Date(currentPublication?.expiration_date) || null,
      is_active: currentPublication?.is_active || 'active',
    }),
    [currentPublication]
  );

  const methods = useForm({
    resolver: yupResolver(NewPublicationSchema),
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
    if (currentPublication?.product_id) {
      setValue('product_id', currentPublication.product_id);
    }
  }, [currentPublication, setValue]);

  const handleClose = useCallback(
    (value, product) => {
      dialog.onFalse();
      setSelectedValue(value);
      setSelectedProduct(value);
      setValue('commerce_id', value.commerce_id);
      setValue('product_id', value.id);
    },
    [dialog, setValue]
  );

  const handlePriceChange = (event) => {
    setPrice(event.target.value);
    setValue('price', event.target.value, { shouldValidate: true });
  };

  const handleDiscountChange = (event) => {
    const newDiscount = parseFloat(event.target.value);
    setDiscount(newDiscount);

    const calculatedDiscountedPrice = price - (price * newDiscount) / 100;
    setValue('discount_percentaje', newDiscount, { shouldValidate: true });
    setValue('discounted_price', calculatedDiscountedPrice.toFixed(2), { shouldValidate: true });
  };

  const handleDiscountPriceChange = (event) => {
    setValue('discounted_price', event.target.value, { shouldValidate: true });
  };

  const calculateDiscountedPrice = () => {
    if (discount) {
      return (price - (price * discount) / 100).toFixed(2);
    }
    return price;
  };

  useEffect(() => {
    if (currentPublication) {
      reset(defaultValues);
    }
  }, [currentPublication, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const url = currentPublication
        ? `${VITE_API_COMIDIN}/publication/${currentPublication.id}`
        : '${VITE_API_COMIDIN}/publication';

      const method = currentPublication ? 'PUT' : 'POST';
      /* data.is_active = data.is_active === true ? 'active' : 'inactive'; */
      data.expiration_date = data.expiration_date.toISOString().split('T')[0];

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
      enqueueSnackbar(currentPublication ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.publication.root);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const files = values.images || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('images', [...files, ...newFiles], { shouldValidate: true });
    },
    [setValue, values.images]
  );

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = values.images && values.images?.filter((file) => file !== inputFile);
      setValue('images', filtered);
    },
    [setValue, values.images]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('images', []);
  }, [setValue]);

  const handleChangeIncludeTaxes = useCallback((event) => {
    setIncludeTaxes(event.target.checked);
  }, []);

  const renderDetails = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Title, short description, image...
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField name="name" label="Publication Name" />

            <RHFTextField name="subDescription" label="Sub Description" multiline rows={4} />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Content</Typography>
              <RHFEditor simple name="description" />
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Images</Typography>
              <RHFUpload
                multiple
                thumbnail
                name="images"
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
              <Button variant="outlined" onClick={dialog.onTrue}>
                {selectedProduct ? (
                  <>
                    <Avatar
                      alt={selectedProduct.name}
                      src={selectedProduct.image_url}
                      sx={{ mr: 2 }}
                    />
                    {selectedProduct.name}
                  </>
                ) : (
                  'Seleccionar Producto'
                )}
              </Button>

              <Dialog
                open={dialog.value}
                onClose={() => handleClose(selectedProduct)}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>Productos</DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                  <List
                    sx={{
                      maxHeight: '400px', // Altura máxima del diálogo
                      overflow: 'auto', // Agregar scroll si se excede la altura
                    }}
                  >
                    {products.map((product) => (
                      <ListItemButton
                        sx={{
                          px: 2.5,
                          py: 1.5,
                          typography: 'subtitle1',
                        }}
                        onClick={() => handleClose(product)}
                        key={product.id} // Se recomienda usar una propiedad única como 'id'
                      >
                        <Avatar alt={product.name} src={product.image_url} sx={{ mr: 2 }}>
                          <Iconify icon="solar:user-rounded-bold" />
                        </Avatar>
                        <ListItemText primary={product.name} />
                      </ListItemButton>
                    ))}

                    <ListItemButton autoFocus href={paths.dashboard.product.new}>
                      <Avatar sx={{ mr: 2 }}>
                        <Iconify icon="mingcute:add-line" />
                      </Avatar>
                      <ListItemText primary="Agregar Producto" />
                    </ListItemButton>
                  </List>
                </DialogContent>
              </Dialog>

              <DatePicker
                label="Fecha de vencimiento"
                value={values.expiration_date}
                onChange={(newValue) => setValue('expiration_date', newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
              {/* <RHFTextField name="code" label="Publication Code" /> */}

              {/* <RHFTextField name="sku" label="Publication SKU" /> */}

              <RHFTextField
                name="available_stock"
                label="Stock"
                placeholder="0"
                type="number"
                InputLabelProps={{ shrink: true }}
              />

              {/* <RHFMultiSelect
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
            Precios
          </Typography>
          {/* <Typography variant="body2" sx={{ color: 'text.secondary' }}></Typography> */}
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Pricing" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField
              name="price"
              label="Precio Regular"
              placeholder="0.00"
              type="number"
              InputLabelProps={{ shrink: true }}
              value={price}
              onChange={handlePriceChange}
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
              name="discount_percentaje"
              label="Descuento"
              placeholder="0"
              type="number"
              InputLabelProps={{ shrink: true }}
              value={discount}
              onChange={handleDiscountChange}
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

            <RHFTextField
              name="discounted_price"
              label="Precio con Descuento"
              placeholder="0.00"
              type="number"
              InputLabelProps={{ shrink: true }}
              value={calculateDiscountedPrice()}
              onChange={handleDiscountPriceChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      $
                    </Box>
                  </InputAdornment>
                ),
                readOnly: true, // Evita que el usuario edite el campo
              }}
            />

            {/* <FormControlLabel
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
            )} */}
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderActions = (
    <>
      {mdUp && <Grid md={4} />}
      <Grid xs={12} md={8} sx={{ display: 'flex', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Switch
              checked={values.is_active === 'active'}
              onChange={(e) => setValue('is_active', e.target.checked ? 'active' : 'inactive')}
            />
          }
          label="Activo"
          name="is_active"
          sx={{ flexGrow: 1, pl: 3 }}
        />

        <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
          {!currentPublication ? 'Create Publication' : 'Save Changes'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* {renderDetails} */}

        {renderProperties}

        {renderPricing}

        {renderActions}
      </Grid>
    </FormProvider>
  );
}

PublicationNewEditForm.propTypes = {
  currentPublication: PropTypes.object,
};
