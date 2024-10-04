import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CommerceEditView } from 'src/sections/commerce/view';

// ----------------------------------------------------------------------

export default function CommerceEditPage() {
  const params = useParams();

  const { id } = params;

  return (
    <>
      <Helmet>
        <title> Dashboard: Commerce Edit</title>
      </Helmet>

      <CommerceEditView id={`${id}`} />
    </>
  );
}
