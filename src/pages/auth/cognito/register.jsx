import { Helmet } from 'react-helmet-async';

import { CognitoRegisterView } from 'src/sections/auth/cognito';

// ----------------------------------------------------------------------

export default function RegisterPage() {
  return (
    <>
      <Helmet>
        <title> Cognito: Register</title>
      </Helmet>

      <CognitoRegisterView />
    </>
  );
}
