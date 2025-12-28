// src/sections/pricing/pricing-card.jsx
// (o: src/sections/pricing/components/PricingCard.jsx)

import PropTypes from 'prop-types';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import { PlanFreeIcon, PlanStarterIcon, PlanPremiumIcon } from 'src/assets/icons';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

const API_BASE = import.meta.env.VITE_API_COMIDIN || '';

const Alert = MuiAlert; // alias corto

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

  // snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('Suscripción exitosa');
  const [snackSeverity, setSnackSeverity] = useState('success');

  const openSnack = (msg, severity = 'success') => {
    setSnackMsg(msg || 'OK');
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  const closeSnack = (_e, reason) => {
    if (reason === 'clickaway') return;
    setSnackOpen(false);
  };

  const clearPending = () => {
    localStorage.removeItem('pending_plan_id');
    localStorage.removeItem('pending_payer_email');
    localStorage.removeItem('pending_commerce_id');
    sessionStorage.removeItem('mp_preapproval_id');
  };

  // flags rápidos
  const basic = subscription === 'Básica';
  const starter = subscription === 'Estándar';
  const premium = subscription === 'Premium';

  const planName = (pid) => {
    const n = Number(pid);
    if (n === 1) return 'Suscripción Gratis';
    if (n === 2) return 'Suscripción Estándar';
    if (n === 3) return 'Suscripción Premium';
    return 'Suscripción';
  };

  // ✅ Plan actual (sin ternarios anidados)
  const currentPlanId = useMemo(() => {
    let id = 1; // default FREE
    if (subscribedPlans.has(3)) id = 3;
    else if (subscribedPlans.has(2)) id = 2;
    else if (subscribedPlans.has(1)) id = 1;
    else id = 1; // si backend devuelve [], igual free
    return id;
  }, [subscribedPlans]);

  const isCurrentPlan = Number(planId) === Number(currentPlanId);

  // trae las subscripciones actuales del comercio
  const fetchSubscriptions = useCallback(
    async (abortSignal) => {
      if (!commerceId) {
        setCheckingSub(false);
        return;
      }
      try {
        // ✅ endpoint real (plural + /api)
        const resp = await fetch(`${API_BASE}/api/subscriptions/commerce/${commerceId}`, {
          signal: abortSignal,
        });

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
    },
    [commerceId]
  );

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
  }, [fetchSubscriptions]);

  // click en botón de suscripción
  const handleSubscribe = async () => {
    if (loading) return;
    if (!planId && !basic) return;

    if (!API_BASE) {
      console.error('Falta VITE_API_COMIDIN');
      openSnack('Error de configuración del backend', 'error');
      return;
    }
    if (!commerceId) {
      openSnack('El usuario no tiene comercio asignado', 'error');
      return;
    }

    // ⛔️ Si ya es plan actual, no hacemos nada
    if (isCurrentPlan) {
      openSnack('Ya estás en este plan.', 'info');
      return;
    }

    // caso plan Básica → downgrade inmediato, no va a MP
    if (basic) {
      try {
        setLoading(true);
        const resp = await fetch(`${API_BASE}/api/subscriptions/free`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commerce_id: Number(commerceId),
            cancel_mp: true,
          }),
        });

        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(json?.error || 'No se pudo pasar a suscripción gratuita');

        // actualizamos UI y notificamos global
        setSubscribedPlans(new Set([1]));
        window.dispatchEvent(new CustomEvent('comidin:subscriptions-updated'));

        openSnack('¡Listo! Cambiaste a la Suscripción Gratuita.', 'success');
      } catch (err) {
        console.error('Error al pasar a suscripción Gratuita:', err);
        openSnack(err?.message || 'Ocurrió un error', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // flujo para planes pagos → pedir link al backend y redirigir a MP
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: Number(planId),
          commerce_id: Number(commerceId),
          payer_email: userEmail || 'TEST_USER_1278385314@testuser.com',
          userId,
        }),
      });

      let data = null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.error || data?.message || `Error ${res.status}`;
        throw new Error(msg);
      }

      if (data?.id) sessionStorage.setItem('mp_preapproval_id', String(data.id));

      const url =
        data?.init_point ||
        data?.sandbox_init_point ||
        data?.link ||
        (data?.mode === 'plan_init_point_fallback'
          ? data?.init_point || data?.sandbox_init_point
          : null);

      if (!url) {
        console.error('Respuesta del backend:', data);
        throw new Error('No se recibió el link de suscripción.');
      }

      localStorage.setItem('pending_plan_id', String(planId));
      localStorage.setItem('pending_payer_email', userEmail || 'TEST_USER_1278385314@testuser.com');
      localStorage.setItem('pending_commerce_id', String(commerceId));

      window.location.href = url;
    } catch (err) {
      console.error('Error al iniciar suscripción:', err);
      openSnack(err?.message || 'Ocurrió un error al intentar suscribirse.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // al volver de MP: confirmamos en backend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const mpStatus = params.get('status') || params.get('collection_status');
    const preapprovalFromQuery = params.get('preapproval_id');
    const paymentId = params.get('payment_id') || params.get('collection_id');

    const hasMpReturnParams =
      Boolean(preapprovalFromQuery) ||
      Boolean(paymentId) ||
      params.has('status') ||
      params.has('collection_status');

    const planIdLS = Number(localStorage.getItem('pending_plan_id'));
    const commerceIdLS = Number(localStorage.getItem('pending_commerce_id'));

    // si hay pending pero no retorno MP -> limpiar
    if (planIdLS && commerceIdLS && !hasMpReturnParams) {
      clearPending();
      openSnack('Pago cancelado. No se realizó ningún cambio de plan.', 'info');
      return;
    }

    if (!planIdLS || !commerceIdLS || !hasMpReturnParams) return;

    if (mpStatus && mpStatus !== 'approved' && mpStatus !== 'authorized') {
      clearPending();
      openSnack('El pago no fue aprobado. No se realizó ningún cambio de plan.', 'info');

      const url = new URL(window.location.href);
      url.searchParams.delete('preapproval_id');
      url.searchParams.delete('payment_id');
      url.searchParams.delete('collection_id');
      url.searchParams.delete('status');
      url.searchParams.delete('collection_status');
      window.history.replaceState({}, '', url.toString());
      return;
    }

    const preapprovalId = preapprovalFromQuery || sessionStorage.getItem('mp_preapproval_id');

    const guardKey = preapprovalId
      ? `confirmed:${preapprovalId}`
      : `confirmed:by-search:${commerceIdLS}:${planIdLS}`;

    if (sessionStorage.getItem(guardKey)) return;
    sessionStorage.setItem(guardKey, '1');

    (async () => {
      try {
        const payload = {
          plan_id: planIdLS,
          commerce_id: commerceIdLS,
          payer_email: userEmail || 'TEST_USER_1278385314@testuser.com',
        };
        if (preapprovalId) payload.preapproval_id = preapprovalId;

        const resp = await fetch(`${API_BASE}/api/subscriptions/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(json?.error || 'No se pudo confirmar la suscripción');

        const backendMpStatus = json?.mp_status;
        if (backendMpStatus && backendMpStatus !== 'approved' && backendMpStatus !== 'authorized') {
          clearPending();
          openSnack('El pago no fue aprobado. No se realizó ningún cambio de plan.', 'info');
          sessionStorage.removeItem(guardKey);
          return;
        }

        clearPending();

        const url = new URL(window.location.href);
        url.searchParams.delete('preapproval_id');
        url.searchParams.delete('payment_id');
        url.searchParams.delete('collection_id');
        url.searchParams.delete('status');
        url.searchParams.delete('collection_status');
        window.history.replaceState({}, '', url.toString());

        setSubscribedPlans(new Set([Number(planIdLS)]));
        window.dispatchEvent(new CustomEvent('comidin:subscriptions-updated'));

        openSnack(`¡Suscripción exitosa! ${planName(planIdLS)} activada.`, 'success');
      } catch (e) {
        console.error('Confirmación falló:', e);
        sessionStorage.removeItem(guardKey);
        openSnack('No se pudo confirmar el pago. No se realizó ningún cambio de plan.', 'error');
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Disable: deshabilitar si es plan actual
  const disableSubscribe = loading || checkingSub || isCurrentPlan;

  // ✅ Label: marcar como actual incluso FREE
  let buttonLabel = labelAction;
  if (loading) buttonLabel = 'Procesando...';
  else if (isCurrentPlan) buttonLabel = 'Suscripción Actual';
  else if (basic) buttonLabel = 'Elegir Gratis';
  else if (starter) buttonLabel = 'Elegir Estándar';
  else if (premium) buttonLabel = 'Elegir Premium';

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

      {isCurrentPlan && (
        <Typography variant="caption" color="text.secondary">
          Estás en este plan actualmente.
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
        <Stack
          key={item}
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ typography: 'body2' }}
        >
          <Iconify icon="eva:checkmark-fill" width={16} sx={{ mr: 1 }} />
          {item}
        </Stack>
      ))}

      {not_lists.map((item) => (
        <Stack
          key={item}
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ typography: 'body2' }}
        >
          <Iconify icon="eva:close-fill" width={16} sx={{ mr: 1 }} />
          {item}
        </Stack>
      ))}
    </Stack>
  );

  return (
    <>
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
          disabled={disableSubscribe}
          color={starter ? 'primary' : 'inherit'}
          onClick={handleSubscribe}
        >
          {buttonLabel}
        </Button>
      </Stack>

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={closeSnack} severity={snackSeverity} variant="filled" elevation={3}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </>
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
