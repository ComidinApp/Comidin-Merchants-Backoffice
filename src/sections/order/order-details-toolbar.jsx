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
import {
  getAllowedNextStatuses,
  getOrderStatusLabel,
  isAllowedTransition,
  formatTransitionError,
  normalizeOrderStatus,
} from "src/constants/order-status";
// ----------------------------------------------------------------------
const { VITE_API_COMIDIN } = import.meta.env;

export default function OrderDetailsToolbar({
  status,
  backLink,
  createdAt,
  orderNumber,
  statusOptions, // se mantiene para compatibilidad, pero ya NO se usa para filtrar
  onChangeStatus,
}) {
  const popover = usePopover();

  const currentStatus = normalizeOrderStatus(status);

  const allowedNextStatuses = getAllowedNextStatuses(currentStatus);

  const statusOptionsFiltered = allowedNextStatuses.map((value) => ({
    value,
    label: getOrderStatusLabel(value),
  }));

  const isFinalState = allowedNextStatuses.length === 0;

  const handleChangeStatus = async (newStatus) => {
    const nextStatus = normalizeOrderStatus(newStatus);

    if (!isAllowedTransition(currentStatus, nextStatus)) {
      console.error(formatTransitionError(currentStatus, nextStatus));
      popover.onClose();
      return;
    }

    try {
      const response = await axios.put(`${VITE_API_COMIDIN}/order/status/${orderNumber}`, {
        status: nextStatus,
      });

      if (response.status === 200) {
        onChangeStatus?.(nextStatus);
        popover.onClose();
      } else {
        console.error('No se pudo actualizar el estado del pedido.');
      }
    } catch (error) {
      const apiMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;

      console.error(apiMsg || 'Error al actualizar el estado del pedido.');
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
                {getOrderStatusLabel(currentStatus)}
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
            {getOrderStatusLabel(currentStatus)}
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
            selected={normalizeOrderStatus(option.value) === currentStatus}
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
  statusOptions: PropTypes.array, // compat, ya no se usa
};
