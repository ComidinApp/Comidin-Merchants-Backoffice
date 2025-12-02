import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { countries } from 'src/assets/data';
import { VITE_S3_ASSETS_AVATAR } from 'src/config-global';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFUploadAvatar,
  RHFAutocomplete,
} from 'src/components/hook-form';

// ----------------------------------------------------------------------
const { VITE_API_COMIDIN } = import.meta.env;

export default function UserNewEditForm({ currentUser }) {
  const router = useRouter();
  const authUser = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const assets_url = VITE_S3_ASSETS_AVATAR;

  const [roles, setRoles] = useState([]);
  const [commerces, setCommerces] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/role`);
        const data = await response.json();
        setRoles(data || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };

    const fetchCommerces = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/commerce`);
        const data = await response.json();
        setCommerces(data || []);
      } catch (error) {
        console.error('Error fetching commerces:', error);
      }
    };

    fetchRoles();
    fetchCommerces();
  }, []);

  // 🔥 VALIDACIONES ALINEADAS CON EL BACKEND (createUserValidation)
  const NewUserSchema = Yup.object().shape({
    first_name: Yup.string().required('Nombre es requerido'),
    last_name: Yup.string().required('Apellido es requerido'),

    email: Yup.string()
      .required('Email es requerido')
      .email('Email debe ser una dirección válida.'),

    phone_number: Yup.string()
      .required('Número de teléfono es requerido')
      .matches(
        /^[0-9+\-\s()]{6,20}$/,
        'Número de teléfono no es válido'
      ),

    national_id: Yup.string().required('DNI es requerido'),

    address: Yup.string().required('Dirección es requerida'),
    country: Yup.string().required('País es requerido'),

    commerce_id: Yup.number()
      .typeError('Comercio es requerido')
      .required('Comercio es requerido'),

    city: Yup.string().required('Ciudad es requerida'),

    role_id: Yup.number()
      .typeError('Rol es requerido')
      .required('Rol es requerido'),

    postal_code: Yup.string().required('Código postal es requerido'),

    ...(currentUser
      ? {}
      : {
          password: Yup.string()
            .required('Contraseña es requerida')
            .min(8, 'La contraseña debe tener al menos 8 caracteres')
            .matches(/\d/, 'La contraseña debe contener al menos un número')
            .matches(
              /[!@#$%^&*(),.?":{}|<>]/,
              'La contraseña debe contener al menos un carácter especial'
            ),
        }),

    avatar_url: Yup.mixed().nullable(),
    status: Yup.string(),
  });

  const getRandomAvatarImage = useCallback(() => {
    const avatarImages = [
      `${assets_url}fries.png`,
      `${assets_url}burguer.png`,
      `${assets_url}icecream.png`,
      `${assets_url}coffe.png`,
      `${assets_url}donut.png`,
      `${assets_url}hotdog.png`,
      `${assets_url}pie.png`,
      `${assets_url}tea.png`,
      `${assets_url}pasta.png`,
      `${assets_url}pancake.png`,
      `${assets_url}milk.png`,
      `${assets_url}taco.png`,
      `${assets_url}sandwich.png`,
      `${assets_url}pizza.png`,
      `${assets_url}bread.png`,
    ];
    const randomIndex = Math.floor(Math.random() * avatarImages.length);
    return avatarImages[randomIndex];
  }, [assets_url]);

  const defaultValues = useMemo(
    () => ({
      first_name: currentUser?.first_name || '',
      last_name: currentUser?.last_name || '',
      city: currentUser?.city || '',
      role_id: currentUser?.role_id || '',
      email: currentUser?.email || '',
      national_id: currentUser?.national_id || '',
      status: currentUser?.status || 'active',
      address: currentUser?.address || '',
      country: currentUser?.country || '',
      postal_code: currentUser?.postal_code || '',
      commerce_id: currentUser?.commerce_id || '',
      avatar_url: currentUser?.avatar_url || getRandomAvatarImage(),
      phone_number: currentUser?.phone_number || '',
    }),
    [currentUser, getRandomAvatarImage]
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const url = currentUser
        ? `${VITE_API_COMIDIN}/employee/${currentUser.id}`
        : `${VITE_API_COMIDIN}/employee`;

      const method = currentUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      let responseData = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        const msg =
          responseData?.error ||
          responseData?.message ||
          'Error al enviar los datos. Por favor, verificá la información.';
        throw new Error(msg);
      }

      reset();
      enqueueSnackbar(currentUser ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito', {
        variant: 'success',
      });
      router.push(paths.dashboard.user.list);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(error.message || 'Ocurrió un error al guardar el usuario.', {
        variant: 'error',
      });
    }
  });

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles?.[0];
      if (!file) return;

      const maxSizeMB = 3;
      if (file.size > maxSizeMB * 1024 * 1024) {
        enqueueSnackbar(`La imagen supera ${maxSizeMB}MB. Elegí otra más liviana.`, {
          variant: 'error',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        setValue('avatar_url', base64, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    },
    [enqueueSnackbar, setValue]
  );

  useEffect(() => {
    if (authUser.user.role_id !== 1 && authUser.user.commerce?.id) {
      setValue('commerce_id', authUser.user.commerce.id);
    }
  }, [authUser.user.role_id, authUser.user.commerce, setValue]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            <Box sx={{ mb: 5 }}>
              <RHFUploadAvatar
                name="avatar_url"
                maxSize={3145728}
                onDrop={handleDrop}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Podés subir una imagen JPG, PNG o GIF (máx. 3 MB).
                    <br />
                    Si no elegís ninguna, se usará un avatar por defecto.
                  </Typography>
                }
              />
            </Box>
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="first_name" label="Nombre" />
              <RHFTextField name="last_name" label="Apellido" />
              <RHFTextField name="email" label="Email" />
              <RHFTextField name="phone_number" label="Número de teléfono" />

              <RHFAutocomplete
                name="country"
                type="country"
                label="País"
                placeholder="Elegí un país"
                fullWidth
                options={countries.map((option) => option.label)}
                getOptionLabel={(option) => option}
              />

              <RHFTextField name="national_id" label="DNI" />
              <RHFTextField name="city" label="Ciudad" />
              <RHFTextField name="address" label="Dirección" />
              <RHFTextField name="postal_code" label="Código postal" />

              {authUser.user.role_id === 1 ? (
                <RHFAutocomplete
                  name="commerce_id"
                  label="Comercio"
                  fullWidth
                  options={commerces}
                  getOptionLabel={(option) => option.name}
                  onChange={(_, value) => setValue('commerce_id', value?.id || '')}
                  value={
                    commerces.find((commerce) => commerce.id === watch('commerce_id')) ||
                    commerces.find((commerce) => commerce.id === currentUser?.commerce_id) ||
                    null
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === (value?.id || value)
                  }
                />
              ) : null}

              <RHFAutocomplete
                name="role_id"
                label="Rol"
                fullWidth
                options={roles}
                getOptionLabel={(option) => option.name}
                onChange={(_, value) => setValue('role_id', value?.id || '')}
                value={
                  roles.find((role) => role.id === watch('role_id')) ||
                  roles.find((role) => role.id === currentUser?.role_id) ||
                  null
                }
                isOptionEqualToValue={(option, value) =>
                  option.id === (value?.id || value)
                }
              />

              {!currentUser && (
                <RHFTextField
                  name="password"
                  label="Contraseña"
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? 'Crear usuario' : 'Guardar cambios'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

UserNewEditForm.propTypes = {
  currentUser: PropTypes.object,
};
