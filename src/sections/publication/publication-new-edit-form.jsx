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

import FormProvider, { RHFTextField } from 'src/components/hook-form';

// ✅ NUEVO: validar cupo + beneficios al entrar
import { canCreatePublication, fetchBenefitsByCommerceId } from 'src/api/publicationLimits';

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

  const [price, setPrice] = useState(currentPublication?.price || 0);
  const [discount, setDiscount] = useState(currentPublication?.discount_percentaje || 0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ✅ estados de validación al ingresar
  const [screenLoading, setScreenLoading] = useState(false);

  // bloqueo por límite
  const [limitBlock, setLimitBlock] = useState({
    blocked: false,
    message: '',
  });

  // beneficios (stock)
  const [benefitsLoaded, setBenefitsLoaded] = useState(false);
  const [canAddStock, setCanAddStock] = useState(true);

  const isEdit = Boolean(currentPublication?.id);

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
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (currentPublication) reset(defaultValues);
  }, [currentPublication, defaultValues, reset]);

  useEffect(() => {
    if (currentPublication?.product_id) setValue('product_id', currentPublication.product_id);
  }, [currentPublication, setValue]);

  // ----------------------------------------------------------------------
  // ✅ VALIDACIÓN AL ENTRAR (solo para "crear", no editar)
  // ----------------------------------------------------------------------
  useEffect(() => {
    let alive = true;

    async function validateOnEnter() {
      // si estás editando, no bloqueamos la pantalla por cupo (solo aplica a crear)
      if (isEdit) {
        setLimitBlock({ blocked: false, message: '' });
        return;
      }

      if (!commerceId) {
        // si no hay comercio, bloqueamos porque no se puede validar ni crear
        setLimitBlock({
          blocked: true,
          message: 'No se pudo determinar tu comercio para validar tu suscripción.',
        });
        return;
      }

      setScreenLoading(true);

      // 1) beneficios (stock)
      // 2) límite publicaciones
      try {
        const [b, limit] = await Promise.all([
          fetchBenefitsByCommerceId(Number(commerceId)).catch(() => null),
          canCreatePublication({ commerceId: Number(commerceId) }).catch(() => null),
        ]);

        if (!alive) return;

        // --- stock ---
        const allowStock = b?.can_add_stock !== false;
        setCanAddStock(allowStock);
        setBenefitsLoaded(true);

        if (!allowStock) {
          // setear 1 de una, al entrar
          setValue('available_stock', 1, { shouldValidate: true, shouldDirty: true });
        }

        // --- límite publicaciones ---
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
        // Si falla por red, no bloqueamos por cupo, pero avisamos suave
        setLimitBlock({ blocked: false, message: '' });
        setBenefitsLoaded(true);
        setCanAddStock(true);
        console.warn('[Publication] validateOnEnter falló:', e);
      } finally {
        if (alive) setScreenLoading(false);
      }
    }

    validateOnEnter();

    return () => {
      alive = false;
    };
  }, [commerceId, isEdit, setValue]);

  const stockLocked = benefitsLoaded && !canAddStock;
  const formLocked = Boolean(limitBlock.blocked) || screenLoading;

  // ----------------------------------------------------------------------
  // Selección de producto
  // ----------------------------------------------------------------------

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

  // ----------------------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------------------

  const onSubmit = async (data) => {
    try {
      // si está bloqueado, no enviar nunca
      if (formLocked) {
        enqueueSnackbar(limitBlock.message || 'No podés crear publicaciones en este momento.', {
          variant: 'error',
        });
        return;
      }

      // por seguridad: si no puede stock, forzamos 1
      if (!isEdit && stockLocked) {
        data.available_stock = 1;
      }

      const url = isEdit
        ? `${VITE_API_COMIDIN}/publication/${currentPublication.id}`
        : `${VITE_API_COMIDIN}/publication`;

      const method = isEdit ? 'PUT' : 'POST';

      // Normalizar vencimiento
      if (data.expiration_date) {
        const dateObj = new Date(data.expiration_date);
        if (Number.isNaN(dateObj.getTime())) {
          enqueueSnackbar('La fecha de vencimiento es inválida.', { variant: 'error' });
          return;
        }
        data.expiration_date = dateObj.toISOString();
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
      enqueueSnackbar(isEdit ? '¡Publicación actualizada con éxito!' : '¡Publicación creada con éxito!', {
        variant: 'success',
      });
      router.push(paths.dashboard.publication.root);
    } catch (error) {
      console.error('Error al guardar publicación:', error);
      enqueueSnackbar('Ocurrió un error al guardar la publicación.', { variant: 'error' });
    }
  };

  // ----------------------------------------------------------------------
  // UI: Propiedades
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

          <Stack spacing={2} sx={{ p: 3 }}>
            {/* Mensaje bloqueo por límite */}
            {limitBlock.blocked && (
              <Typography sx={{ color: 'error.main', fontWeight: 600 }}>
                {limitBlock.message || 'Alcanzaste el máximo de publicaciones para tu suscripción.'}
              </Typography>
            )}

            {/* Mensaje por stock */}
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
                  setValue('expiration_date', newValue, { shouldValidate: true })
                }
                slotProps={{ textField: { fullWidth: true, disabled: formLocked } }}
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

  // ----------------------------------------------------------------------
  // UI: Precios
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
              disabled={true}
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
  // UI: Acciones
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
