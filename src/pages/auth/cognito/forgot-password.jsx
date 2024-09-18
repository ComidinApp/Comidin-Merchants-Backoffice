import { Helmet } from 'react-helmet-async';

import { CognitoForgotPasswordView } from 'src/sections/auth/cognito';

// ----------------------------------------------------------------------

export default function ForgotPasswordPage() {
  return (
    <>
      <Helmet>
        <title> Cognito: Forgot Passwor</title>
      </Helmet>

      <CognitoForgotPasswordView />
    </>
  );
}
