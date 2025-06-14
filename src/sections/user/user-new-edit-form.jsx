import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
export const VITE_API_COMIDIN = import.meta.env.VITE_API_COMIDIN;
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { countries } from 'src/assets/data';
import { VITE_S3_ASSETS_AVATAR } from 'src/config-global';

import Label from 'src/components/label';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFUploadAvatar,
  RHFAutocomplete,
} from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function UserNewEditForm({ currentUser }) {
  const router = useRouter();

  const authUser = useAuthContext();

  const { enqueueSnackbar } = useSnackbar();

  const assets_url = VITE_S3_ASSETS_AVATAR;

  const [roles, setRoles] = useState([]);
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
    fetchRoles();
  }, []);

  const [commerces, setCommerces] = useState([]);
  useEffect(() => {
    const fetchCommerces = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/commerce`);
        const data = await response.json();
        setCommerces(data || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };
    fetchCommerces();
  }, []);

  const NewUserSchema = Yup.object().shape({
    first_name: Yup.string().required('Nombre es requerido'),
    last_name: Yup.string().required('Apellido es requerido'),
    email: Yup.string()
      .required('Email es requerido')
      .email('Email debe ser una dirección válida.'),
    phone_number: Yup.string().required('Número de teléfono es requerido'),
    address: Yup.string().required('Dirección es requerida'),
    country: Yup.string().required('País es requerido'),
    commerce_id: Yup.number().required('Comercio es requerido'),
    national_id: Yup.string().required('DNI es requerido'),
    city: Yup.string().required('Ciudad es requerida'),
    role_id: Yup.number().required('Rol es requerido'),
    postal_code: Yup.string().required('Código postal es requerido'),
    ...(currentUser ? {} : { password: Yup.string().required('Contraseña es requerida') }),
    avatar_url: Yup.mixed().nullable().required('Avatar es requerido'),
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
      /* isVerified: currentUser?.isVerified || true, */
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

  /* const values = watch(); */

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const url = currentUser
        ? `${VITE_API_COMIDIN}/employee/${currentUser.id}`
        : '`{VITE_API_COMIDIN}/employee`;

      const method = currentUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al enviar los datos');
      }

      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);

      reset();
      enqueueSnackbar(currentUser ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.user.list);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue('avatar_url', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  useEffect(() => {
    if (authUser.user.role_id !== 1) {
      setValue('commerce_id', authUser.user.commerce.id);
    }
  }, [authUser.user.role_id, authUser.user.commerce.id, setValue]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {/* {currentUser && (
              <Label
                color={
                  (values.status === 'active' && 'success') ||
                  (values.status === 'banned' && 'error') ||
                  'warning'
                }
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.status}
              </Label>
            )} */}

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
                    {/* Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)} */}
                  </Typography>
                }
              />
            </Box>

            {/* {currentUser && (
              <FormControlLabel
                labelPlacement="start"
                control={
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        {...field}
                        checked={field.value !== 'active'}
                        onChange={(event) =>
                          field.onChange(event.target.checked ? 'banned' : 'active')
                        }
                      />
                    )}
                  />
                }
                label={
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Banned
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Apply disable account
                    </Typography>
                  </>
                }
                sx={{ mx: 0, mb: 3, width: 1, justifyContent: 'space-between' }}
              />
            )} */}

            {/* <RHFSwitch
              name="isVerified"
              labelPlacement="start"
              label={
                <>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Email Verified
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Disabling this will automatically send the user a verification email
                  </Typography>
                </>
              }
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            /> */}

            {/* {currentUser && (
              <Stack justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
                <Button variant="soft" color="error">
                  Delete User
                </Button>
              </Stack>
            )} */}
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
              <RHFTextField name="phone_number" label="Numero de Telefono" />

              <RHFAutocomplete
                name="country"
                type="country"
                label="Pais"
                placeholder="Elije un pais"
                fullWidth
                options={countries.map((option) => option.label)}
                getOptionLabel={(option) => option}
              />

              <RHFTextField name="national_id" label="DNI" />
              <RHFTextField name="city" label="Ciudad" />
              <RHFTextField name="address" label="Direccion" />
              <RHFTextField name="postal_code" label="Codigo Postal" />
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
                  isOptionEqualToValue={(option, value) => option.id === (value?.id || value)}
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
                {!currentUser ? 'Create User' : 'Save Changes'}
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
