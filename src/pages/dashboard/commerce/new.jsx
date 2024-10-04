import { Helmet } from 'react-helmet-async';

import { CommerceCreateView } from 'src/sections/commerce/view';

// ----------------------------------------------------------------------

export default function CommerceCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new commerce</title>
      </Helmet>

      <CommerceCreateView />
    </>
  );
}
