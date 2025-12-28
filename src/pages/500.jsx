import { Helmet } from 'react-helmet-async';

import { View500 } from 'src/sections/error';

// ----------------------------------------------------------------------

export default function Page500() {
  return (
    <>
      <Helmet>
        <title> 500 Error del servidor</title>
      </Helmet>

      <View500 />
    </>
  );
}
