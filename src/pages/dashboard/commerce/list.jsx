import { Helmet } from 'react-helmet-async';

import { CommerceListView } from 'src/sections/commerce/view';

// ----------------------------------------------------------------------

export default function CommerceListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Commerce List</title>
      </Helmet>

      <CommerceListView />
    </>
  );
}
