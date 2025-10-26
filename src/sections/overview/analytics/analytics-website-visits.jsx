// src/sections/overview/analytics-website-visits.jsx
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export default function AnalyticsWebsiteVisits({ title, subheader, chart, ...other }) {
  const { labels = [], colors, series = [], options } = chart || {};

  // Derivar stroke.width dinámicamente según el tipo de serie
  const strokeWidth = series.map((s) => {
    if (s.type === 'column') return 0;
    if (s.type === 'area') return 2;
    return 3; // line u otros
  });

  // Derivar fill.type según cada serie (fallback a 'solid')
  const fillTypes = series.map((s) => s.fill || 'solid');

  const chartOptions = useChart({
    colors,
    plotOptions: {
      bar: { columnWidth: '16%' },
    },
    stroke: { width: strokeWidth },
    fill: { type: fillTypes },
    // Usamos labels textuales (p.ej. "Oct '25"), no datetime
    labels,
    xaxis: {
      type: 'category',
      categories: labels,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value, { seriesIndex }) => {
          if (value == null || Number.isNaN(value)) return value;
          const name = (series?.[seriesIndex]?.name || '').toLowerCase();

          // Heurística: si es ventas ($), mostramos moneda; si no, entero
          if (name.includes('venta') || name.includes('$') || name.includes('monto')) {
            return `$ ${Number(value).toLocaleString('es-AR')}`;
          }
          return `${Number(value).toLocaleString('es-AR')}`;
        },
      },
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
    colors: PropTypes.array,
    series: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        type: PropTypes.oneOf(['line', 'area', 'column']),
        fill: PropTypes.oneOf(['solid', 'gradient']),
        data: PropTypes.arrayOf(PropTypes.number),
      })
    ),
    options: PropTypes.object,
  }),
  subheader: PropTypes.string,
  title: PropTypes.string,
};
