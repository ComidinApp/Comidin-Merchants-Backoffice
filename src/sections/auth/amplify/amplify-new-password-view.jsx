import * as Yup from 'yup';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

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

export default function AmplifyNewPasswordView() {
  const { newPassword, forgotPassword } = useAuthContext();

  const router = useRouter();

  const searchParams = useSearchParams();

  const email = searchParams.get('email');

  const password = useBoolean();

  const { countdown, counting, startCountdown } = useCountdownSeconds(60);

  const VerifySchema = Yup.object().shape({
    code: Yup.string()
      .min(6, 'El código debe tener al menos 6 caracteres')
      .required('El código es obligatorio'),
    email: Yup.string()
      .required('El correo electrónico es obligatorio')
      .email('Ingresá un correo electrónico válido'),
    password: Yup.string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .required('La contraseña es obligatoria'),
    confirmPassword: Yup.string()
      .required('La confirmación de contraseña es obligatoria')
      .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden'),
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

  const onSubmit = handleSubmit(async (data) => {
    try {
      await newPassword?.(data.email, data.code, data.password);

      router.push(paths.auth.amplify.login);
    } catch (error) {
      console.error(error);
    }
  });

  const handleResendCode = useCallback(async () => {
    try {
      startCountdown();
      await forgotPassword?.(values.email);
    } catch (error) {
      console.error(error);
    }
  }, [forgotPassword, startCountdown, values.email]);

  const renderForm = (
    <Stack spacing={3} alignItems="center">
      <RHFTextField
        name="email"
        label="Correo electrónico"
        placeholder="ejemplo@gmail.com"
        InputLabelProps={{ shrink: true }}
      />

      <RHFCode name="code" />

      <RHFTextField
        name="password"
        label="Nueva contraseña"
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
        label="Confirmar nueva contraseña"
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
        Actualizar contraseña
      </LoadingButton>

      <Typography variant="body2">
        {'¿No tenés un código? '}
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
          Reenviar código {counting && `(${countdown}s)`}
        </Link>
      </Typography>

      <Link
        component={RouterLink}
        href={paths.auth.amplify.login}
        color="inherit"
        variant="subtitle2"
        sx={{
          alignItems: 'center',
          display: 'inline-flex',
        }}
      >
        <Iconify icon="eva:arrow-ios-back-fill" width={16} />
        Volver a iniciar sesión
      </Link>
    </Stack>
  );

  const renderHead = (
    <>
      <SentIcon sx={{ height: 96 }} />

      <Stack spacing={1} sx={{ mt: 3, mb: 5 }}>
        <Typography variant="h3">¡Solicitud enviada con éxito!</Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Te enviamos un correo de confirmación con un código de 6 dígitos.
          <br />
          Ingresá el código en el cuadro de abajo para verificar tu correo electrónico.
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
