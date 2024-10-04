import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CommerceDetailsView } from 'src/sections/commerce/view';

// ----------------------------------------------------------------------

export default function CommerceDetailsPage() {
  const params = useParams();

  const { id } = params;

  return (
    <>
      <Helmet>
        <title> Dashboard: Commerce Details</title>
      </Helmet>

      <CommerceDetailsView id={`${id}`} />
    </>
  );
}
