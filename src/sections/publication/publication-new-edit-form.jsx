import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

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

  const dialog = useBoolean();

  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const commerceId = authUser.user.role_id === 1 ? null : authUser.user.commerce.id;
  const { products, productsLoading } = useGetProducts(commerceId);

  const [includeTaxes, setIncludeTaxes] = useState(false);

  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  const [selectedValue, setSelectedValue] = useState();

  const handleClose = useCallback(
    (value) => {
      dialog.onFalse();
      setSelectedValue(value);
    },
    [dialog]
  );

  const handlePriceChange = (event) => {
    setPrice(event.target.value);
  };

  const handleDiscountChange = (event) => {
    setDiscount(event.target.value);
  };

  const calculateDiscountedPrice = () => {
    if (discount) {
      return (price - (price * discount) / 100).toFixed(2);
    }
    return price;
  };

  const NewPublicationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    images: Yup.array().min(1, 'Images is required'),
    tags: Yup.array().min(2, 'Must have at least 2 tags'),
    category: Yup.string().required('Category is required'),
    price: Yup.number().moreThan(0, 'Price should not be $0.00'),
    description: Yup.string().required('Description is required'),
    // not required
    taxes: Yup.number(),
    newLabel: Yup.object().shape({
      enabled: Yup.boolean(),
      content: Yup.string(),
    }),
    saleLabel: Yup.object().shape({
      enabled: Yup.boolean(),
      content: Yup.string(),
    }),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentPublication?.name || '',
      description: currentPublication?.description || '',
      subDescription: currentPublication?.subDescription || '',
      images: currentPublication?.images || [],
      //
      code: currentPublication?.code || '',
      sku: currentPublication?.sku || '',
      price: currentPublication?.price || 0,
      quantity: currentPublication?.quantity || 0,
      priceSale: currentPublication?.priceSale || 0,
      tags: currentPublication?.tags || [],
      taxes: currentPublication?.taxes || 0,
      gender: currentPublication?.gender || '',
      category: currentPublication?.category || '',
      colors: currentPublication?.colors || [],
      sizes: currentPublication?.sizes || [],
      newLabel: currentPublication?.newLabel || { enabled: false, content: '' },
      saleLabel: currentPublication?.saleLabel || { enabled: false, content: '' },
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
    if (currentPublication) {
      reset(defaultValues);
    }
  }, [currentPublication, defaultValues, reset]);

  useEffect(() => {
    if (includeTaxes) {
      setValue('taxes', 0);
    } else {
      setValue('taxes', currentPublication?.taxes || 0);
    }
  }, [currentPublication?.taxes, includeTaxes, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
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
                {selectedValue ? (
                  <>
                    <Avatar alt={selectedValue.name} src={selectedValue.image_url} sx={{ mr: 2 }} />
                    {selectedValue.name}
                  </>
                ) : (
                  'Seleccionar Producto'
                )}
              </Button>

              <Dialog
                open={dialog.value}
                onClose={() => handleClose(selectedValue)}
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
                slotProps={{ textField: { fullWidth: true } }}
              />
              {/* <RHFTextField name="code" label="Publication Code" /> */}

              {/* <RHFTextField name="sku" label="Publication SKU" /> */}

              <RHFTextField
                name="quantity"
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
              name="discount"
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
              name="priceSale"
              label="Precio con Descuento"
              placeholder="0.00"
              type="number"
              InputLabelProps={{ shrink: true }}
              value={calculateDiscountedPrice()}
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
          control={<Switch defaultChecked />}
          label="Activo"
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
