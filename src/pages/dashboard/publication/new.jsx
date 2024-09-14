import { Helmet } from 'react-helmet-async';

import { PublicationCreateView } from 'src/sections/publication/view';

// ----------------------------------------------------------------------

export default function PublicationCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new publication</title>
      </Helmet>

      <PublicationCreateView />
    </>
  );
}
