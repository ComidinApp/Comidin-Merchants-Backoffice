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

// ✅ Reutilizamos el fetch de beneficios (mismo endpoint: /subscriptions/commerce/:id/benefits)
import { fetchBenefitsByCommerceId } from 'src/api/publicationLimits';

const { VITE_API_COMIDIN } = import.meta.env;

export default function UserNewEditForm({ currentUser }) {
  const router = useRouter();
  const authUser = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const assets_url = VITE_S3_ASSETS_AVATAR;

  const [roles, setRoles] = useState([]);
  const [commerces, setCommerces] = useState([]);

  // Solo usamos setDuplicateFlags (no necesitamos leer el estado)
  const [, setDuplicateFlags] = useState({
    emailExists: false,
    phoneExists: false,
    nationalIdExists: false,
  });

  // ✅ bloqueo por plan (manage_employees_roles)
  const [permissionState, setPermissionState] = useState({
    checking: false,
    locked: false,
    message: '',
  });

  const isEdit = Boolean(currentUser?.id);

  // Resolver commerceId de forma tolerante (admin o no admin)
  const authCommerceId =
    authUser?.user?.commerce?.id ??
    authUser?.user?.commerce_id ??
    authUser?.user?.commerceId ??
    null;

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
  const watchedCommerceId = watch('commerce_id');

  // ✅ Si no es admin y tiene commerce asociado, lo pre-cargamos (y esto dispara validación de plan)
  useEffect(() => {
    if (authCommerceId && !watchedCommerceId) {
      setValue('commerce_id', Number(authCommerceId), { shouldValidate: true });
    }
  }, [authCommerceId, watchedCommerceId, setValue]);

  // ✅ Validación de permiso por plan:
  // - Aplica SOLO para CREAR (no para editar)
  // - Se recalcula cuando cambia commerce_id (admin puede seleccionar otro comercio)
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (isEdit) {
        // Editar usuario existente: no aplicamos bloqueo por plan (solo pediste “para crear”)
        setPermissionState({ checking: false, locked: false, message: '' });
        return;
      }

      const cid = Number(watchedCommerceId || authCommerceId || 0);

      // Si aún no hay commerce seleccionado (admin), bloqueamos suave
      if (!cid) {
        setPermissionState({
          checking: false,
          locked: true,
          message: 'Seleccioná un comercio para validar permisos de tu suscripción.',
        });
        return;
      }

      setPermissionState({ checking: true, locked: false, message: '' });

      try {
        const benefits = await fetchBenefitsByCommerceId(cid);

        if (!alive) return;

        const allowed = benefits?.manage_employees_roles !== false;

        if (!allowed) {
          setPermissionState({
            checking: false,
            locked: true,
            message: 'El plan actual no permite la creación de nuevos usuarios.',
          });
        } else {
          setPermissionState({ checking: false, locked: false, message: '' });
        }
      } catch (e) {
        if (!alive) return;
        // Si falla la consulta, no bloqueamos (pero avisamos si querés; acá lo dejamos permisivo)
        setPermissionState({ checking: false, locked: false, message: '' });
        console.warn('[UserNewEditForm] No se pudo validar manage_employees_roles:', e);
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [isEdit, watchedCommerceId, authCommerceId]);

  const formLocked = permissionState.locked || permissionState.checking;

  // ✅ Handlers sin inline arrows (evita lints tipo jsx-no-bind)
  const handleCommerceChange = useCallback(
    (_event, value) => {
      setValue('commerce_id', value?.id || '', { shouldValidate: true });
    },
    [setValue]
  );

  const handleRoleChange = useCallback(
    (_event, value) => {
      setValue('role_id', value?.id || '', { shouldValidate: true });
    },
    [setValue]
  );

  // 🔥 VALIDACIÓN EN TIEMPO REAL CONTRA /employee/exists
  useEffect(() => {
    if (currentUser) return () => {};

    const email = watchedEmail?.trim();
    const phone = watchedPhone?.trim();
    const dni = watchedNationalId?.trim();

    if (!email && !phone && !dni) {
      setDuplicateFlags({
        emailExists: false,
        phoneExists: false,
        nationalIdExists: false,
      });
      clearErrors(['email', 'phone_number', 'national_id']);
      return () => {};
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

        if (!res.ok) {
          console.error('Error checking employee exists (real time)');
          return;
        }

        const data = await res.json();
        const {
          emailExists = false,
          phoneExists = false,
          nationalIdExists = false,
        } = data || {};

        setDuplicateFlags({ emailExists, phoneExists, nationalIdExists });

        if (emailExists) {
          setError('email', { type: 'manual', message: 'Ya existe un empleado con este email.' });
        } else {
          clearErrors('email');
        }

        if (phoneExists) {
          setError('phone_number', {
            type: 'manual',
            message: 'Ya existe un empleado con este número de teléfono.',
          });
        } else {
          clearErrors('phone_number');
        }

        if (nationalIdExists) {
          setError('national_id', { type: 'manual', message: 'Ya existe un empleado con este DNI.' });
        } else {
          clearErrors('national_id');
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error checking employee exists (real time):', error);
        }
      }
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

  // Validación final antes de submit
  const validateUniqueBeforeSubmit = async (data) => {
    const email = data.email?.trim();
    const phone = data.phone_number?.trim();
    const dni = data.national_id?.trim();

    if (!email && !phone && !dni) return false;

    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (phone) params.append('phone_number', phone);
    if (dni) params.append('national_id', dni);
    if (currentUser?.id) params.append('excludeId', currentUser.id);

    const res = await fetch(`${VITE_API_COMIDIN}/employee/exists?${params.toString()}`);

    if (!res.ok) {
      console.error('Error checking employee exists (on submit)');
      return false;
    }

    const {
      emailExists = false,
      phoneExists = false,
      nationalIdExists = false,
    } = await res.json();

    setDuplicateFlags({ emailExists, phoneExists, nationalIdExists });

    let hasDuplicates = false;

    if (emailExists) {
      hasDuplicates = true;
      setError('email', { type: 'manual', message: 'Ya existe un empleado con este email.' });
    }

    if (phoneExists) {
      hasDuplicates = true;
      setError('phone_number', {
        type: 'manual',
        message: 'Ya existe un empleado con este número de teléfono.',
      });
    }

    if (nationalIdExists) {
      hasDuplicates = true;
      setError('national_id', { type: 'manual', message: 'Ya existe un empleado con este DNI.' });
    }

    if (hasDuplicates) {
      enqueueSnackbar(
        'Ya existe un empleado con alguno de los datos ingresados (email, teléfono o DNI). Corregí los campos marcados.',
        { variant: 'error' }
      );
    }

    return hasDuplicates;
  };

  const handleDrop = useCallback(
    (acceptedFiles) => {
      if (formLocked) return;

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
    [enqueueSnackbar, setValue, formLocked]
  );

  const onSubmit = handleSubmit(async (data) => {
    // ✅ bloqueo hard para crear si el plan no lo permite
    if (!isEdit && permissionState.locked) {
      enqueueSnackbar(permissionState.message || 'Tu suscripción no permite crear usuarios.', {
        variant: 'error',
      });
      return;
    }

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
      enqueueSnackbar(
        currentUser ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito',
        { variant: 'success' }
      );
      router.push(paths.dashboard.user.list);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(error.message || 'Ocurrió un error al guardar el usuario.', {
        variant: 'error',
      });
    }
  });

  // Para deshabilitar todo visualmente (incluye avatar)
  const lockStyles = formLocked
    ? { opacity: 0.75, pointerEvents: 'none' }
    : null;

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            <Box sx={{ mb: 2 }}>
              {/* ✅ Mensaje bloqueo */}
              {permissionState.locked && !isEdit && (
                <Typography sx={{ color: 'error.main', fontWeight: 600, mb: 2 }}>
                  {permissionState.message || 'El plan actual no permite la creación de nuevos usuarios.'}
                </Typography>
              )}

              {permissionState.checking && !isEdit && (
                <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                  Validando permisos de tu suscripción...
                </Typography>
              )}

              <Box sx={lockStyles || undefined}>
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
            </Box>
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            {/* ✅ Mensaje bloqueo arriba del formulario también */}
            {permissionState.locked && !isEdit && (
              <Typography sx={{ color: 'error.main', fontWeight: 600, mb: 2 }}>
                {permissionState.message || 'El plan actual no permite la creación de nuevos usuarios.'}
              </Typography>
            )}

            <Box sx={lockStyles || undefined}>
              <Box
                rowGap={3}
                columnGap={2}
                display="grid"
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                }}
              >
                <RHFTextField name="first_name" label="Nombre" disabled={formLocked} />
                <RHFTextField name="last_name" label="Apellido" disabled={formLocked} />
                <RHFTextField name="email" label="Email" disabled={formLocked} />
                <RHFTextField name="phone_number" label="Número de teléfono" disabled={formLocked} />

                <RHFAutocomplete
                  name="country"
                  type="country"
                  label="País"
                  placeholder="Elegí un país"
                  fullWidth
                  options={countries.map((option) => option.label)}
                  getOptionLabel={(option) => option}
                  disabled={formLocked}
                />

                <RHFTextField name="national_id" label="DNI" disabled={formLocked} />
                <RHFTextField name="city" label="Ciudad" disabled={formLocked} />
                <RHFTextField name="address" label="Dirección" disabled={formLocked} />
                <RHFTextField name="postal_code" label="Código postal" disabled={formLocked} />

                {authUser?.user?.role_id === 1 ? (
                  <RHFAutocomplete
                    name="commerce_id"
                    label="Comercio"
                    fullWidth
                    options={commerces}
                    getOptionLabel={(option) => option.name}
                    onChange={handleCommerceChange}
                    disabled={formLocked}
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
                  onChange={handleRoleChange}
                  disabled={formLocked}
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
                    disabled={formLocked}
                  />
                )}
              </Box>
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton
                type="submit"
                variant="contained"
                loading={isSubmitting || permissionState.checking}
                disabled={formLocked}
              >
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
