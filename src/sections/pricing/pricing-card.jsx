import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
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
  const [checkingSub, setCheckingSub] = useState(true);
  const [subscribedPlans, setSubscribedPlans] = useState(new Set());

  // flags de plan
  const basic = subscription === 'Básica';
  const starter = subscription === 'Estándar';
  const premium = subscription === 'Premium';

  const fetchSubscriptions = async (abortSignal) => {
    if (!commerceId) {
      setCheckingSub(false);
      return;
    }
    try {
      const resp = await fetch(`${API_BASE}/subscriptions/commerce/${commerceId}`, { signal: abortSignal });
      if (!resp.ok) {
        setSubscribedPlans(new Set());
      } else {
        const arr = await resp.json().catch(() => []);
        const plans = new Set((arr || []).map((s) => Number(s.plan_id)).filter(Boolean));
        setSubscribedPlans(plans);
      }
    } catch {
      setSubscribedPlans(new Set());
    } finally {
      setCheckingSub(false);
    }
  };

  // Al entrar: verificar planes ya tomados por el comercio
  useEffect(() => {
    const ctrl = new AbortController();
    fetchSubscriptions(ctrl.signal);

    // 🔔 Suscribirse a eventos globales para refrescar en todas las tarjetas
    const onUpdated = () => {
      setCheckingSub(true);
      fetchSubscriptions(ctrl.signal);
    };
    window.addEventListener('comidin:subscriptions-updated', onUpdated);

    return () => {
      ctrl.abort();
      window.removeEventListener('comidin:subscriptions-updated', onUpdated);
    };
    // Nota: API_BASE es constante de build; no va en deps.
  }, [commerceId]);

  const handleSubscribe = async () => {
    if (loading) return;
    // Para básico permitimos sin planId numérico
    if (!planId && !basic) return;

    if (!API_BASE) {
      // eslint-disable-next-line no-console
      console.error('VITE_API_COMIDIN no está configurada');
      alert('Error de configuración: falta VITE_API_COMIDIN');
      return;
    }
    if (!commerceId) {
      alert('No se encontró el comercio para este usuario. Por favor, agregá un comercio al perfil.');
      return;
    }


    if (basic) {
      try {
        setLoading(true);
        const resp = await fetch(`${API_BASE}/subscriptions/free`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commerce_id: Number(commerceId),
            cancel_mp: true, // poné false si no cancelás en MP en el backend
          }),
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(json?.error || 'No se pudo pasar a plan gratuito');

        // limpiar estado local inmediato (esta tarjeta) y avisar al resto
        setSubscribedPlans(new Set());
        window.dispatchEvent(new CustomEvent('comidin:subscriptions-updated'));

        alert('Pasaste al plan gratuito.');
        return;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error al pasar a Free:', err);
        alert(err.message || 'Ocurrió un error');
        return;
      } finally {
        setLoading(false);
      }
    }

    // Caso planes pagos (Estándar/Premium)
    if (subscribedPlans.has(Number(planId))) {
      alert('Ya tenés este plan.');
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
          payer_email:'TEST_USER_1278385314@testuser.com',
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
      if (!url) throw new Error('No se recibió el enlace de suscripción.');

      // Guardar info para confirmar al regresar
      localStorage.setItem('pending_plan_id', String(planId));
      localStorage.setItem('pending_payer_email', userEmail || 'TEST_USER_1278385314@testuser.com');
      localStorage.setItem('pending_commerce_id', String(commerceId));

      window.location.href = url; // redirige a Mercado Pago
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error al iniciar suscripción:', err);
      alert(err.message || 'Ocurrió un error al intentar suscribirse.');
    } finally {
      setLoading(false);
    }
  };

  // Al volver de MP con ?preapproval_id=..., confirmo en el backend (guard anti-doble)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preapprovalId = params.get('preapproval_id');
    if (!preapprovalId) return;

    const guardKey = `confirmed:${preapprovalId}`;
    if (sessionStorage.getItem(guardKey)) return;
    sessionStorage.setItem(guardKey, '1');

    const planIdLS = Number(localStorage.getItem('pending_plan_id'));
    const payerEmailLS = localStorage.getItem('pending_payer_email');
    const commerceIdLS = Number(localStorage.getItem('pending_commerce_id'));

    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/subscriptions/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preapproval_id: preapprovalId,
            plan_id: planIdLS || undefined,
            payer_email:'TEST_USER_1278385314@testuser.com',
            commerce_id: commerceIdLS,
          }),
        });

        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(json?.error || 'No se pudo confirmar la suscripción');

        // limpiar estado temporal
        localStorage.removeItem('pending_plan_id');
        localStorage.removeItem('pending_payer_email');
        localStorage.removeItem('pending_commerce_id');

        // Quitar el preapproval_id de la URL para evitar re-disparos
        const url = new URL(window.location.href);
        url.searchParams.delete('preapproval_id');
        window.history.replaceState({}, '', url.toString());

        // Refrescar estado local inmediato y avisar al resto
        if (planIdLS) {
          setSubscribedPlans((prev) => new Set([...prev, Number(planIdLS)]));
        }
        window.dispatchEvent(new CustomEvent('comidin:subscriptions-updated'));

    
        console.log('Suscripción confirmada', json.subscription);
      } catch (e) {
   
        console.error('Confirmación falló:', e);
        sessionStorage.removeItem(guardKey);
      }
    })();

  }, []); 

  // Deshabilitar botón si: está cargando, estoy chequeando subs o YA tiene ESTE plan.
  const disableSubscribe =
    loading || checkingSub || subscribedPlans.has(Number(planId));

  let buttonLabel = labelAction;
  if (basic) buttonLabel = 'Elegir Gratis';
  if (subscribedPlans.has(Number(planId))) buttonLabel = 'Ya tenés este plan';
  else if (loading) buttonLabel = 'Procesando...';

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
      {subscribedPlans.has(Number(planId)) && !basic && (
        <Typography variant="caption" color="text.secondary">
          Ya estás suscripto a este plan.
        </Typography>
      )}
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
                  theme.palette.mode === 'light' ? theme.palette.grey[500] : theme.palette.common.black,
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
        disabled={disableSubscribe}
        color={starter ? 'primary' : 'inherit'}
        onClick={handleSubscribe}
      >
        {buttonLabel}
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
