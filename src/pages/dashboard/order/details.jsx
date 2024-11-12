import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { OrderDetailsView } from 'src/sections/order/view';

// ----------------------------------------------------------------------

export default function OrderDetailsPage() {
  const params = useParams();

  const { id } = params;

  return (
    <>
      <Helmet>
        <title> Comidin: Detalle pedido</title>
      </Helmet>

      <OrderDetailsView id={`${id}`} />
    </>
  );
}
