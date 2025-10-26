// src/sections/overview/overview-analytics-view.jsx
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import { useEffect, useState, useMemo } from 'react';

import { useSettingsContext } from 'src/components/settings';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import { SeoIllustration } from 'src/assets/illustrations';

// 👉 Imports absolutos antes de relativos
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

// ----------------------------------------------------------------------
// Helpers de transformación

// "2025-10" -> "oct '25"
function monthKeyToShortLabel(key) {
  const [y, m] = key.split('-').map((n) => parseInt(n, 10));
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit' }).format(d);
}

// Solo labels
function buildMonthlyLabels(overview) {
  return (overview?.salesByMonth ?? []).map((m) => monthKeyToShortLabel(m.month));
}

// Serie de pedidos por mes (enteros)
function buildOrdersSeries(overview) {
  const data = (overview?.salesByMonth ?? []).map((m) => Number(m.ordersCount ?? 0));
  return [
    { name: 'Pedidos', type: 'column', fill: 'solid', data },
  ];
}

// Serie de ventas por mes (monto)
function buildAmountSeries(overview) {
  const data = (overview?.salesByMonth ?? []).map((m) => Number(m.totalAmount ?? 0));
  return [
    { name: 'Ventas ($)', type: 'area', fill: 'gradient', data },
  ];
}

// Torta de top productos (porcentaje)
function buildTopProducts(overview) {
  const top = overview?.topProducts ?? [];
  return top.map((t) => ({
    label: t.productName ?? 'Desconocido',
    value: Number(t.percentage ?? 0),
  }));
}

// ----------------------------------------------------------------------

export default function OverviewAnalyticsView() {
  const auth = useAuthContext();
  const settings = useSettingsContext();

  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  // SIEMPRE tomamos el commerce del usuario logueado
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
    console.debug('[Analytics] usando commerceId:', userCommerceId);

    fetchOverview('last30d', Number(userCommerceId))
      .then(setOverview)
      .catch((err) => {
        console.error('overview error', err);
        setOverview(null);
        setError(err?.message || 'No se pudieron cargar las métricas');
      });
  }, [userCommerceId]);

  // Datos memorizados para los gráficos
  const labels = useMemo(() => buildMonthlyLabels(overview), [overview]);
  const ordersSeries = useMemo(() => buildOrdersSeries(overview), [overview]);
  const amountSeries = useMemo(() => buildAmountSeries(overview), [overview]);
  const topProductsSeries = useMemo(() => buildTopProducts(overview), [overview]);

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
        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Ventas (últimos 30 días)"
            total={Number(overview?.monthlySalesAmount ?? 0)}
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_bag.png" />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Usuarios"
            total={Number(overview?.totalUsers ?? 0)}
            color="info"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_users.png" />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Pedidos (últimos 30 días)"
            total={Number(overview?.monthlyOrdersCount ?? 0)}
            color="warning"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_buy.png" />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Productos vendidos (histórico)"
            total={Number(overview?.productsSold ?? 0)}
            color="error"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_message.png" />}
          />
        </Grid>

        {/* 📊 Gráfico 1: Pedidos por mes */}
        <Grid xs={12} md={6}>
          <AnalyticsWebsiteVisits
            title="Pedidos por mes"
            subheader="Últimos 12 meses"
            chart={{
              labels,
              series: ordersSeries, // 1 serie (column)
            }}
          />
        </Grid>

        {/* 💰 Gráfico 2: Ventas ($) por mes */}
        <Grid xs={12} md={6}>
          <AnalyticsWebsiteVisits
            title="Ventas ($) por mes"
            subheader="Últimos 12 meses"
            chart={{
              labels,
              series: amountSeries, // 1 serie (area)
            }}
          />
        </Grid>

        {/* 🥧 Top productos por porcentaje */}
        <Grid xs={12} md={6} lg={4}>
          <AnalyticsCurrentVisits
            title="Top productos (porcentaje de unidades)"
            chart={{ series: topProductsSeries }}
          />
        </Grid>

        {/* 🔽 El resto queda mockeado sin cambios */}
        <Grid xs={12} md={6} lg={8}>
          <AnalyticsConversionRates
            title="Conversion Rates"
            subheader="(+43%) than last year"
            chart={{
              series: [
                { label: 'Italy', value: 400 },
                { label: 'Japan', value: 430 },
                { label: 'China', value: 448 },
                { label: 'Canada', value: 470 },
                { label: 'France', value: 540 },
                { label: 'Germany', value: 580 },
                { label: 'South Korea', value: 690 },
                { label: 'Netherlands', value: 1100 },
                { label: 'United States', value: 1200 },
                { label: 'United Kingdom', value: 1380 },
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
