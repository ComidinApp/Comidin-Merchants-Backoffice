import { Helmet } from 'react-helmet-async';

import { CognitoRegisterView } from 'src/sections/auth/cognito';

// ----------------------------------------------------------------------

export default function RegisterPage() {
  return (
    <>
      <Helmet>
        <title> Registrá tu comercio</title>
      </Helmet>

      <CognitoRegisterView />
    </>
  );
}
