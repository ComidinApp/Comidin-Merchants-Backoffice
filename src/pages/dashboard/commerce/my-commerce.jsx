import { Helmet } from 'react-helmet-async';

import { MyCommerceView } from 'src/sections/commerce/view';

// ----------------------------------------------------------------------

export default function MyCommercePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Mi Comercio</title>
      </Helmet>

      <MyCommerceView />
    </>
  );
}

