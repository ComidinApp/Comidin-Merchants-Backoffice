// src/sections/overview/analytics-website-visits.jsx
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export default function AnalyticsWebsiteVisits({ title, subheader, chart, ...other }) {
  const { labels = [], series = [], options } = chart || {};

  // Derivar stroke/fill dinámicos
  const strokeWidth = series.map((s) => (s.type === 'area' ? 2 : 3));
  const fillTypes = series.map((s) => s.fill || 'solid');

  // 🎨 Paleta de colores personalizada
  // Azul del gráfico de torta (#00B8D9) y naranja actual (#FF8C00)
  const customColors = ['#00B8D9', '#FF8C00'];

  // Detectar doble eje Y (Pedidos + Ventas)
  const hasDualAxis = series.length === 2 && series.some((s) => /venta|\$|monto/i.test(s.name));

  const yaxis = hasDualAxis
    ? [
        {
          seriesName: 'Pedidos',
          title: { text: 'Pedidos' },
          decimalsInFloat: 0,
          labels: {
            formatter: (v) => `${Math.round(Number(v) || 0)}`,
          },
        },
        {
          seriesName: 'Ventas ($)',
          title: { text: 'Ventas ($)' },
          opposite: true,
          labels: {
            formatter: (v) => `$ ${Number(v || 0).toLocaleString('es-AR')}`,
          },
        },
      ]
    : undefined;

  const chartOptions = useChart({
    colors: customColors,
    stroke: { width: strokeWidth, curve: 'smooth' },
    fill: { type: fillTypes, opacity: [1, 0.25] }, // el área de ventas semitransparente
    labels,
    xaxis: {
      type: 'category',
      categories: labels,
    },
    yaxis,
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value, { seriesIndex }) => {
          if (value == null || Number.isNaN(value)) return value;
          const name = (series?.[seriesIndex]?.name || '').toLowerCase();
          if (name.includes('venta') || name.includes('$') || name.includes('monto')) {
            return `$ ${Number(value).toLocaleString('es-AR')}`;
          }
          return `${Number(value).toLocaleString('es-AR')}`;
        },
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#555' },
      markers: { width: 10, height: 10, radius: 6 },
    },
    ...options,
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
      <Box sx={{ p: 3, pb: 1 }}>
        <Chart
          dir="ltr"
          type="line"
          series={series}
          options={chartOptions}
          width="100%"
          height={364}
        />
      </Box>
    </Card>
  );
}

AnalyticsWebsiteVisits.propTypes = {
  chart: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string),
    series: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        type: PropTypes.oneOf(['line', 'area']).isRequired,
        fill: PropTypes.oneOf(['solid', 'gradient']),
        data: PropTypes.arrayOf(PropTypes.number).isRequired,
      })
    ),
    options: PropTypes.object,
  }),
  subheader: PropTypes.string,
  title: PropTypes.string,
};
