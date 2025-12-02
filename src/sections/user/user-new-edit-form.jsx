import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

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

const { VITE_API_COMIDIN } = import.meta.env;

export default function UserNewEditForm({ currentUser }) {
  const router = useRouter();
  const authUser = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const assets_url = VITE_S3_ASSETS_AVATAR;

  const [roles, setRoles] = useState([]);
  const [commerces, setCommerces] = useState([]);

  // Solo usamos setDuplicateFlags (no duplicateFlags)
  const [, setDuplicateFlags] = useState({
    emailExists: false,
    phoneExists: false,
    nationalIdExists: false,
  });

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

  const NewUserSchema = Yup.object().shape({
    first_name: Yup.string().required('Nombre es requerido'),
    last_name: Yup.string().required('Apellido es requerido'),

    email: Yup.string()
      .required('Email es requerido')
      .email('Email debe ser una dirección válida.'),

    phone_number: Yup.string()
      .required('Número de teléfono es requerido')
      .matches(/^[0-9+\-\s()]{6,20}$/, 'Número de teléfono no es válido'),

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
    setValue,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting },
  } = methods;

  const watchedEmail = watch('email');
  const watchedPhone = watch('phone_number');
  const watchedNationalId = watch('national_id');

  // --- 🔥 VALIDACIÓN EN TIEMPO REAL SIN RETURN VACÍO ---
  useEffect(() => {
    if (currentUser) return;

    const email = watchedEmail?.trim();
    const phone = watchedPhone?.trim();
    const dni = watchedNationalId?.trim();

    // Si no hay nada cargado limpiamos errores
    if (!email && !phone && !dni) {
      setDuplicateFlags({
        emailExists: false,
        phoneExists: false,
        nationalIdExists: false,
      });
      clearErrors(['email', 'phone_number', 'national_id']);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (email) params.append('email', email);
        if (phone) params.append('phone_number', phone);
        if (dni) params.append('national_id', dni);

        const res = await fetch(
          `${VITE_API_COMIDIN}/employee/exists?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!res.ok) return;

        const data = await res.json();
        const {
          emailExists = false,
          phoneExists = false,
          nationalIdExists = false,
        } = data;

        setDuplicateFlags({ emailExists, phoneExists, nationalIdExists });

        if (emailExists) {
          setError('email', {
            type: 'manual',
            message: 'Ya existe un empleado con este email.',
          });
        } else clearErrors('email');

        if (phoneExists) {
          setError('phone_number', {
            type: 'manual',
            message: 'Ya existe un empleado con este número.',
          });
        } else clearErrors('phone_number');

        if (nationalIdExists) {
          setError('national_id', {
            type: 'manual',
            message: 'Ya existe un empleado con este DNI.',
          });
        } else clearErrors('national_id');
      } catch (_) {}
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    currentUser,
    watchedEmail,
    watchedPhone,
    watchedNationalId,
    clearErrors,
    setError,
  ]);

  // --- Validación final antes de submit ---
  const validateUniqueBeforeSubmit = async (data) => {
    const params = new URLSearchParams();
    if (data.email) params.append('email', data.email.trim());
    if (data.phone_number) params.append('phone_number', data.phone_number.trim());
    if (data.national_id) params.append('national_id', data.national_id.trim());
    if (currentUser?.id) params.append('excludeId', currentUser.id);

    const res = await fetch(
      `${VITE_API_COMIDIN}/employee/exists?${params.toString()}`
    );

    if (!res.ok) return false;

    const { emailExists, phoneExists, nationalIdExists } = await res.json();

    let hasDuplicates = false;

    if (emailExists) {
      hasDuplicates = true;
      setError('email', { type: 'manual', message: 'Ya existe un empleado con este email.' });
    }

    if (phoneExists) {
      hasDuplicates = true;
      setError('phone_number', { type: 'manual', message: 'Ya existe un empleado con este número.' });
    }

    if (nationalIdExists) {
      hasDuplicates = true;
      setError('national_id', { type: 'manual', message: 'Ya existe un empleado con este DNI.' });
    }

    if (hasDuplicates) {
      enqueueSnackbar(
        'Ya existe un empleado con alguno de los datos ingresados (email, teléfono, DNI).',
        { variant: 'error' }
      );
    }

    return hasDuplicates;
  };

  const onSubmit = handleSubmit(async (data) => {
    const hasDuplicates = await validateUniqueBeforeSubmit(data);
    if (hasDuplicates) return;

    try {
      const url = currentUser
        ? `${VITE_API_COMIDIN}/employee/${currentUser.id}`
        : `${VITE_API_COMIDIN}/employee`;

      const method = currentUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || json?.message || 'Error al guardar el usuario.');
      }

      reset();
      enqueueSnackbar(
        currentUser ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito',
        { variant: 'success' }
      );

      router.push(paths.dashboard.user.list);
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  });

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles?.[0];
      if (!file) return;

      const maxSizeMB = 3;
      if (file.size > maxSizeMB * 1024 * 1024) {
        enqueueSnackbar(`La imagen supera ${maxSizeMB}MB.`, { variant: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setValue('avatar_url', reader.result, { shouldValidate: true });
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
                  <Typography variant="caption" sx={{ mt: 3, textAlign: 'center', color: 'text.disabled' }}>
                    Podés subir JPG, PNG o GIF (máx. 3MB).
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
              gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
            >
              <RHFTextField name="first_name" label="Nombre" />
              <RHFTextField name="last_name" label="Apellido" />
              <RHFTextField name="email" label="Email" />
              <RHFTextField name="phone_number" label="Número de teléfono" />

              <RHFAutocomplete
                name="country"
                type="country"
                label="País"
                options={countries.map((o) => o.label)}
                getOptionLabel={(option) => option}
              />

              <RHFTextField name="national_id" label="DNI" />
              <RHFTextField name="city" label="Ciudad" />
              <RHFTextField name="address" label="Dirección" />
              <RHFTextField name="postal_code" label="Código postal" />

              {authUser.user.role_id === 1 && (
                <RHFAutocomplete
                  name="commerce_id"
                  label="Comercio"
                  options={commerces}
                  getOptionLabel={(o) => o.name}
                  onChange={(_, v) => setValue('commerce_id', v?.id || '')}
                  value={commerces.find((c) => c.id === watch('commerce_id')) || null}
                  isOptionEqualToValue={(o, v) => o.id === (v?.id || v)}
                />
              )}

              <RHFAutocomplete
                name="role_id"
                label="Rol"
                options={roles}
                getOptionLabel={(o) => o.name}
                onChange={(_, v) => setValue('role_id', v?.id || '')}
                value={roles.find((r) => r.id === watch('role_id')) || null}
                isOptionEqualToValue={(o, v) => o.id === (v?.id || v)}
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
                {currentUser ? 'Guardar cambios' : 'Crear usuario'}
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
