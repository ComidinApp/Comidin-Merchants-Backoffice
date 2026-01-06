import axios from 'axios';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------
const { VITE_API_COMIDIN } = import.meta.env;

// Labels ES (como los dejaste)
const STATUS_LABELS_ES = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Devuelto',
  CLAIMED: 'Reclamado',
};

// Transiciones permitidas (front UX)
const STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED'],
  COMPLETED: ['REFUNDED', 'CLAIMED'],
  CANCELLED: [],
  REFUNDED: [],
  CLAIMED: [],
};

const normalizeStatus = (s) => (s || '').toString().trim().toUpperCase();

export default function OrderDetailsToolbar({
  status,
  backLink,
  createdAt,
  orderNumber,
  statusOptions, // lo mantenemos para compatibilidad, pero filtramos por flujo
  onChangeStatus,
}) {
  const popover = usePopover();

  const currentStatus = normalizeStatus(status);

  // Opciones permitidas según el estado actual (flujo)
  const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus] || [];

  // Si querés que además respete las statusOptions que viene de afuera:
  // (ej: si alguien te pasa opciones más limitadas)
  const incomingOptions = Array.isArray(statusOptions) ? statusOptions : [];
  const incomingSet = new Set(incomingOptions.map((o) => normalizeStatus(o?.value)));

  const statusOptionsFiltered = allowedNextStatuses
    .filter((st) => (incomingSet.size ? incomingSet.has(st) : true))
    .map((value) => ({
      value,
      label: STATUS_LABELS_ES[value] || value,
    }));

  const isFinalState = statusOptionsFiltered.length === 0;

  const handleChangeStatus = async (newStatus) => {
    const nextStatus = normalizeStatus(newStatus);

    try {
      const response = await axios.put(`${VITE_API_COMIDIN}/order/status/${orderNumber}`, {
        status: nextStatus,
      });

      if (response.status === 200) {
        onChangeStatus(nextStatus);
        popover.onClose();
      } else {
        console.error('Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error al realizar la solicitud', error);
    }
  };

  return (
    <>
      <Stack
        spacing={3}
        direction={{ xs: 'column', md: 'row' }}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        <Stack spacing={1} direction="row" alignItems="flex-start">
          <IconButton component={RouterLink} href={backLink}>
            <Iconify icon="eva:arrow-ios-back-fill" />
          </IconButton>

          <Stack spacing={0.5}>
            <Stack spacing={1} direction="row" alignItems="center">
              <Typography variant="h4">
                Pedido {orderNumber?.toString()?.padStart(4, '0')}
              </Typography>

              <Label
                variant="soft"
                color={
                  (currentStatus === 'COMPLETED' && 'success') ||
                  (currentStatus === 'PENDING' && 'warning') ||
                  (currentStatus === 'CONFIRMED' && 'info') ||
                  (currentStatus === 'CANCELLED' && 'error') ||
                  (currentStatus === 'CLAIMED' && 'error') ||
                  'default'
                }
              >
                {STATUS_LABELS_ES[currentStatus] || currentStatus}
              </Label>
            </Stack>

            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              {fDateTime(createdAt)}
            </Typography>
          </Stack>
        </Stack>

        <Stack
          flexGrow={1}
          spacing={1.5}
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
        >
          <Button
            color="inherit"
            variant="outlined"
            endIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
            onClick={popover.onOpen}
            sx={{ textTransform: 'none' }}
            disabled={isFinalState}
          >
            {STATUS_LABELS_ES[currentStatus] || currentStatus}
          </Button>

          <Button
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
          >
            Imprimir
          </Button>
        </Stack>
      </Stack>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="top-right"
        sx={{ width: 180 }}
      >
        {statusOptionsFiltered.map((option) => (
          <MenuItem
            key={option.value}
            selected={normalizeStatus(option.value) === currentStatus}
            onClick={() => handleChangeStatus(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </CustomPopover>
    </>
  );
}

OrderDetailsToolbar.propTypes = {
  backLink: PropTypes.string,
  createdAt: PropTypes.instanceOf(Date),
  onChangeStatus: PropTypes.func,
  orderNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  status: PropTypes.string,
  statusOptions: PropTypes.array,
};
