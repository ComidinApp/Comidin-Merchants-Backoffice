import * as Yup from 'yup';
import { useMemo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { countries } from 'src/assets/data';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFSelect,
  RHFTextField,
  RHFAutocomplete,
} from 'src/components/hook-form';

const { VITE_API_COMIDIN } = import.meta.env;

// Opciones de estado en español
const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'banned', label: 'Bloqueado' },
];

export default function UserQuickEditForm({ currentUser, open, onClose }) {
  const { enqueueSnackbar } = useSnackbar();

  const [roles, setRoles] = useState([]);
  const [commerces, setCommerces] = useState([]);

  // --- Carga de roles y comercios (rutas /api/...) ---
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/api/role`);
        const data = await response.json();
        setRoles(data || []);
      } catch (error) {
        console.error('Error al obtener los roles:', error);
      }
    };

    const fetchCommerces = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/api/commerce`);
        const data = await response.json();
        setCommerces(data || []);
      } catch (error) {
        console.error('Error al obtener los comercios:', error);
      }
    };

    fetchRoles();
    fetchCommerces();
  }, []);

  // --- Validación ---
  const NewUserSchema = Yup.object().shape({
    first_name: Yup.string().required('El nombre es obligatorio'),
    last_name: Yup.string().required('El apellido es obligatorio'),
    email: Yup.string()
      .required('El email es obligatorio')
      .email('El email debe ser una dirección válida.'),
    phone_number: Yup.string().required('El número de teléfono es obligatorio'),
    address: Yup.string().required('La dirección es obligatoria'),
    country: Yup.string().required('El país es obligatorio'),
    commerce_id: Yup.number().required('El comercio es obligatorio'),
    national_id: Yup.string().required('El DNI es obligatorio'),
    city: Yup.string().required('La ciudad es obligatoria'),
    role_id: Yup.number().required('El rol es obligatorio'),
    postal_code: Yup.string().required('El código postal es obligatorio'),
    ...(currentUser
      ? {}
      : { password: Yup.string().required('La contraseña es obligatoria') }),
    status: Yup.string(),
  });

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
      phone_number: currentUser?.phone_number || '',
    }),
    [currentUser]
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;

  // --- Submit (rutas /api/employee) ---
  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

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
        throw new Error('Error al enviar los datos al servidor');
      }

      const responseData = await response.json();
      console.log('Respuesta del servidor (quick edit):', responseData);

      reset();
      onClose();
      enqueueSnackbar('Usuario actualizado con éxito', { variant: 'success' });
      console.info('DATA (quick edit)', data);
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      enqueueSnackbar('Error al actualizar el usuario', { variant: 'error' });
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 720 } }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Edición rápida de usuario</DialogTitle>

        <DialogContent>
          <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
            Antes de guardar los cambios, verificá que toda la información sea correcta.
          </Alert>

          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
          >
            <RHFSelect name="status" label="Estado">
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </RHFSelect>

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

            <RHFTextField name="city" label="Ciudad" />
            <RHFTextField name="address" label="Dirección" />
            <RHFTextField name="postal_code" label="Código postal" />

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
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Guardar cambios
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

UserQuickEditForm.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  currentUser: PropTypes.object,
};
