import * as Yup from 'yup';
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

import { useBoolean } from 'src/hooks/use-boolean';

import { SentIcon } from 'src/assets/icons';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFCode, RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function ModernNewPasswordView() {
  const password = useBoolean();

  const NewPasswordSchema = Yup.object().shape({
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
    email: '',
    password: '',
    confirmPassword: '',
  };

  const methods = useForm({
    mode: 'onChange',
    resolver: yupResolver(NewPasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.info('DATOS', data);
    } catch (error) {
      console.error(error);
    }
  });

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
          sx={{
            cursor: 'pointer',
          }}
        >
          Reenviar código
        </Link>
      </Typography>

      <Link
        component={RouterLink}
        href={paths.authDemo.modern.login}
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
    <FormProvider methods={methods} onSubmit={onSubmit}>
      {renderHead}

      {renderForm}
    </FormProvider>
  );
}
