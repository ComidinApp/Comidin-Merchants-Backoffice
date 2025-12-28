import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetCommerces } from 'src/api/commerce';
import { useGetAllSubscriptions } from 'src/api/subscription';

import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const PLAN_NAMES = {
  1: 'Básica',
  2: 'Estándar',
  3: 'Premium',
};

const PLAN_COLORS = {
  1: 'default',
  2: 'info',
  3: 'warning',
};

// ----------------------------------------------------------------------

export default function AdminSubscriptionsView() {
  const { subscriptions, subscriptionsLoading, subscriptionsError } = useGetAllSubscriptions();
  const { commerces, commercesLoading } = useGetCommerces();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Crear mapa de comercios por ID para acceso rápido
  const commercesMap = useMemo(() => {
    const map = {};
    (commerces || []).forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [commerces]);

  // Combinar suscripciones con datos de comercios
  const enrichedSubscriptions = useMemo(() => 
    (subscriptions || []).map((sub) => ({
      ...sub,
      commerce: commercesMap[sub.commerce_id] || null,
      planName: PLAN_NAMES[sub.plan_id] || `Plan ${sub.plan_id}`,
      planColor: PLAN_COLORS[sub.plan_id] || 'default',
    })),
  [subscriptions, commercesMap]);

  // Estadísticas de planes
  const planStats = useMemo(() => {
    const stats = { 1: 0, 2: 0, 3: 0 };
    enrichedSubscriptions.forEach((sub) => {
      if (stats[sub.plan_id] !== undefined) {
        stats[sub.plan_id] += 1;
      }
    });
    return stats;
  }, [enrichedSubscriptions]);

  // Paginación
  const paginatedSubscriptions = useMemo(() => {
    const start = page * rowsPerPage;
    return enrichedSubscriptions.slice(start, start + rowsPerPage);
  }, [enrichedSubscriptions, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (subscriptionsLoading || commercesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (subscriptionsError) {
    return (
      <Typography color="error" variant="h6" textAlign="center">
        Error al cargar las suscripciones: {subscriptionsError?.message}
      </Typography>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Cards de resumen */}
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
        }}
      >
        <SummaryCard
          title="Total Suscripciones"
          value={enrichedSubscriptions.length}
          color="primary"
        />
        <SummaryCard
          title="Plan Básica"
          value={planStats[1]}
          color="default"
        />
        <SummaryCard
          title="Plan Estándar"
          value={planStats[2]}
          color="info"
        />
        <SummaryCard
          title="Plan Premium"
          value={planStats[3]}
          color="warning"
        />
      </Box>

      {/* Tabla de suscripciones */}
      <Card>
        <Scrollbar>
          <TableContainer sx={{ minWidth: 800 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Comercio</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Fecha de Creación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No hay suscripciones registradas.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSubscriptions.map((sub) => (
                    <TableRow key={sub.id} hover>
                      <TableCell>{sub.id}</TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="subtitle2">
                            {sub.commerce?.name || `Comercio #${sub.commerce_id}`}
                          </Typography>
                          {sub.commerce?.address && (
                            <Typography variant="caption" color="text.secondary">
                              {sub.commerce.address}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sub.planName}
                          color={sub.planColor}
                          size="small"
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        {sub.created_at
                          ? new Date(sub.created_at).toLocaleDateString('es-AR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          count={enrichedSubscriptions.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Card>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function SummaryCard({ title, value, color }) {
  const colorMap = {
    primary: 'primary.main',
    info: 'info.main',
    warning: 'warning.main',
    default: 'text.secondary',
  };

  const bgColorMap = {
    primary: 'primary.lighter',
    info: 'info.lighter',
    warning: 'warning.lighter',
    default: 'grey.200',
  };

  return (
    <Card sx={{ p: 3, textAlign: 'center', bgcolor: bgColorMap[color] || 'grey.200' }}>
      <Typography variant="h3" sx={{ color: colorMap[color] || 'text.primary' }}>
        {value}
      </Typography>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {title}
      </Typography>
    </Card>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  color: PropTypes.oneOf(['primary', 'info', 'warning', 'default']),
};

SummaryCard.defaultProps = {
  color: 'default',
};

