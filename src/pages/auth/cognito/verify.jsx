import { Helmet } from 'react-helmet-async';

import { CognitoVerifyView } from 'src/sections/auth/cognito';

// ----------------------------------------------------------------------

export default function VerifyPage() {
  return (
    <>
      <Helmet>
        <title> Cognito: Verify</title>
      </Helmet>

      <CognitoVerifyView />
    </>
  );
}
