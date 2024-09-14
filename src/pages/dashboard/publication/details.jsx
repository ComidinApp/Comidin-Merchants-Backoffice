import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { PublicationDetailsView } from 'src/sections/publication/view';

// ----------------------------------------------------------------------

export default function PublicationDetailsPage() {
  const params = useParams();

  const { id } = params;

  return (
    <>
      <Helmet>
        <title> Dashboard: Publication Details</title>
      </Helmet>

      <PublicationDetailsView id={`${id}`} />
    </>
  );
}
