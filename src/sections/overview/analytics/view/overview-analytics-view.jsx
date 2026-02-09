import { useMemo, useState, useEffect } from 'react';
import { format, isAfter, isBefore, endOfMonth, startOfMonth } from 'date-fns';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';

import { usePermissions } from 'src/hooks/use-permissions';

import {
  _appFeatured,
} from 'src/_mock';
import { fetchOverview } from 'src/api/analytics';
import { useGetCommerces } from 'src/api/commerce';
import { SeoIllustration } from 'src/assets/illustrations';
import { fetchBenefitsByCommerceId } from 'src/api/subscription';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { useSettingsContext } from 'src/components/settings';

import AppWelcome from '../app-welcome';
import AppFeatured from '../app-featured';
import PeriodSelector from '../../period-selector';
import ReportDownloadMenu from '../../report-download-menu';
import AnalyticsCurrentVisits from '../analytics-current-visits';
import AnalyticsWebsiteVisits from '../analytics-website-visits';
import AnalyticsWidgetSummary from '../analytics-widget-summary';
import AnalyticsTopProductsBar from '../../analytics-top-products-bar';

// ---------- Helpers ----------
function monthKeyToShortLabel(key) {
  const [y, m] = key.split('-').map((n) => parseInt(n, 10));
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    year: '2-digit',
  }).format(d);
}

function buildMonthlyChart(overview, period, customRange) {
  let months = overview?.salesByMonth ?? [];

  if (String(period).toLowerCase() === 'custom' && customRange?.startDate && customRange?.endDate) {
    const start = customRange.startDate;
    const end = customRange.endDate;
    months = months.filter((m) => {
      const [y, mo] = m.month.split('-').map((n) => parseInt(n, 10));
      const monthStart = startOfMonth(new Date(y, mo - 1, 1));
      const monthEnd = endOfMonth(new Date(y, mo - 1, 1));
      return !isAfter(monthStart, end) && !isBefore(monthEnd, start);
    });
  }

  const labels = months.map((m) => monthKeyToShortLabel(m.month));
  const ordersSeries = months.map((m) => Number(m.ordersCount ?? 0));
  const amountSeries = months.map((m) => Number(m.totalAmount ?? 0));

  return {
    labels,
    series: [
      { name: 'Pedidos', type: 'line', fill: 'solid', data: ordersSeries },
      { name: 'Ventas ($)', type: 'area', fill: 'gradient', data: amountSeries },
    ],
  };
}

function subheaderFromPeriod(period, customRange) {
  switch (period) {
    case 'last1m':
      return 'Último mes';
    case 'last3m':
      return 'Últimos 3 meses';
    case 'last6m':
      return 'Últimos 6 meses';
    case 'last12m':
      return 'Últimos 12 meses';
    case 'custom':
      return customRange?.startDate && customRange?.endDate
        ? `Personalizado: ${format(customRange.startDate, 'dd/MM/yyyy')} a ${format(customRange.endDate, 'dd/MM/yyyy')}`
        : 'Personalizado';
    case 'all':
      return 'Histórico (línea: últimos 12 meses)';
    default:
      return 'Período';
  }
}

