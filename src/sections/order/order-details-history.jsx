import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

const STATUS_LABELS = {
  PENDING: 'Pedido creado',
  CONFIRMED: 'Pedido confirmado',
  CLAIMED: 'Reclamo iniciado',
  REFUNDED: 'Se realizo el reembolso',
  PREPARING: 'En preparación',
  DISPATCHED: 'En camino',
  COMPLETED: 'Pedido completado',
  CANCELLED: 'Pedido cancelado',
  DELIVERED: 'Pedido entregado',
  RESOLVED: 'Pedido con reclamo resuelto',
};

export default function OrderDetailsHistory({ orderHistory, currentStatus }) {
  const timelineItems = Array.isArray(orderHistory)
    ? [...orderHistory]
        .filter((h) => h?.created_at)
        // Mostrar el más reciente arriba (como el mock)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const renderTimeline =
    timelineItems.length === 0 ? (
      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
        Sin historial
      </Typography>
    ) : (
      <Timeline
        sx={{
          p: 0,
          m: 0,
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0,
          },
        }}
      >
        {timelineItems.map((item, index) => {
          const firstTimeline = index === 0;
          const lastTimeline = index === timelineItems.length - 1;

          // Marcamos como “current” el que coincide con el status actual;
          // si no coincide ninguno, el primero (más reciente) queda como current.
          const isCurrent = (currentStatus && item.status === currentStatus) || firstTimeline;

          const title = STATUS_LABELS[item.status] || item.status;

          return (
            <TimelineItem key={`${item.id ?? item.status}-${item.created_at}`}>
              <TimelineSeparator>
                <TimelineDot color={isCurrent ? 'primary' : 'grey'} />
                {lastTimeline ? null : <TimelineConnector />}
              </TimelineSeparator>

              <TimelineContent>
                <Typography variant="subtitle2">{title}</Typography>

                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}
                >
                  {fDateTime(item.created_at)}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    );

  return (
    <Card sx={{ border: '2px solid #C2672D' }}>
      <CardHeader title="Historial" sx={{ color: "#C2672D", fontWeight: 'bold' }} />
      <Stack spacing={3} sx={{ p: 3 }}>
        {renderTimeline}
      </Stack>
    </Card>
  );
}

OrderDetailsHistory.propTypes = {
  orderHistory: PropTypes.array,
  currentStatus: PropTypes.string,
};
