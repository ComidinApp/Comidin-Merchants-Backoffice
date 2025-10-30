// src/sections/overview/analytics/view/overview-analytics-view.jsx
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import { useEffect, useState, useMemo } from 'react';

import { useSettingsContext } from 'src/components/settings';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import { SeoIllustration } from 'src/assets/illustrations';

import { fetchOverview } from 'src/api/analytics';
import {
  _appFeatured,
  _analyticTasks,
  _analyticPosts,
  _analyticTraffic,
  _analyticOrderTimeline,
} from 'src/_mock';

import AppWelcome from '../app-welcome';
import AppFeatured from '../app-featured';
import AnalyticsNews from '../analytics-news';
import AnalyticsTasks from '../analytics-tasks';
import AnalyticsCurrentVisits from '../analytics-current-visits';
import AnalyticsOrderTimeline from '../analytics-order-timeline';
import AnalyticsWebsiteVisits from '../analytics-website-visits';
import AnalyticsWidgetSummary from '../analytics-widget-summary';
import AnalyticsTrafficBySite from '../analytics-traffic-by-site';
import AnalyticsCurrentSubject from '../analytics-current-subject';
import AnalyticsConversionRates from '../analytics-conversion-rates';

// 👉 NUEVO: Top 3 en barras (ruta relativa desde /overview/analytics/view/)
import AnalyticsTopProductsBar from '../../analytics-top-products-bar';

// --- Helpers ---
function monthKeyToShortLabel(key) {
  const [y, m] = key.split('-').map((n) => parseInt(n, 10));
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit' }).format(d);
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

// --- Page ---
export default function OverviewAnalyticsView() {
  const auth = useAuthContext();
  const settings = useSettingsContext();

  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  const userCommerceId =
    auth?.user?.commerce?.id ??
    auth?.user?.commerce_id ??
    auth?.commerce?.id ??
    auth?.commerce_id ??
    null;

  useEffect(() => {
    if (userCommerceId == null) {
      console.warn('[Analytics] No se pudo obtener commerceId del usuario');
      setOverview(null);
      setError('No se pudo determinar tu comercio (commerceId).');
      return;
    }

    setError('');
    fetchOverview('last30d', Number(userCommerceId))
      .then(setOverview)
      .catch((err) => {
        console.error('overview error', err);
        setOverview(null);
        setError(err?.message || 'No se pudieron cargar las métricas');
      });
  }, [userCommerceId]);

  const monthlyChart = useMemo(() => buildMonthlyChart(overview), [overview]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <AppWelcome
            title={`Te damos la bienvenida 👋 \n ${auth?.user?.first_name ?? ''} ${auth?.user?.last_name ?? ''}`}
            description="¿Qué vas a vender hoy? Hay muchos clientes esperando por tus productos"
            img={<SeoIllustration />}
          />
        </Grid>
        <Grid xs={12} md={4}>
          <AppFeatured list={_appFeatured} />
        </Grid>
      </Grid>

      {!!error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}

      <Grid container spacing={3}>
        {/* KPIs nuevos */}
        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Ingresos (histórico)"
            total={Number(overview?.totalRevenue ?? 0)}
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_bag.png" />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Pedidos realizados (histórico)"
            total={Number(overview?.totalOrders ?? 0)}
            color="info"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_buy.png" />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Pedidos devueltos (histórico)"
            total={Number(overview?.returnedOrders ?? 0)}
            color="warning"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_message.png" />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Productos vencidos (histórico)"
            total={Number(overview?.expiredProducts ?? 0)}
            color="error"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_users.png" />}
          />
        </Grid>

        {/* Gráfico combinado (si no hay datos, se mostrará vacío sin romper) */}
        <Grid xs={12} md={12}>
          <AnalyticsWebsiteVisits
            title="Ventas y pedidos por mes"
            subheader="Últimos 12 meses"
            chart={{
              labels: monthlyChart.labels,
              series: monthlyChart.series, // [Pedidos(line), Ventas(area)]
            }}
          />
        </Grid>

        {/* NUEVOS BLOQUES */}
        {/* Barras: Top 3 productos por unidades */}
        <Grid xs={12} md={6} lg={6}>
          <AnalyticsTopProductsBar data={overview?.topProductsBar || []} />
        </Grid>

        {/* Torta: productos vendidos vs vencidos */}
        <Grid xs={12} md={6} lg={3}>
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

        {/* Torta: pedidos realizados vs reclamados */}
        <Grid xs={12} md={6} lg={3}>
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


        <Grid xs={12} md={6} lg={8}>
          <AnalyticsNews title="News" list={_analyticPosts} />
        </Grid>
        <Grid xs={12} md={6} lg={4}>
          <AnalyticsOrderTimeline title="Order Timeline" list={_analyticOrderTimeline} />
        </Grid>
        <Grid xs={12} md={6} lg={4}>
          <AnalyticsTrafficBySite title="Traffic by Site" list={_analyticTraffic} />
        </Grid>
        <Grid xs={12} md={6} lg={8}>
          <AnalyticsTasks title="Tasks" list={_analyticTasks} />
        </Grid>
      </Grid>
    </Container>
  );
}
