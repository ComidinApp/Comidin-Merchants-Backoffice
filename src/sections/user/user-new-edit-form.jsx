// src/sections/user/user-new-edit-form.jsx
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { countries } from 'src/assets/data';
import { VITE_S3_ASSETS_AVATAR } from 'src/config-global';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFAutocomplete,
} from 'src/components/hook-form';

const { VITE_API_COMIDIN } = import.meta.env;

// ----------------------------------------------------------------------
// Reglas de validación

const phoneRegExp = /^(\+?\d{1,3})?[\s.-]?\d{6,14}$/; // flexible
const dniRegExp = /^\d{7,9}$/; // 7–9 dígitos

// 8+ caracteres, al menos una letra y un número
const passwordRegexp =
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&_ -]{8,}$/;

// ----------------------------------------------------------------------

export default function UserNewEditForm({ currentUser }) {
  const router = useRouter();
  const auth = useAuthContext();
  const user = auth?.user;

  const { enqueueSnackbar } = useSnackbar();

  const assets_url = VITE_S3_ASSETS_AVATAR;

  const [roles, setRoles] = useState([]);
  const [commerces, setCommerces] = useState([]);

  // input file ref para abrir el explorador nativo
  const fileInputRef = useRef(null);

  // --- Carga de roles ---
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/api/role`);
        const data = await response.json();
        setRoles(data || []);
      } catch (error) {
        console.error('Error al obtener roles:', error);
      }
    };
    fetchRoles();
  }, []);

  // --- Carga de comercios ---
  useEffect(() => {
    const fetchCommerces = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/api/commerce`);
        const data = await response.json();
        setCommerces(data || []);
      } catch (error) {
        console.error('Error al obtener comercios:', error);
      }
    };
    fetchCommerces();
  }, []);

  // --- Yup schema robusto ---
  const NewUserSchema = Yup.object().shape({
    first_name: Yup.string()
      .trim()
      .required('El nombre es obligatorio')
      .max(80, 'El nombre no puede superar los 80 caracteres'),

    last_name: Yup.string()
      .trim()
      .required('El apellido es obligatorio')
      .max(80, 'El apellido no puede superar los 80 caracteres'),

    email: Yup.string()
      .trim()
      .required('El email es obligatorio')
      .email('El email debe ser una dirección válida'),

    phone_number: Yup.string()
      .trim()
      .required('El número de teléfono es obligatorio')
      .matches(phoneRegExp, 'El número de teléfono no tiene un formato válido'),

    address: Yup.string()
      .trim()
      .required('La dirección es obligatoria')
      .max(160, 'La dirección es demasiado larga'),

    country: Yup.string()
      .trim()
      .required('El país es obligatorio'),

    commerce_id: Yup.number()
      .typeError('Debés seleccionar un comercio')
      .integer('Comercio inválido')
      .positive('Comercio inválido')
      .required('El comercio es obligatorio'),

    national_id: Yup.string()
      .trim()
      .required('El DNI es obligatorio')
      .matches(dniRegExp, 'El DNI debe tener solo números (7 a 9 dígitos)'),

    city: Yup.string()
      .trim()
      .required('La ciudad es obligatoria')
      .max(80, 'La ciudad es demasiado larga'),

    role_id: Yup.number()
      .typeError('Debés seleccionar un rol')
      .integer('Rol inválido')
      .positive('Rol inválido')
      .required('El rol es obligatorio'),

    postal_code: Yup.string()
      .trim()
      .required('El código postal es obligatorio')
      .max(20, 'El código postal es demasiado largo'),

    ...(currentUser
      ? {}
      : {
          password: Yup.string()
            .required('La contraseña es obligatoria')
            .matches(
              passwordRegexp,
              'La contraseña debe tener al menos 8 caracteres, incluyendo letras y números'
            ),
        }),

    // Avatar OPCIONAL: no lo marcamos como requerido
    avatar_url: Yup.mixed().nullable(),

    status: Yup.string().oneOf(['active', 'pending', 'banned']).optional(),
  });

  // --- Avatar por defecto (random) si es nuevo usuario ---
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
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const avatarValue = watch('avatar_url');
  const [avatarPreview, setAvatarPreview] = useState(avatarValue);

  useEffect(() => {
    setAvatarPreview(avatarValue);
  }, [avatarValue]);

  // --- submit ---
  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const url = currentUser
        ? `${VITE_API_COMIDIN}/api/employee/${currentUser.id}`
        : `${VITE_API_COMIDIN}/api/employee`;

      const method = currentUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error('Respuesta de error del backend:', errText);
        throw new Error('Error al enviar los datos al servidor');
      }

      const responseData = await response.json();
      console.log('Respuesta del servidor (user-new-edit):', responseData);

      reset();
      enqueueSnackbar(
        currentUser ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito',
        { variant: 'success' }
      );
      router.push(paths.dashboard.user.list);
      console.info('DATA', data);
    } catch (error) {
      console.error('Error en el submit de usuario:', error);
      enqueueSnackbar('Ocurrió un error al guardar el usuario', { variant: 'error' });
    }
  });

  // --- cambio de archivo: base64 + preview ---
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // guardamos en base64 para el backend
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result; // data:image/...;base64,...
      setValue('avatar_url', base64, { shouldValidate: true });
      setAvatarPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  // abrir explorador de archivos al clickear la tarjeta
  const handleClickCard = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // si el usuario logueado no es admin global, fijar comercio por defecto
  useEffect(() => {
    if (user?.role_id !== 1 && user?.commerce?.id) {
      setValue('commerce_id', user.commerce.id);
    }
  }, [user?.role_id, user?.commerce?.id, setValue]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Input de archivo oculto */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <Grid xs={12} md={4}>
          <Card
            sx={{
              pt: 10,
              pb: 5,
              px: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={handleClickCard}
          >
            <Box
              sx={{
                mb: 3,
                width: 140,
                height: 140,
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: (theme) => `2px dashed ${theme.palette.divider}`,
              }}
            >
              <Box
                component="img"
                alt="Avatar"
                src={avatarPreview}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{
                mt: 1,
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

              {user?.role_id === 1 && (
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
                  isOptionEqualToValue={(option, value) => option.id === (value?.id || value)}
                />
              )}

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
                isOptionEqualToValue={(option, value) => option.id === (value?.id || value)}
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
