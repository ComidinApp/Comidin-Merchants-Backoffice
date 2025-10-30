import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Chart, { useChart } from 'src/components/chart';

export default function AnalyticsTopProductsBar({ title = 'Top 3 productos (unidades)', data = [] }) {
  const labels = data.map((d) => d.productName);
  const series = [{ name: 'Unidades', type: 'bar', data: data.map((d) => Number(d.units || 0)) }];

  const chartOptions = useChart({
    chart: { stacked: false },
    plotOptions: { bar: { columnWidth: '40%' } },
    dataLabels: { enabled: true },
    xaxis: { categories: labels },
  });

  return (
    <Card>
      <CardHeader title={title} />
      <Box sx={{ p: 3, pb: 1 }}>
        <Chart type="bar" series={series} options={chartOptions} height={360} />
      </Box>
    </Card>
  );
}
AnalyticsTopProductsBar.propTypes = {
  title: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.shape({ productName: PropTypes.string, units: PropTypes.number })),
};
