import PropTypes from 'prop-types';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { PlanFreeIcon, PlanStarterIcon, PlanPremiumIcon } from 'src/assets/icons';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

const API_BASE = import.meta.env.VITE_API_COMIDIN || '';

export default function PricingCard({ card, sx, ...other }) {
  const {
    subscription,
    price,
    caption,
    lists = [],
    not_lists = [],
    labelAction,
    planId,
  } = card ?? {};

  // auth
  const auth = useAuthContext();
  const user = auth?.user;
  const userEmail = user?.email ?? 'cliente@correo.com';
  const userId = user?.id ?? null;
  const commerceId = user?.commerce?.id ?? user?.commerce_id ?? null;

  // estado
  const [loading, setLoading] = useState(false);

  // flags de plan
  const basic = subscription === 'Básica';
  const starter = subscription === 'Estándar';
  const premium = subscription === 'Premium';

  const handleSubscribe = async () => {
    if (loading) return; 
    if (!planId || basic) return;

    if (!API_BASE) {
      console.error('VITE_API_COMIDIN no está configurada');
      alert('Error de configuración: falta VITE_API_COMIDIN');
      return;
    }
    if (!commerceId) {
      alert('No se encontró el comercio para este usuario. Por favor, agregá un comercio al perfil.');
      return;
    }

    try {
      setLoading(true);

      const endpoint = `${API_BASE}/subscriptions`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: Number(planId),
          commerce_id: Number(commerceId),
          payer_email: 'TEST_USER_1278385314@testuser.com',
          userId, 
        }),
      });

      let data = null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await res.json().catch(() => null); 
      }

      if (!res.ok) {
        const msg = data?.error || data?.message || `Error ${res.status}`;
        throw new Error(msg);
      }

      const url = data?.link || data?.init_point || data?.sandbox_init_point;
      if (url) {
        window.location.href = url; // redirige a Mercado Pago
      } else {
        throw new Error('No se recibió el enlace de suscripción.');
      }
    } catch (err) {
      console.error('Error al iniciar suscripción:', err);
      alert(err.message || 'Ocurrió un error al intentar suscribirse.');
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Box sx={{ width: 48, height: 48 }}>
        {basic && <PlanFreeIcon />}
        {starter && <PlanStarterIcon />}
        {premium && <PlanPremiumIcon />}
      </Box>
      {starter && <Label color="info">POPULAR</Label>}
    </Stack>
  );

  const renderSubscription = (
    <Stack spacing={1}>
      <Typography variant="h4" sx={{ textTransform: 'capitalize' }}>
        {subscription}
      </Typography>
      <Typography variant="subtitle2">{caption}</Typography>
    </Stack>
  );

  const renderPrice = basic ? (
    <Typography variant="h2">Gratis</Typography>
  ) : (
    <Stack direction="row">
      <Typography variant="h4">$</Typography>
      <Typography variant="h2">{price}</Typography>
      <Typography
        component="span"
        sx={{ alignSelf: 'center', color: 'text.disabled', ml: 1, typography: 'body2' }}
      >
        / mes
      </Typography>
    </Stack>
  );

  const renderList = (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box component="span" sx={{ typography: 'overline' }}>
          Características
        </Box>
      </Stack>

      {lists.map((item) => (
        <Stack key={item} spacing={1} direction="row" alignItems="center" sx={{ typography: 'body2' }}>
          <Iconify icon="eva:checkmark-fill" width={16} sx={{ mr: 1 }} />
          {item}
        </Stack>
      ))}
      {not_lists.map((item) => (
        <Stack key={item} spacing={1} direction="row" alignItems="center" sx={{ typography: 'body2' }}>
          <Iconify icon="eva:close-fill" width={16} sx={{ mr: 1 }} />
          {item}
        </Stack>
      ))}
    </Stack>
  );

  return (
    <Stack
      spacing={5}
      sx={{
        p: 5,
        borderRadius: 2,
        boxShadow: (theme) => ({ xs: theme.customShadows.card, md: 'none' }),
        ...(starter && {
          borderTopRightRadius: { md: 0 },
          borderBottomRightRadius: { md: 0 },
        }),
        ...(starter || premium
          ? {
              boxShadow: (theme) => ({
                xs: theme.customShadows.card,
                md: `-40px 40px 80px 0px ${alpha(
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[500]
                    : theme.palette.common.black,
                  0.16
                )}`,
              }),
            }
          : {}),
        ...sx,
      }}
      {...other}
    >
      {renderIcon}
      {renderSubscription}
      {renderPrice}
      <Divider sx={{ borderStyle: 'dashed' }} />
      {renderList}

      <Button
        fullWidth
        size="large"
        variant="contained"
        disabled={basic || loading}
        color={starter ? 'primary' : 'inherit'}
        onClick={handleSubscribe}
      >
        {loading ? 'Generando enlace...' : labelAction}
      </Button>
    </Stack>
  );
}

PricingCard.propTypes = {
  card: PropTypes.shape({
    subscription: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    caption: PropTypes.string,
    lists: PropTypes.arrayOf(PropTypes.string),
    not_lists: PropTypes.arrayOf(PropTypes.string),
    labelAction: PropTypes.string,
    planId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  sx: PropTypes.object,
};
