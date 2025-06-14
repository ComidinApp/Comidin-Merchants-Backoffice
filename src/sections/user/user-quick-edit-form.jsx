import * as Yup from 'yup';
import { useMemo, useEffect, useState, useCallback } from 'react';
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
import { USER_STATUS_OPTIONS } from 'src/_mock';
import { VITE_S3_ASSETS_AVATAR } from 'src/config-global';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFSelect,
  RHFTextField,
  RHFAutocomplete,
  RHFUploadAvatar,
} from 'src/components/hook-form';

const { VITE_API_COMIDIN } = import.meta.env;
export default function UserQuickEditForm({ currentUser, open, onClose }) {
  const { enqueueSnackbar } = useSnackbar();

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

  const NewUserSchema = Yup.object().shape({
    first_name: Yup.string().required('Nombre es requerido'),
    last_name: Yup.string().required('Apellido es requerido'),
    email: Yup.string()
      .required('Email es requerido')
      .email('Email debe ser una direccion valida.'),
    phone_number: Yup.string().required('Phone number is required'),
    address: Yup.string().required('Direccion es requerida'),
    country: Yup.string().required('Pais es requerido'),
    commerce_id: Yup.number().required('Comercio es requerido'),
    national_id: Yup.string().required('DNI es requerido'),
    city: Yup.string().required('Ciudad es requerida'),
    role_id: Yup.number().required('Rol es requerido'),
    postal_code: Yup.string().required('Codigo postal es requerido'),
    ...(currentUser ? {} : { password: Yup.string().required('Contraseña es requerida') }),
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

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const url = currentUser
        ? `${VITE_API_COMIDIN}/employee/${currentUser.id}`
        : `${VITE_API_COMIDIN}/employee`;

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
      onClose();
      enqueueSnackbar('Update success!');
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      const newFile = Object.assign(file, { preview: URL.createObjectURL(file) });

      if (file) {
        setValue('avatar_url', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );
  console.log(currentUser);

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 720 } }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Quick Update</DialogTitle>

        <DialogContent>
          <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
            Antes de guardar los cambios, verifique que toda la información sea correcta.
          </Alert>

          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
          >
            <RHFSelect name="status" label="Status">
              {USER_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </RHFSelect>

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

            <RHFTextField name="city" label="Ciudad" />
            <RHFTextField name="address" label="Address" />
            <RHFTextField name="postal_code" label="Codigo Postal" />

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
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Update
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
