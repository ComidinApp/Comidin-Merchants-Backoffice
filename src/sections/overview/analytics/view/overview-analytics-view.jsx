import { useMemo, useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField'; // ✅ NUEVO

import {
  _appFeatured,
} from 'src/_mock';
import { fetchOverview } from 'src/api/analytics';
import { SeoIllustration } from 'src/assets/illustrations';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import { fetchBenefitsByCommerceId } from 'src/api/subscription';

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

function buildMonthlyChart(overview) {
  const months = overview?.salesByMonth ?? [];
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
        ? `Personalizado: ${customRange.startDate} a ${customRange.endDate}`
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

  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  const [period, setPeriod] = useState('last3m');

  // ✅ NUEVO: rango custom (YYYY-MM-DD)
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });

  const [benefits, setBenefits] = useState(null);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [benefitsError, setBenefitsError] = useState('');

  const userCommerceId =
    auth?.user?.commerce?.id ??
    auth?.user?.commerce_id ??
    auth?.commerce?.id ??
    auth?.commerce_id ??
    null;

  const authToken =
    auth?.accessToken ||
    auth?.token ||
    localStorage.getItem('accessToken') ||
    '';

  const hasReportsAccess = benefits?.access_reports === true;

  // ---------- Beneficios (FIX build: siempre retorna cleanup) ----------
  useEffect(() => {
    let alive = true;

    if (userCommerceId == null) {
      setBenefits(null);
      setBenefitsError('No se pudo determinar tu comercio (commerceId).');
    } else {
      setBenefitsLoading(true);
      setBenefitsError('');

      fetchBenefitsByCommerceId(Number(userCommerceId))
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
  }, [userCommerceId]);

  // ---------- Analytics ----------
  useEffect(() => {
    if (userCommerceId == null) {
      setOverview(null);
      setError('No se pudo determinar tu comercio (commerceId).');
      return;
    }

    if (benefitsLoading) return;

    if (!hasReportsAccess) {
      setOverview(null);
      setError('');
      return;
    }

    // ✅ si es custom y falta algo, no pegamos al backend
    if (String(period).toLowerCase() === 'custom') {
      if (!customRange.startDate || !customRange.endDate) {
        setOverview(null);
        setError('Seleccioná "Desde" y "Hasta" para el rango personalizado.');
        return;
      }
    }

    setError('');
    fetchOverview(
      period,
      Number(userCommerceId),
      String(period).toLowerCase() === 'custom'
        ? { startDate: customRange.startDate, endDate: customRange.endDate }
        : {}
    )
      .then(setOverview)
      .catch((err) => {
        console.error('overview error', err);
        setOverview(null);
        setError(err?.message || 'No se pudieron cargar las métricas');
      });
  }, [userCommerceId, period, hasReportsAccess, benefitsLoading, customRange.startDate, customRange.endDate]);

  const monthlyChart = useMemo(
    () => buildMonthlyChart(overview),
    [overview]
  );

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

      {!!benefitsError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {benefitsError}
        </Alert>
      )}

      {!benefitsLoading && benefits && !hasReportsAccess && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Tu suscripción actual no incluye <b>reportes</b> ni <b>estadísticas</b>.
        </Alert>
      )}

      {hasReportsAccess && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '12px 0', flexWrap: 'wrap' }}>
          <PeriodSelector value={period} onChange={setPeriod} />

          {/* ✅ NUEVO: inputs custom, estilo MUI */}
          {String(period).toLowerCase() === 'custom' && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Desde"
                type="date"
                size="small"
                value={customRange.startDate}
                onChange={(e) => setCustomRange((p) => ({ ...p, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Hasta"
                type="date"
                size="small"
                value={customRange.endDate}
                onChange={(e) => setCustomRange((p) => ({ ...p, endDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </div>
          )}

          {userCommerceId != null && (
            <ReportDownloadMenu
              period={period}
              commerceId={Number(userCommerceId)}
              token={authToken}
              // ✅ IMPORTANTE: pasamos rango para que el menu arme URLs con start/end
              startDate={customRange.startDate}
              endDate={customRange.endDate}
            />
          )}
        </div>
      )}

      {!!error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}

      {!hasReportsAccess ? null : (
        <Grid container spacing={3}>
          <Grid xs={12} sm={6} md={3}>
            <AnalyticsWidgetSummary
              title="Ingresos (período)"
              total={Number(overview?.totalRevenue ?? 0)}
              icon={<img alt="icon" src="/assets/icons/glass/ic_glass_bag.png" />}
            />
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <AnalyticsWidgetSummary
              title="Pedidos realizados (período)"
              total={Number(overview?.totalOrders ?? 0)}
              color="info"
              icon={<img alt="icon" src="/assets/icons/glass/ic_glass_buy.png" />}
            />
          </Grid>

          <Grid xs={12} sm={6} md={3}>
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

          <Grid xs={12} sm={6} md={3}>
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
                  { label: 'Reclamados', value: Number(overview?.pieOrders?.claimedOrders ?? 0) },
                ],
              }}
            />
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
