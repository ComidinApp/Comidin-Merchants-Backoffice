import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { _mock } from '../../_mock';
// ----------------------------------------------------------------------

export default function OrderDetailsInfo({
  customer,
  delivery,
  payment,
  commerce,
  shippingAddress,
}) {
  function stringToNumber(input) {
    let sum = 0;
    for (let i = 0; i < input.length; i += 1) {
      sum += input.charCodeAt(i);
    }

    return (sum % 24) + 1;
  }

  const randomAvatar = _mock.image.avatar(stringToNumber(customer.email));

  const renderCustomer = (
    <>
      <CardHeader
        title="Informacion del Cliente"
        /* action={
          <IconButton>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        } */
      />
      <Stack direction="row" sx={{ p: 3 }}>
        <Avatar
          alt={customer.first_name}
          src={randomAvatar}
          sx={{ width: 48, height: 48, mr: 2 }}
        />

        <Stack spacing={0.5} alignItems="flex-start" sx={{ typography: 'body2' }}>
          <Typography variant="subtitle2">{customer.first_name}</Typography>

          <Box sx={{ color: 'text.secondary' }}>{customer.email}</Box>

          {/* <Box>
            IP Address:
            <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
              {customer.ipAddress}
            </Box>
          </Box> */}

          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{ mt: 1 }}
          >
            Agregar a la Blacklist
          </Button>
        </Stack>
      </Stack>
    </>
  );

  const renderDelivery = (
    <>
      <CardHeader title="Delivery" />
      <Stack spacing={1.5} sx={{ p: 3, typography: 'body2' }}>
        {/* Encargado del envío */}
        <Stack direction="row" alignItems="center">
          <Box component="span" sx={{ color: 'text.secondary', width: 120, flexShrink: 0 }}>
            Encargado del envio
          </Box>
          <Box>{delivery === 'pickup' ? 'Consumidor' : commerce.name}</Box>
        </Stack>

        {/* Tipo */}
        <Stack direction="row" alignItems="center">
          <Box component="span" sx={{ color: 'text.secondary', width: 120, flexShrink: 0 }}>
            Tipo
          </Box>
          <Box>{delivery === 'pickup' ? 'Retiro en local' : 'Entrega a domicilio'}</Box>
        </Stack>
      </Stack>
    </>
  );

  const renderShipping = (
    <>
      <CardHeader
        title="Entrega"
        /* action={
          <IconButton>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        } */
      />
      <Stack spacing={1.5} sx={{ p: 3, typography: 'body2' }}>
        <Stack direction="row">
          <Box component="span" sx={{ color: 'text.secondary', width: 120, flexShrink: 0 }}>
            Direccion
          </Box>
          {`${shippingAddress.street_name} ${shippingAddress.number} | ${shippingAddress.postal_code}`}
        </Stack>

        <Stack direction="row">
          <Box component="span" sx={{ color: 'text.secondary', width: 120, flexShrink: 0 }}>
            Numero de telefono
          </Box>
          {customer.phone_number}
        </Stack>
      </Stack>
    </>
  );

  let paymentText;
  let paymentIcon;
  let iconColor;

  if (payment === 'cash' || payment === 'efectivo') {
    paymentText = 'Efectivo';
    paymentIcon = 'mdi:cash';
    iconColor = 'green';
  } else if (payment === 'mercadopago') {
    paymentText = 'Mercado Pago';
    paymentIcon = 'simple-icons:mercadopago';
    iconColor = '#00BFFF';
  } else {
    paymentText = payment;
    paymentIcon = 'mdi:cash';
  }
  const renderPayment = (
    <>
      <CardHeader
        title="Pago"
        /* action={
          <IconButton>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        } */
      />
      <Stack direction="row" alignItems="center" sx={{ p: 3, typography: 'body2' }}>
        <Box component="span" sx={{ color: 'text.secondary', flexGrow: 1 }}>
          Medio de pago
        </Box>

        {paymentText}
        <Iconify
          icon={paymentIcon}
          width={24}
          sx={{
            ml: 0.5,
            color: iconColor, // Aplica el color en base al método de pago
          }}
        />
      </Stack>
    </>
  );

  return (
    <Card>
      {renderCustomer}

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderDelivery}

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderShipping}

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderPayment}
    </Card>
  );
}

OrderDetailsInfo.propTypes = {
  customer: PropTypes.object,
  delivery: PropTypes.object,
  commerce: PropTypes.object,
  payment: PropTypes.object,
  shippingAddress: PropTypes.object,
};
