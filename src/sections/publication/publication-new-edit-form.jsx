// src/sections/publication/PublicationNewEditForm.jsx
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import Box from '@mui/material/Box';
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
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';
import { useBoolean } from 'src/hooks/use-boolean';
import { useGetProducts } from 'src/api/product';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import FormProvider, {
  RHFEditor,
  RHFUpload,
  RHFTextField,
} from 'src/components/hook-form';

// ----------------------------------------------------------------------
const { VITE_API_COMIDIN } = import.meta.env;

export default function PublicationNewEditForm({ currentPublication }) {
  const router = useRouter();
  const authUser = useAuthContext();
  const dialog = useBoolean();
  const mdUp = useResponsive('up', 'md');
  const { enqueueSnackbar } = useSnackbar();

  const commerceId = authUser.user.role_id === 1 ? null : authUser.user.commerce.id;
  const { products } = useGetProducts(commerceId);

  const [includeTaxes, setIncludeTaxes] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [price, setPrice] = useState(currentPublication?.price || 0);
  const [discount, setDiscount] = useState(currentPublication?.discount_percentaje || 0);
  const [selectedValue, setSelectedValue] = useState();

  // ----------------------------------------------------------------------
  // Validaciones Yup
  // ----------------------------------------------------------------------

  const NewPublicationSchema = Yup.object().shape({
    commerce_id: Yup.number()
      .typeError('Debes seleccionar un comercio')
      .required('El comercio es obligatorio'),

    product_id: Yup.number()
      .typeError('Debes seleccionar un producto')
      .required('El producto es obligatorio'),

    price: Yup.number()
      .transform((value, original) => (original === '' ? undefined : value))
      .typeError('El precio debe ser un número')
      .required('El precio es obligatorio')
      .moreThan(0, 'El precio debe ser mayor a 0'),

    discount_percentaje: Yup.number()
      .transform((value, original) => (original === '' ? 0 : value))
      .typeError('El descuento debe ser un número')
      .min(0, 'El descuento no puede ser negativo')
      .max(100, 'El descuento debe estar entre 0 y 100'),

    discounted_price: Yup.number()
      .transform((value, original) => (original === '' ? undefined : value))
      .typeError('El precio con descuento debe ser un número')
      .required('El precio con descuento es obligatorio')
      .moreThan(0, 'El precio con descuento debe ser mayor a 0')
      .test(
        'discounted-price-check',
        'El precio con descuento no coincide con el porcentaje de descuento',
        (value, ctx) => {
          const { price: formPrice, discount_percentaje } = ctx?.parent || {};
          if (
            typeof formPrice !== 'number' ||
            Number.isNaN(formPrice) ||
            typeof discount_percentaje !== 'number' ||
            Number.isNaN(discount_percentaje)
          ) {
            return true;
          }
          const expected = formPrice - formPrice * (discount_percentaje / 100);
          return Math.abs((value ?? 0) - expected) < 0.01;
        }
      ),

    available_stock: Yup.number()
      .transform((value, original) => (original === '' ? undefined : value))
      .typeError('El stock debe ser un número')
      .required('El stock es obligatorio')
      .integer('El stock debe ser un número entero')
      .min(0, 'El stock no puede ser negativo'),

    is_active: Yup.string()
      .required('El estado es obligatorio')
      .oneOf(['active', 'inactive'], 'Estado inválido'),

    expiration_date: Yup.date()
      .typeError('La fecha de vencimiento es obligatoria')
      .required('La fecha de vencimiento es obligatoria')
      .min(new Date(), 'La fecha de vencimiento no puede estar en el pasado'),
  });

  // ----------------------------------------------------------------------
  // Valores por defecto
  // ----------------------------------------------------------------------

  const defaultValues = useMemo(
    () => ({
      commerce_id: currentPublication?.commerce_id || '',
      product_id: currentPublication?.product_id || '',
      price: currentPublication?.price || 0,
      discount_percentaje: currentPublication?.discount_percentaje || 0,
      discounted_price: currentPublication?.discounted_price || 0,
      available_stock: currentPublication?.available_stock || 0,
      expiration_date: currentPublication?.expiration_date
        ? new Date(currentPublication.expiration_date)
        : null,
      is_active: currentPublication?.is_active || 'active',
      // Campos de texto opcionales
      name: currentPublication?.name || '',
      subDescription: currentPublication?.subDescription || '',
      description: currentPublication?.description || '',
      images: [],
    }),
    [currentPublication]
  );

  // ----------------------------------------------------------------------
  // React Hook Form
  // ----------------------------------------------------------------------

  const methods = useForm({
    resolver: yupResolver(NewPublicationSchema),
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const {
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (currentPublication?.product_id) {
      setValue('product_id', currentPublication.product_id);
    }
  }, [currentPublication, setValue]);

  // ----------------------------------------------------------------------
  // Selección de producto
  // ----------------------------------------------------------------------

  const handleClose = useCallback(
    (value) => {
      dialog.onFalse();
      if (!value) return;

      setSelectedValue(value);
      setSelectedProduct(value);
      setValue('commerce_id', value.commerce_id, { shouldValidate: true });
      setValue('product_id', value.id, { shouldValidate: true });
    },
    [dialog, setValue]
  );

  // ----------------------------------------------------------------------
  // Manejo de precios / descuentos
  // ----------------------------------------------------------------------

  const handlePriceChange = (event) => {
    const raw = event.target.value;
    const numeric = raw === '' ? '' : Number(raw);

    setPrice(numeric || 0);

    setValue('price', numeric === '' ? '' : numeric, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (discount) {
      const basePrice = Number(numeric || 0);
      const discounted = basePrice - (basePrice * discount) / 100;
      setValue(
        'discounted_price',
        Number.isNaN(discounted) ? 0 : Number(discounted.toFixed(2)),
        { shouldValidate: true, shouldDirty: true }
      );
    }
  };

  const handleDiscountChange = (event) => {
    const raw = event.target.value;
    const newDiscount = raw === '' ? 0 : Number(raw);

    setDiscount(newDiscount);

    const basePrice = Number(price) || 0;
    const calculatedDiscountedPrice = basePrice - (basePrice * newDiscount) / 100;

    setValue('discount_percentaje', newDiscount, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(
      'discounted_price',
      Number.isNaN(calculatedDiscountedPrice) ? 0 : Number(calculatedDiscountedPrice.toFixed(2)),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  const calculateDiscountedPrice = () => {
    const basePrice = Number(price) || 0;
    const d = Number(discount) || 0;

    if (!d) return basePrice;

    const result = basePrice - (basePrice * d) / 100;
    return Number.isNaN(result) ? 0 : Number(result.toFixed(2));
  };

  useEffect(() => {
    if (currentPublication) {
      reset(defaultValues);
    }
  }, [currentPublication, defaultValues, reset]);

  // ----------------------------------------------------------------------
  // SUBMIT (este sí le pega al backend)
  // ----------------------------------------------------------------------

  const onSubmit = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const url = currentPublication
        ? `${VITE_API_COMIDIN}/publication/${currentPublication.id}`
        : `${VITE_API_COMIDIN}/publication`;

      const method = currentPublication ? 'PUT' : 'POST';

      // Normalizar fecha/hora de vencimiento
      if (data.expiration_date) {
        const dateObj = new Date(data.expiration_date);

        if (Number.isNaN(dateObj.getTime())) {
          enqueueSnackbar('La fecha de vencimiento es inválida.', { variant: 'error' });
          console.error('expiration_date inválida en el payload:', data.expiration_date);
          return;
        }

        data.expiration_date = dateObj.toISOString();
      }

      console.log('URL al backend:', url);
      console.log('Payload que se envía al backend:', data);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      console.log('Status backend:', response.status);
      console.log('Respuesta cruda del backend:', text);

      if (!response.ok) {
        throw new Error(`Backend respondió ${response.status}: ${text}`);
      }

      const responseData = text ? JSON.parse(text) : {};
      console.log('Respuesta parseada:', responseData);

      reset();
      enqueueSnackbar(
        currentPublication
          ? '¡Publicación actualizada con éxito!'
          : '¡Publicación creada con éxito!',
        { variant: 'success' }
      );
      router.push(paths.dashboard.publication.root);
    } catch (error) {
      console.error('Error al guardar publicación:', error);
      enqueueSnackbar('Ocurrió un error al guardar la publicación.', { variant: 'error' });
    }
  };

  // ----------------------------------------------------------------------
  // Imágenes
  // ----------------------------------------------------------------------

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
      const filtered = values.images && values.images.filter((file) => file !== inputFile);
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

  // ----------------------------------------------------------------------
  // Sección Propiedades
  // ----------------------------------------------------------------------

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
                  'Seleccionar producto'
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
                      maxHeight: '400px',
                      overflow: 'auto',
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
                        key={product.id}
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
                      <ListItemText primary="Agregar producto" />
                    </ListItemButton>
                  </List>
                </DialogContent>
              </Dialog>

              <DateTimePicker
                label="Fecha y hora de vencimiento"
                value={values.expiration_date}
                onChange={(newValue) =>
                  setValue('expiration_date', newValue, { shouldValidate: true })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />

              <RHFTextField
                name="available_stock"
                label="Stock disponible"
                placeholder="0"
                type="number"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  // ----------------------------------------------------------------------
  // Sección Precios
  // ----------------------------------------------------------------------

  const renderPricing = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Precios
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
              label="Descuento (%)"
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
              label="Precio con descuento"
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
                readOnly: true,
              }}
            />
          </Stack>
        </Card>
      </Grid>
    </>
  );

  // ----------------------------------------------------------------------
  // Acciones (switch activo + botón submit)
  // ----------------------------------------------------------------------

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
          {!currentPublication ? 'Crear publicación' : 'Guardar cambios'}
        </LoadingButton>
      </Grid>
    </>
  );

  // ----------------------------------------------------------------------

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Podrías reactivar Details si querés más campos de texto */}
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
