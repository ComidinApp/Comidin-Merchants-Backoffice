import { Helmet } from 'react-helmet-async';

import { OrderListView } from 'src/sections/order/view';

// ----------------------------------------------------------------------

export default function OrderListPage() {
  return (
    <>
      <Helmet>
        <title> Comidin: Pedidos</title>
      </Helmet>

      <OrderListView />
    </>
  );
}
