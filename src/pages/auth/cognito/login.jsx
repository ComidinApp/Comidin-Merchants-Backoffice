import { Helmet } from 'react-helmet-async';

import { CognitoLoginView } from 'src/sections/auth/cognito';

// ----------------------------------------------------------------------

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title> Login: Cognito Login</title>
      </Helmet>

      <CognitoLoginView />
    </>
  );
}
