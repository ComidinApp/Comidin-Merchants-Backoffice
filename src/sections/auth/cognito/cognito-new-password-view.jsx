import * as Yup from 'yup';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useCountdownSeconds } from 'src/hooks/use-countdown';

import { SentIcon } from 'src/assets/icons';
import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFCode, RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function CognitoNewPasswordView() {
  // Seguimos usando confirmPassword de Cognito SOLO para confirmar la nueva contraseña
  const { confirmPassword } = useAuthContext();

  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email');

  const password = useBoolean();
  const { countdown, counting, startCountdown } = useCountdownSeconds(60);

  const API_COMIDIN = import.meta.env.VITE_API_COMIDIN;

  const VerifySchema = Yup.object().shape({
    code: Yup.string().min(6, 'Code must be at least 6 characters').required('Code is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .required('Confirm password is required')
      .oneOf([Yup.ref('password')], 'Passwords must match'),
  });

  const defaultValues = {
    code: '',
    email: email || '',
    password: '',
    confirmPassword: '',
  };

  const methods = useForm({
    mode: 'onChange',
    resolver: yupResolver(VerifySchema),
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  // Enviar nueva contraseña a Cognito (función ya existente)
  const onSubmit = handleSubmit(async (data) => {
    try {
      await confirmPassword?.(data.email, data.code, data.password);
      router.push(paths.auth.cognito.login);
    } catch (error) {
      console.error(error);
    }
  });

  // 🚀 AHORA usamos TU backend para reenviar el código
  const handleResendCode = useCallback(async () => {
    try {
      startCountdown();

      await axios.post(`${API_COMIDIN}/employee/send-verification-code`, {
        email: values.email,
      });

      console.log('Código reenviado correctamente');
    } catch (error) {
      console.error('Error reenviando código:', error);
    }
  }, [startCountdown, values.email, API_COMIDIN]);

  const renderForm = (
    <Stack spacing={3} alignItems="center">
      <RHFTextField
        name="email"
        label="Email"
        placeholder="example@gmail.com"
        InputLabelProps={{ shrink: true }}
      />

      <RHFCode name="code" />

      <RHFTextField
        name="password"
        label="Password"
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

      <RHFTextField
        name="confirmPassword"
        label="Confirm New Password"
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

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
      >
        Update Password
      </LoadingButton>

      <Typography variant="body2">
        {`Don’t have a code? `}
        <Link
          variant="subtitle2"
          onClick={handleResendCode}
          sx={{
            cursor: 'pointer',
            ...(counting && {
              color: 'text.disabled',
              pointerEvents: 'none',
            }),
          }}
        >
          Resend code {counting && `(${countdown}s)`}
        </Link>
      </Typography>

      <Link
        component={RouterLink}
        href={paths.auth.cognito.login}
        color="inherit"
        variant="subtitle2"
        sx={{
          alignItems: 'center',
          display: 'inline-flex',
        }}
      >
        <Iconify icon="eva:arrow-ios-back-fill" width={16} />
        Return to sign in
      </Link>
    </Stack>
  );

  const renderHead = (
    <>
      <SentIcon sx={{ height: 96 }} />

      <Stack spacing={1} sx={{ mt: 3, mb: 5 }}>
        <Typography variant="h3">Request sent successfully!</Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          We&apos;ve sent a 6-digit confirmation email to your email.
          <br />
          Please enter the code in below box to verify your email.
        </Typography>
      </Stack>
    </>
  );

  return (
    <>
      {renderHead}

      <FormProvider methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </FormProvider>
    </>
  );
}
