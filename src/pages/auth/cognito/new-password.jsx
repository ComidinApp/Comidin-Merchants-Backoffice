import { Helmet } from 'react-helmet-async';

import { CognitoNewPasswordView } from 'src/sections/auth/cognito';

// ----------------------------------------------------------------------

export default function NewPasswordPage() {
  return (
    <>
      <Helmet>
        <title> Cognito: New Password</title>
      </Helmet>

      <CognitoNewPasswordView />
    </>
  );
}