// ---------- Page ----------
export default function OverviewAnalyticsView() {
  const auth = useAuthContext();
  const settings = useSettingsContext();
  const { isAdmin } = usePermissions();

  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  const [period, setPeriod] = useState('last3m');

  const [customRange, setCustomRange] = useState({ startDate: null, endDate: null });

  const [benefits, setBenefits] = useState(null);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [benefitsError, setBenefitsError] = useState('');

  // Estado para el selector de comercio (solo admin)
  const [selectedCommerce, setSelectedCommerce] = useState(null);

  const { commerces, commercesLoading } = useGetCommerces();

  const userCommerceId =
    auth?.user?.commerce?.id ??
    auth?.user?.commerce_id ??
    auth?.commerce?.id ??
    auth?.commerce_id ??
    null;

  // Si es admin, usar el comercio seleccionado; si no, usar el del usuario
  const activeCommerceId = isAdmin ? selectedCommerce?.id : userCommerceId;

  const authToken =
    auth?.accessToken ||
    auth?.token ||
    localStorage.getItem('accessToken') ||
    '';

  // Admin siempre tiene acceso a reportes; el resto depende del plan del comercio
  const hasReportsAccess = isAdmin || benefits?.access_reports === true;

  // ---------- Beneficios (FIX build: siempre retorna cleanup) ----------
  useEffect(() => {
    let alive = true;

    if (activeCommerceId == null) {
      setBenefits(null);
      if (!isAdmin) {
        setBenefitsError('No se pudo determinar tu comercio (commerceId).');
      } else {
        setBenefitsError('');
      }
    } else {
      setBenefitsLoading(true);
      setBenefitsError('');

      fetchBenefitsByCommerceId(Number(activeCommerceId))
        .then((b) => {
          if (alive) setBenefits(b);
        })
        .catch((err) => {
          if (alive) {
            setBenefits(null);
            setBenefitsError(
              err?.message || 'No se pudieron cargar los beneficios del plan.'
            );
          }
        })
        .finally(() => {
          if (alive) setBenefitsLoading(false);
        });
    }

    return () => {
      alive = false;
    };
  }, [activeCommerceId, isAdmin]);

  // ---------- Analytics ----------
  useEffect(() => {
    if (activeCommerceId == null) {
      setOverview(null);
      if (!isAdmin) {
        setError('No se pudo determinar tu comercio (commerceId).');
      } else {
        setError('');
      }
      return;
    }

    if (benefitsLoading && !isAdmin) return;

    if (!hasReportsAccess) {
      setOverview(null);
      setError('');
      return;
    }

    if (String(period).toLowerCase() === 'custom') {
      if (!customRange.startDate || !customRange.endDate) {
        setOverview(null);
        setError('Seleccioná "Desde" y "Hasta" para el rango personalizado.');
        return;
      }
    }

    const startDateStr = customRange.startDate
      ? format(customRange.startDate, 'yyyy-MM-dd')
      : '';
    const endDateStr = customRange.endDate ? format(customRange.endDate, 'yyyy-MM-dd') : '';

    setError('');
    fetchOverview(
      period,
      Number(activeCommerceId),
      String(period).toLowerCase() === 'custom'
        ? { startDate: startDateStr, endDate: endDateStr }
        : {}
    )
      .then(setOverview)
      .catch((err) => {
        console.error('overview error', err);
        setOverview(null);
        setError(err?.message || 'No se pudieron cargar las métricas');
      });
  }, [activeCommerceId, period, hasReportsAccess, benefitsLoading, isAdmin, customRange.startDate, customRange.endDate]);

  const monthlyChart = useMemo(
    () => buildMonthlyChart(overview, period, customRange),
    [overview, period, customRange]
  );

  const resolvedCount = Number(
    overview?.resolvedOrders ?? overview?.pieOrders?.resolvedOrders ?? 0
  );
  const claimedTotal = Number(
    overview?.claimedOrders ?? overview?.pieOrders?.claimedOrders ?? 0
  );
  const claimedUnresolved = Math.max(0, claimedTotal - resolvedCount);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <AppWelcome
            title={`Te damos la bienvenida 👋 \n ${auth?.user?.first_name ?? ''} ${
              auth?.user?.last_name ?? ''
            }`}
            description="¿Qué vas a vender hoy? Hay muchos clientes esperando por tus productos"
            img={<SeoIllustration />}
          />
        </Grid>
        <Grid xs={12} md={4}>
          <AppFeatured list={_appFeatured} />
        </Grid>
      </Grid>

      {isAdmin && (
        <Stack sx={{ mb: 3, mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
            Seleccioná un comercio para ver sus estadísticas
          </Typography>
          <Autocomplete
            value={selectedCommerce}
            onChange={(_, newValue) => setSelectedCommerce(newValue)}
            options={commerces || []}
            getOptionLabel={(option) => option?.name || ''}
            loading={commercesLoading}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Buscar comercio..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {commercesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{ maxWidth: 400 }}
          />
        </Stack>
      )}

      {!!benefitsError && !isAdmin && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {benefitsError}
        </Alert>
      )}

      {!benefitsLoading && benefits && !hasReportsAccess && !isAdmin && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Tu suscripción actual no incluye <b>reportes</b> ni <b>estadísticas</b>.
        </Alert>
      )}

      {isAdmin && !selectedCommerce && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Seleccioná un comercio arriba para ver sus estadísticas (pedidos, ingresos, productos vendidos, etc.).
        </Alert>
      )}

      {hasReportsAccess && activeCommerceId != null && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            my: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
            bgcolor: 'background.paper',
          }}
        >
          <PeriodSelector value={period} onChange={setPeriod} />

          {String(period).toLowerCase() === 'custom' && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'nowrap' }}>
              <DatePicker
                label="Desde"
                value={customRange.startDate}
                onChange={(date) => {
                  setCustomRange((p) => {
                    const next = { ...p, startDate: date };
                    if (date && p.endDate && date > p.endDate) {
                      next.endDate = null;
                    }
                    return next;
                  });
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
                sx={{ minWidth: 160, maxWidth: 200 }}
              />
              <DatePicker
                label="Hasta"
                value={customRange.endDate}
                onChange={(date) => setCustomRange((p) => ({ ...p, endDate: date }))}
                minDate={customRange.startDate ?? undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
                sx={{ minWidth: 160, maxWidth: 200 }}
              />
            </Box>
          )}

          {activeCommerceId != null && (
            <ReportDownloadMenu
              period={period}
              commerceId={Number(activeCommerceId)}
              token={authToken}
              startDate={
                customRange.startDate ? format(customRange.startDate, 'yyyy-MM-dd') : ''
              }
              endDate={customRange.endDate ? format(customRange.endDate, 'yyyy-MM-dd') : ''}
            />
          )}

          {!!error && (
            <Box sx={{ width: '100%', color: 'error.main', typography: 'body2', mt: 0.5 }}>
              {error}
            </Box>
          )}
        </Paper>
      )}

      {!hasReportsAccess || activeCommerceId == null ? null : (
        <Grid container spacing={3}>
          <Grid xs={12} sm={6} md={4}>
            <AnalyticsWidgetSummary
              title="Ingresos / Facturado (período)"
              total={Number(overview?.totalRevenue ?? 0)}
              icon={<img alt="icon" src="/assets/icons/glass/ic_glass_bag.png" />}
            />
          </Grid>

          <Grid xs={12} sm={6} md={4}>
            <AnalyticsWidgetSummary
              title="Pedidos realizados (período)"
              total={Number(overview?.totalOrders ?? 0)}
              color="info"
              icon={<img alt="icon" src="/assets/icons/glass/ic_glass_buy.png" />}
            />
          </Grid>

          <Grid xs={12} sm={6} md={4}>
            <AnalyticsWidgetSummary
              title="Pedidos reclamados (período)"
              total={Number(
                overview?.claimedOrders ??
                overview?.pieOrders?.claimedOrders ??
                0
              )}
              color="warning"
              icon={<img alt="icon" src="/assets/icons/glass/ic_glass_message.png" />}
            />
          </Grid>

          <Grid xs={12} sm={6} md={6}>
            <AnalyticsWidgetSummary
              title="Pedidos con reclamo resuelto (período)"
              total={resolvedCount}
              color="success"
              icon={<img alt="icon" src="/assets/icons/glass/ic_glass_message.png" />}
            />
          </Grid>

          <Grid xs={12} sm={6} md={6}>
            <AnalyticsWidgetSummary
              title="Productos vencidos (período)"
              total={Number(overview?.expiredProducts ?? 0)}
              color="error"
              icon={<img alt="icon" src="/assets/icons/glass/ic_glass_users.png" />}
            />
          </Grid>

          <Grid xs={12} md={12}>
            <AnalyticsWebsiteVisits
              title="Ventas y pedidos por mes"
              subheader={subheaderFromPeriod(period, customRange)}
              chart={{
                labels: monthlyChart.labels,
                series: monthlyChart.series,
              }}
            />
          </Grid>

          <Grid xs={12} md={6}>
            <AnalyticsTopProductsBar data={overview?.topProductsBar || []} />
          </Grid>

          <Grid xs={12} md={3}>
            <AnalyticsCurrentVisits
              title="Productos: vendidos vs vencidos"
              chart={{
                series: [
                  { label: 'Vendidos', value: Number(overview?.pieProducts?.soldUnits ?? 0) },
                  { label: 'Vencidos', value: Number(overview?.pieProducts?.expiredUnits ?? 0) },
                ],
              }}
            />
          </Grid>

          <Grid xs={12} md={3}>
            <AnalyticsCurrentVisits
              title="Pedidos: realizados vs reclamados"
              chart={{
                series: [
                  { label: 'Realizados', value: Number(overview?.pieOrders?.completedOrders ?? 0) },
                  { label: 'Reclamados (no resueltos)', value: claimedUnresolved },
                  { label: 'Reclamados resueltos', value: resolvedCount },
                ],
              }}
            />
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
