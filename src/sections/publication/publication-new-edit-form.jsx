import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemButton from '@mui/material/ListItemButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { useGetProducts } from 'src/api/product';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import { canCreatePublication, fetchBenefitsByCommerceId } from 'src/api/publicationLimits';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

const { VITE_API_COMIDIN } = import.meta.env;

const toMillis = (v) => {
  if (!v) return NaN;
  if (v instanceof Date) return v.getTime();
  if (typeof v?.toDate === 'function') return v.toDate().getTime();
  if (typeof v?.valueOf === 'function') {
    const ms = v.valueOf();
    if (typeof ms === 'number') return ms;
  }
  const d = new Date(v);
  return d.getTime();
};

export default function PublicationNewEditForm({ currentPublication }) {
  const router = useRouter();
  const authUser = useAuthContext();
  const dialog = useBoolean();
  const mdUp = useResponsive('up', 'md');
  const { enqueueSnackbar } = useSnackbar();

  const commerceId =
    authUser?.user?.commerce?.id ??
    authUser?.user?.commerce_id ??
    authUser?.user?.commerceId ??
    null;

  const { products } = useGetProducts(commerceId);

  const [price, setPrice] = useState(currentPublication?.price || null);
  const [discount, setDiscount] = useState(currentPublication?.discount_percentaje || null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [screenLoading, setScreenLoading] = useState(false);

  const [limitBlock, setLimitBlock] = useState({
    blocked: false,
    message: '',
  });

  const [benefitsLoaded, setBenefitsLoaded] = useState(false);
  const [canAddStock, setCanAddStock] = useState(true);

  const isEdit = Boolean(currentPublication?.id);

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
      .min(1, 'El stock no puede ser negativo'),

    is_active: Yup.string()
      .required('El estado es obligatorio')
      .oneOf(['active', 'inactive'], 'Estado inválido'),

    expiration_date: Yup.mixed()
      .required('La fecha de vencimiento es obligatoria')
      .test(
        'future-datetime',
        'La fecha y hora de vencimiento deben ser posteriores al momento actual',
        (value) => {
          const selectedMs = toMillis(value);
          if (Number.isNaN(selectedMs)) return false;

          const now = new Date();
          now.setSeconds(0, 0);

          return selectedMs >= now.getTime();
        }
      ),
  });

  const defaultValues = useMemo(
    () => ({
      commerce_id: currentPublication?.commerce_id || '',
      product_id: currentPublication?.product_id || '',
      price: currentPublication?.price || null,
      discount_percentaje: currentPublication?.discount_percentaje || 0,
      discounted_price: currentPublication?.discounted_price || 0,
      available_stock: currentPublication?.available_stock || 1,
      expiration_date: currentPublication?.expiration_date
        ? new Date(currentPublication.expiration_date)
        : null,
      is_active: currentPublication?.is_active || 'active',
      images: [],
    }),
    [currentPublication]
  );

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
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (currentPublication) reset(defaultValues);
  }, [currentPublication, defaultValues, reset]);

  useEffect(() => {
    if (currentPublication) {
      setPrice(currentPublication.price || null);
      setDiscount(currentPublication.discount_percentaje || 0);
    }
  }, [currentPublication]);

  useEffect(() => {
    if (currentPublication?.product_id && products.length > 0) {
      const product = products.find((p) => p.id === currentPublication.product_id);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [currentPublication, products]);

  useEffect(() => {
    if (currentPublication?.product_id) setValue('product_id', currentPublication.product_id);
  }, [currentPublication, setValue]);

  useEffect(() => {
    let alive = true;

    async function validateOnEnter() {
      if (isEdit) {
        setLimitBlock({ blocked: false, message: '' });
        setBenefitsLoaded(true);
        setScreenLoading(false);
        return;
      }

      if (!commerceId) {
        setLimitBlock({
          blocked: true,
          message: 'No se pudo determinar tu comercio para validar tu suscripción.',
        });
        setScreenLoading(false);
        return;
      }

      setScreenLoading(true);

      try {
        const [b, limit] = await Promise.all([
          fetchBenefitsByCommerceId(Number(commerceId)).catch(() => null),
          canCreatePublication({ commerceId: Number(commerceId) }).catch(() => null),
        ]);

        if (!alive) return;

        const allowStock = b?.can_add_stock !== false;
        setCanAddStock(allowStock);
        setBenefitsLoaded(true);

        if (!allowStock) {
          setValue('available_stock', 1, { shouldValidate: true, shouldDirty: true });
        }

        if (limit && limit.allowed === false) {
          setLimitBlock({
            blocked: true,
            message:
              limit?.reason ||
              'Alcanzaste el máximo de publicaciones activas permitidas para tu suscripción.',
          });
        } else {
          setLimitBlock({ blocked: false, message: '' });
        }
      } catch (e) {
        if (!alive) return;
        setLimitBlock({ blocked: false, message: '' });
        setBenefitsLoaded(true);
        setCanAddStock(true);
        // eslint-disable-next-line no-console
        console.warn('[Publication] validateOnEnter falló:', e);
      } finally {
        if (alive) {
          setScreenLoading(false);
        }
      }
    }

    validateOnEnter();

    return () => {
      alive = false;
    };
  }, [commerceId, isEdit, setValue]);

  const stockLocked = benefitsLoaded && !canAddStock;
  const formLocked = Boolean(limitBlock.blocked) || screenLoading;

  const handleClose = useCallback(
    (value) => {
      dialog.onFalse();
      if (!value) return;

      setSelectedProduct(value);
      setValue('commerce_id', value.commerce_id, { shouldValidate: true });
      setValue('product_id', value.id, { shouldValidate: true });
    },
    [dialog, setValue]
  );

  const handlePriceChange = (event) => {
    const raw = event.target.value;
    const numeric = raw === '' ? '' : Number(raw);

    setPrice(numeric || 0);

    setValue('price', numeric === '' ? '' : numeric, {
      shouldValidate: true,
      shouldDirty: true,
    });

    const basePrice = Number(numeric || 0);
    const currentDiscount = Number(discount) || 0;
    const discounted = basePrice - (basePrice * currentDiscount) / 100;
    setValue(
      'discounted_price',
      Number.isNaN(discounted) ? 0 : Number(discounted.toFixed(2)),
      { shouldValidate: true, shouldDirty: true }
    );
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

  const onSubmit = async (data) => {
    try {
      if (formLocked) {
        enqueueSnackbar(limitBlock.message || 'No podés crear publicaciones en este momento.', {
          variant: 'error',
        });
        return;
      }

      if (!isEdit && stockLocked) {
        data.available_stock = 1;
      }

      const url = isEdit
        ? `${VITE_API_COMIDIN}/publication/${currentPublication.id}`
        : `${VITE_API_COMIDIN}/publication`;

      const method = isEdit ? 'PUT' : 'POST';

      if (data.expiration_date) {
        const ms = toMillis(data.expiration_date);
        if (Number.isNaN(ms)) {
          enqueueSnackbar('La fecha de vencimiento es inválida.', { variant: 'error' });
          return;
        }
        data.expiration_date = new Date(ms).toISOString();
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Backend respondió ${response.status}: ${text}`);
      }

      reset();
      enqueueSnackbar(
        isEdit ? '¡Publicación actualizada con éxito!' : '¡Publicación creada con éxito!',
        { variant: 'success' }
      );
      router.push(paths.dashboard.publication.root);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al guardar publicación:', error);
      enqueueSnackbar('Ocurrió un error al guardar la publicación.', { variant: 'error' });
    }
  };

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

          <Stack spacing={2} sx={{ p: 3 }}>
            {limitBlock.blocked && (
              <Typography sx={{ color: 'error.main', fontWeight: 600 }}>
                {limitBlock.message || 'Alcanzaste el máximo de publicaciones para tu suscripción.'}
              </Typography>
            )}

            {stockLocked && !limitBlock.blocked && (
              <Typography sx={{ color: 'error.main', fontWeight: 600 }}>
                Tu suscripción no permite tener más stock.
              </Typography>
            )}

            <Box
              columnGap={2}
              rowGap={3}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
              }}
            >
              <Button variant="outlined" onClick={dialog.onTrue} disabled={formLocked}>
                {selectedProduct ? (
                  <>
                    <Avatar alt={selectedProduct.name} src={selectedProduct.image_url} sx={{ mr: 2 }} />
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
                  <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {products.map((product) => (
                      <ListItemButton
                        sx={{ px: 2.5, py: 1.5, typography: 'subtitle1' }}
                        onClick={() => handleClose(product)}
                        key={product.id}
                        disabled={formLocked}
                      >
                        <Avatar alt={product.name} src={product.image_url} sx={{ mr: 2 }}>
                          <Iconify icon="solar:user-rounded-bold" />
                        </Avatar>
                        <ListItemText primary={product.name} />
                      </ListItemButton>
                    ))}

                    <ListItemButton autoFocus href={paths.dashboard.product.new} disabled={formLocked}>
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
                  setValue('expiration_date', newValue, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    disabled: formLocked,
                    error: Boolean(methods.formState.errors.expiration_date),
                    helperText: methods.formState.errors.expiration_date?.message,
                  },
                }}
              />

              <RHFTextField
                name="available_stock"
                label="Stock disponible"
                placeholder="0"
                type="number"
                InputLabelProps={{ shrink: true }}
                disabled={formLocked || stockLocked}
                helperText={stockLocked ? 'Tu suscripción no permite tener más stock.' : ''}
                FormHelperTextProps={{ sx: { color: 'error.main' } }}
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
              disabled={formLocked}
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
              disabled={formLocked}
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
              disabled
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

  const renderActions = (
    <>
      {mdUp && <Grid md={4} />}
      <Grid xs={12} md={8} sx={{ display: 'flex', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Switch
              checked={values.is_active === 'active'}
              onChange={(e) => setValue('is_active', e.target.checked ? 'active' : 'inactive')}
              disabled={formLocked}
            />
          }
          label="Activo"
          name="is_active"
          sx={{ flexGrow: 1, pl: 3 }}
        />

        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          disabled={formLocked}
        >
          {!currentPublication ? 'Crear publicación' : 'Guardar cambios'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
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
