import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
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

  // info del user logueado
  const auth = useAuthContext();
  const user = auth?.user;
  const userEmail = user?.email ?? 'cliente@correo.com';
  const userId = user?.id ?? null;
  const commerceId = user?.commerce?.id ?? user?.commerce_id ?? null;

  // estados de UI
  const [loading, setLoading] = useState(false);
  const [checkingSub, setCheckingSub] = useState(true);
  const [subscribedPlans, setSubscribedPlans] = useState(new Set());

  // flags rápidos
  const basic = subscription === 'Básica';
  const starter = subscription === 'Estándar';
  const premium = subscription === 'Premium';

  // si no hay ningún plan guardado → asumimos que está en Gratis
  const hasAnyPlan = subscribedPlans.size > 0;

  // trae las subscripciones actuales del comercio
  const fetchSubscriptions = useCallback(async (abortSignal) => {
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
  }, [commerceId]);

  // al montar la card: cargar subs y escuchar cambios globales
  useEffect(() => {
    const ctrl = new AbortController();
    fetchSubscriptions(ctrl.signal);

    const onUpdated = () => {
      setCheckingSub(true);
      fetchSubscriptions(ctrl.signal);
    };
    window.addEventListener('comidin:subscriptions-updated', onUpdated);

    return () => {
      ctrl.abort();
      window.removeEventListener('comidin:subscriptions-updated', onUpdated);
    };
  }, [commerceId, fetchSubscriptions]);

  // click en botón de suscripción
  const handleSubscribe = async () => {
    if (loading) return;
    if (!planId && !basic) return;

    if (!API_BASE) {
      console.error('Falta VITE_API_COMIDIN');
      alert('Error de configuración del backend');
      return;
    }
    if (!commerceId) {
      alert('El usuario no tiene comercio asignado');
      return;
    }

    // caso plan Básica → downgrade inmediato, no va a MP
    if (basic) {
      try {
        setLoading(true);
        const resp = await fetch(`${API_BASE}/subscriptions/free`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commerce_id: Number(commerceId),
            cancel_mp: true,
          }),
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(json?.error || 'No se pudo pasar a plan gratuito');

        // actualizamos UI y notificamos global
        setSubscribedPlans(new Set());
        window.dispatchEvent(new CustomEvent('comidin:subscriptions-updated'));
        alert('Pasaste al plan gratuito.');
        return;
      } catch (err) {
        console.error('Error al pasar a Free:', err);
        alert(err.message || 'Ocurrió un error');
        return;
      } finally {
        setLoading(false);
      }
    }

    // si ya tiene este plan, no dejamos repetir
    if (subscribedPlans.has(Number(planId))) {
      alert('Ya tenés este plan.');
      return;
    }

    // flujo para planes pagos → pedir link al backend y redirigir a MP
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: Number(planId),
          commerce_id: Number(commerceId),
          payer_email:'TEST_USER_1278385314@testuser.com', // fijo de test, sino nos falla el sandBox de MP
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
      if (!url) throw new Error('No se recibió el link de suscripción.');

      // guardamos contexto para confirmar al volver
      localStorage.setItem('pending_plan_id', String(planId));
      localStorage.setItem('pending_payer_email', userEmail || 'TEST_USER_1278385314@testuser.com');
      localStorage.setItem('pending_commerce_id', String(commerceId));

      window.location.href = url; // redirect a MP
    } catch (err) {
      console.error('Error al iniciar suscripción:', err);
      alert(err.message || 'Ocurrió un error al intentar suscribirse.');
    } finally {
      setLoading(false);
    }
  };

  // al volver de MP con ?preapproval_id=... confirmamos en backend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preapprovalId = params.get('preapproval_id');
    if (!preapprovalId) return;

    const guardKey = `confirmed:${preapprovalId}`;
    if (sessionStorage.getItem(guardKey)) return;
    sessionStorage.setItem(guardKey, '1');

    const planIdLS = Number(localStorage.getItem('pending_plan_id'));
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

        // limpiar datos temporales
        localStorage.removeItem('pending_plan_id');
        localStorage.removeItem('pending_payer_email');
        localStorage.removeItem('pending_commerce_id');

        // limpiar query param para no re-disparar
        const url = new URL(window.location.href);
        url.searchParams.delete('preapproval_id');
        window.history.replaceState({}, '', url.toString());

        // actualizar estado local + avisar global
        if (planIdLS) setSubscribedPlans((prev) => new Set([...prev, Number(planIdLS)]));
        window.dispatchEvent(new CustomEvent('comidin:subscriptions-updated'));

        console.log('Suscripción confirmada', json.subscription);
      } catch (e) {
        console.error('Confirmación falló:', e);
        sessionStorage.removeItem(guardKey);
      }
    })();
  }, []);

  // regla de disable del botón
  const disableSubscribe =
    loading || checkingSub || subscribedPlans.has(Number(planId)) || (basic && !hasAnyPlan);

  // label dinámico
  let buttonLabel = labelAction;
  if (basic && !hasAnyPlan) buttonLabel = 'Plan Actual';
  else if (basic) buttonLabel = 'Elegir Gratis';
  else if (subscribedPlans.has(Number(planId))) buttonLabel = 'Ya tenés este plan';
  else if (loading) buttonLabel = 'Procesando...';

  // UI
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
      {basic && !hasAnyPlan && (
        <Typography variant="caption" color="text.secondary">
          Estás en el plan gratuito.
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
