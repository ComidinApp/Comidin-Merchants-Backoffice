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
  const [limitBlock, setLimitBlock] = useState({ blocked: false, message: '' });
  const [benefitsLoaded, setBenefitsLoaded] = useState(false);
  const [canAddStock, setCanAddStock] = useState(true);

  const isEdit = Boolean(currentPublication?.id);

  const NewPublicationSchema = Yup.object().shape({
    commerce_id: Yup.number().typeError('Debes seleccionar un comercio').required('El comercio es obligatorio'),
    product_id: Yup.number().typeError('Debes seleccionar un producto').required('El producto es obligatorio'),
    price: Yup.number().transform((v, o) => (o === '' ? undefined : v)).typeError('El precio debe ser un número').required('El precio es obligatorio').moreThan(0),
    discount_percentaje: Yup.number().transform((v, o) => (o === '' ? 0 : v)).min(0).max(100),
    discounted_price: Yup.number().required().moreThan(0),
    available_stock: Yup.number().required().integer().min(1),
    is_active: Yup.string().required().oneOf(['active', 'inactive']),
    expiration_date: Yup.mixed()
      .required('La fecha de vencimiento es obligatoria')
      .test('future-datetime', 'La fecha y hora de vencimiento deben ser posteriores al momento actual', (value) => {
        const selectedMs = toMillis(value);
        if (Number.isNaN(selectedMs)) return false;
        const now = new Date();
        now.setSeconds(0, 0);
        return selectedMs >= now.getTime();
      }),
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
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

  const { reset, watch, setValue, handleSubmit, formState } = methods;
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
      if (product) setSelectedProduct(product);
    }
  }, [currentPublication, products]);

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
        setLimitBlock({ blocked: true, message: 'No se pudo determinar tu comercio.' });
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
        if (!allowStock) setValue('available_stock', 1, { shouldValidate: true });
        if (limit && limit.allowed === false) {
          setLimitBlock({ blocked: true, message: limit.reason });
        } else {
          setLimitBlock({ blocked: false, message: '' });
        }
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

  const handleClose = useCallback(
    (value) => {
      dialog.onFalse();
      if (!value) return;
      setSelectedProduct(value);
      setValue('commerce_id', value.commerce_id ?? Number(commerceId), { shouldValidate: true });
      setValue('product_id', value.id, { shouldValidate: true });
    },
    [dialog, setValue, commerceId]
  );

  const onSubmit = async (data) => {
    try {
      if (formLocked) return;
      if (!isEdit && stockLocked) data.available_stock = 1;

      const ms = toMillis(data.expiration_date);
      if (Number.isNaN(ms)) throw new Error('Fecha inválida');
      data.expiration_date = new Date(ms).toISOString();

      const url = isEdit
        ? `${VITE_API_COMIDIN}/publication/${currentPublication.id}`
        : `${VITE_API_COMIDIN}/publication`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(await response.text());

      reset();
      enqueueSnackbar('Publicación guardada con éxito', { variant: 'success' });
      router.push(paths.dashboard.publication.root);
    } catch (e) {
      enqueueSnackbar(e.message || 'Error al guardar la publicación', { variant: 'error' });
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card>
            <Stack spacing={2} sx={{ p: 3 }}>
              <Button variant="outlined" onClick={dialog.onTrue} disabled={formLocked}>
                {selectedProduct ? selectedProduct.name : 'Seleccionar producto'}
              </Button>

              <DateTimePicker
                label="Fecha y hora de vencimiento"
                value={values.expiration_date}
                onChange={(v) => setValue('expiration_date', v, { shouldValidate: true })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(formState.errors.expiration_date),
                    helperText: formState.errors.expiration_date?.message,
                  },
                }}
              />

              <RHFTextField name="available_stock" label="Stock disponible" type="number" disabled={stockLocked} />
              <RHFTextField name="price" label="Precio regular" type="number" />
              <RHFTextField name="discount_percentaje" label="Descuento (%)" type="number" />
              <RHFTextField name="discounted_price" label="Precio con descuento" type="number" disabled />
              <FormControlLabel
                control={<Switch checked={values.is_active === 'active'} onChange={(e) => setValue('is_active', e.target.checked ? 'active' : 'inactive')} />}
                label="Activo"
              />
              <LoadingButton type="submit" variant="contained" loading={formState.isSubmitting}>
                Crear publicación
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

PublicationNewEditForm.propTypes = {
  currentPublication: PropTypes.object,
};
