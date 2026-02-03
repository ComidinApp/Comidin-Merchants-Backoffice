import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSWRConfig } from 'swr';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';

import { useGetOrder } from 'src/api/orders';
import { ORDER_STATUS_OPTIONS } from 'src/_mock';

import { useSettingsContext } from 'src/components/settings';

import OrderDetailsInfo from '../order-details-info';
import OrderDetailsItems from '../order-details-item';
import OrderDetailsToolbar from '../order-details-toolbar';
import OrderDetailsHistory from '../order-details-history';

// ----------------------------------------------------------------------

const { VITE_API_COMIDIN } = import.meta.env;

export default function OrderDetailsView({ id }) {
  const settings = useSettingsContext();
  const { mutate } = useSWRConfig();

  const { order, orderLoading } = useGetOrder(id);

  // OJO: este URL tiene que matchear EXACTO el que usa useGetOrder()
  const orderURL = useMemo(() => (id ? `${VITE_API_COMIDIN}/order/${id}` : ''), [id]);

  const [status, setStatus] = useState('');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
    }
  }, [order]);

  const handleChangeStatus = useCallback(
    async (newStatus) => {
      // 1) UI inmediata (actualiza label y estado actual)
      setStatus(newStatus);

      // 2) Refetch del pedido para traer order_history actualizado (sin F5)
      if (orderURL) {
        await mutate(orderURL);

        // Opcional: refresca también caches de listados (si volvés atrás y querés ver el status actualizado)
        await mutate(
          (key) =>
            typeof key === 'string' &&
            (key === `${VITE_API_COMIDIN}/order` ||
              key.startsWith(`${VITE_API_COMIDIN}/order/commerce/`))
        );
      }
    },
    [mutate, orderURL]
  );

  if (orderLoading) return <div>Loading...</div>;
  if (!order) return <div>No se encontró la orden.</div>;

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <OrderDetailsToolbar
        backLink={paths.dashboard.order.root}
        orderNumber={String(order.id)}
        createdAt={new Date(order.created_at)}
        status={status}
        onChangeStatus={handleChangeStatus}
        statusOptions={ORDER_STATUS_OPTIONS}
      />

      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Stack spacing={3} direction={{ xs: 'column-reverse', md: 'column' }}>
            <OrderDetailsItems items={order.order_details} totalAmount={Number(order.total_amount)} />

            <OrderDetailsHistory orderHistory={order.order_history} currentStatus={status} />
          </Stack>
        </Grid>

        <Grid xs={12} md={4}>
          <OrderDetailsInfo
            customer={order.user}
            delivery={order.delivery_type}
            commerce={order.commerce}
            payment={order.payment_method}
            shippingAddress={order.address}
          />
        </Grid>
      </Grid>
    </Container>
  );
}

OrderDetailsView.propTypes = {
  id: PropTypes.string,
};
