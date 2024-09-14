import { Helmet } from 'react-helmet-async';

import { PublicationListView } from 'src/sections/publication/view';

// ----------------------------------------------------------------------

export default function PublicationListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Publication List</title>
      </Helmet>

      <PublicationListView />
    </>
  );
}
