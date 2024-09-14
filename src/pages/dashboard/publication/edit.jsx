import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { PublicationEditView } from 'src/sections/publication/view';

// ----------------------------------------------------------------------

export default function PublicationEditPage() {
  const params = useParams();

  const { id } = params;

  return (
    <>
      <Helmet>
        <title> Dashboard: Publication Edit</title>
      </Helmet>

      <PublicationEditView id={`${id}`} />
    </>
  );
}
