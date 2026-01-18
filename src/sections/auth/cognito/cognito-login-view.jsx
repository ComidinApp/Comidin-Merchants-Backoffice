// src/sections/auth/cognito/cognito-login-view.jsx
import * as Yup from 'yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Backdrop from '@mui/material/Backdrop';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';
import { PATH_AFTER_LOGIN } from 'src/config-global';

import Iconify from 'src/components/iconify';
import { SplashScreen } from 'src/components/loading-screen';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function CognitoLoginView() {
  const { login } = useAuthContext();
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const password = useBoolean();

  const LoginSchema = Yup.object().shape({
    email: Yup.string()
      .required('El correo electrónico es obligatorio')
      .email('Ingresá un correo electrónico válido'),
    password: Yup.string().required('La contraseña es obligatoria'),
  });

  const defaultValues = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const { handleSubmit } = methods;

  // 🔐 Mapeo de errores Cognito → mensajes controlados
  const mapCognitoError = (error) => {
    switch (error?.name) {
      case 'NotAuthorizedException':
      case 'UserNotFoundException':
        return 'El usuario o la contraseña son incorrectos.';

      case 'UserNotConfirmedException':
        return 'Tu cuenta aún no fue confirmada. Revisá tu correo electrónico.';

      case 'PasswordResetRequiredException':
        return 'Debés restablecer tu contraseña antes de iniciar sesión.';

      case 'TooManyRequestsException':
        return 'Demasiados intentos. Esperá unos minutos y volvé a intentar.';

      default:
        return 'Ocurrió un error al iniciar sesión. Intentá nuevamente.';
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMsg('');
      setLoading(true);

      const result = await login?.(data.email, data.password);

      if (result?.redirected) return;

      router.push(returnTo || PATH_AFTER_LOGIN);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setErrorMsg(mapCognitoError(error));
    }
  });

  const renderHead = (
    <Stack spacing={2} sx={{ mb: 5, color: 'common.greenDark' }}>
      <Typography variant="h4">Iniciá sesión en Comidin</Typography>
    </Stack>
  );

  const renderForm = (
    <Stack spacing={2.5}>
      <RHFTextField name="email" label="Correo electrónico" />

      <RHFTextField
        name="password"
        label="Contraseña"
        type={password.value ? 'text' : 'password'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Link
        component={RouterLink}
        href={paths.auth.cognito.forgotPassword}
        variant="body2"
        color="inherit"
        underline="always"
        sx={{ alignSelf: 'flex-end' }}
      >
        ¿Olvidaste tu contraseña?
      </Link>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={false}
      >
        Iniciar sesión
      </LoadingButton>
    </Stack>
  );

  return (
    <>
      {renderHead}

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <FormProvider methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </FormProvider>

      {loading && (
        <SplashScreen
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal + 999,
          }}
        />
      )}

      <Backdrop
        sx={(theme) => ({
          color: '#fff',
          zIndex: theme.zIndex.drawer + 1,
        })}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
