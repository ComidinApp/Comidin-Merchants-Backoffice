import { Helmet } from 'react-helmet-async';

import { PublicationListView } from 'src/sections/publication/view';

// ----------------------------------------------------------------------

export default function PublicationListPage() {
  return (
    <>
      <Helmet>
        <title> Comidin: Publicaciones</title>
      </Helmet>

      <PublicationListView />
    </>
  );
}
