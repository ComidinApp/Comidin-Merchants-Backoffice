import { Helmet } from 'react-helmet-async';

import { UnauthorizedCommerce } from 'src/sections/error';

// ----------------------------------------------------------------------

export default function Page500() {
  return (
    <>
      <Helmet>
        <title> Comercio no Authorizado</title>
      </Helmet>

      <UnauthorizedCommerce />
    </>
  );
}
