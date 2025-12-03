// src/sections/auth/cognito/cognito-register-view.jsx
import * as Yup from 'yup';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { createCommerce } from 'src/api/commerce';
import { useAuthContext } from 'src/auth/hooks';
import { Upload } from 'src/components/upload';
import { VITE_API_COMIDIN, VITE_S3_ASSETS_AVATAR } from 'src/config-global';
import { useBoolean } from 'src/hooks/use-boolean';
import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// =========================================================
// 🔥 LÍMITE REAL DE IMAGEN: 600 KB
// =========================================================
const MAX_FILE_MB = 0.6;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

// Texto mostrado al usuario (coherente)
const DISPLAY_MAX_MB = "600KB";

// =========================================================

// Expresiones regulares
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const DNI_REGEX = /^[0-9]{7,8}$/;
const CUIL_REGEX = /^[0-9]{11}$/;
const PHONE_REGEX = /^[0-9+\s-]{6,20}$/;

const daysOfWeek = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

const EMAIL_EXISTS_ENDPOINT = (email) =>
  `${VITE_API_COMIDIN}/employee/exists?email=${encodeURIComponent(email)}`;

// Yup Validation
const RegisterSchema = Yup.object().shape({
  name: Yup.string().required('El nombre del comercio es requerido'),
  street_name: Yup.string().required('La dirección es requerida'),
  number: Yup.string().required('La altura es requerida'),
  postal_code: Yup.string().required('El código postal es requerido'),
  open_at: Yup.date().nullable().required('La hora de apertura es requerida'),
  close_at: Yup.date()
    .nullable()
    .required('La hora de cierre es requerida')
    .test(
      'is-later',
      'La hora de cierre debe ser posterior a la de apertura',
      function (value) {
        const { open_at } = this.parent;
        if (!value || !open_at) return true;
        return value.getTime() > open_at.getTime();
      }
    ),
  commerce_national_id: Yup.string()
    .required('CUIT/CUIL requerido')
    .matches(CUIL_REGEX, 'Debe tener 11 números'),
  first_name: Yup.string().required('El nombre del responsable es requerido'),
  last_name: Yup.string().required('El apellido del responsable es requerido'),
  national_id: Yup.string()
    .required('El DNI es requerido')
    .matches(DNI_REGEX, 'Debe tener 7 u 8 dígitos'),
  email: Yup.string().email('Email inválido').required('El email es requerido'),
  phone_number: Yup.string().required('El teléfono es requerido'),
  password: Yup.string()
    .required('La contraseña es requerida')
    .matches(
      PASSWORD_POLICY,
      'Debe tener mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo'
    ),
  commerce_category_id: Yup.string().required('La categoría es requerida'),
  available_days: Yup.array()
    .min(1, 'Debés seleccionar al menos un día')
    .required(),
  image_url: Yup.string().required('La imagen es requerida'),
});

const defaultValues = {
  name: '',
  street_name: '',
  number: '',
  postal_code: '',
  open_at: null,
  close_at: null,
  commerce_national_id: '',
  national_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  password: '',
  commerce_category_id: '',
  available_days: [],
  image_url: '',
  image_name: '',
};

export default function CognitoRegisterView() {
  const { register: registerCognito } = useAuthContext();

  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(2); // para probar directamente step logo
  const [file, setFile] = useState(null);

  const methods = useForm({
    resolver: yupResolver(RegisterSchema),
    defaultValues,
    mode: 'all',
  });

  const {
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const password = useBoolean();
  const assets_url = VITE_S3_ASSETS_AVATAR;

  // =========================================================
  // 🔥 VALIDACIÓN DE IMAGEN — LÍMITE 600 KB
  // =========================================================
  const handleDropSingleFile = useCallback(
    (acceptedFiles) => {
      const newFile = acceptedFiles?.[0];
      if (!newFile) return;

      // VALIDAR TAMAÑO REAL DEL ARCHIVO
      if (newFile.size > MAX_FILE_BYTES) {
        setFile(null);

        // No validamos Yup acá → ponemos directamente el error manual
        setValue('image_url', '', { shouldValidate: false });
        setValue('image_name', '', { shouldValidate: false });

        setError('image_url', {
          type: 'manual',
          message: `Error: la imagen no debe superar los ${DISPLAY_MAX_MB}.`,
        });

        return;
      }

      // Imagen válida → limpiar errores previos
      clearErrors('image_url');

      const preview = URL.createObjectURL(newFile);
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result;

        setFile({ ...newFile, preview, base64: base64String });
        setValue('image_url', base64String, { shouldValidate: true });
        setValue('image_name', newFile.name, { shouldValidate: false });
      };

      reader.readAsDataURL(newFile);
    },
    [setValue, setError, clearErrors]
  );

  // =========================================================
  // SUBMIT FINAL
  // =========================================================
  const onSubmit = async (data) => {
    try {
      if (!data.image_url) {
        setError('image_url', {
          type: 'manual',
          message: `La imagen es requerida y no debe superar los ${DISPLAY_MAX_MB}.`,
        });
        return;
      }

      data.available_days = data.available_days.join(',');
      data.is_active = true;

      const commerce = await createCommerce(data);

      data.role_id = 6;
      data.commerce_id = commerce.id;
      data.avatar_url = `${assets_url}coffe.png`;

      await registerCognito?.(data);
    } catch (error) {
      console.error(error);
      setErrorMsg('Ocurrió un error al registrar el comercio.');
    }
  };

  // =========================================================
  // STEP 3 — LOGO
  // =========================================================
  const renderLogoStep = () => (
    <Card>
      <CardHeader title={`Subí tu logo (${DISPLAY_MAX_MB} máx.)`} />
      <CardContent>
        <Upload
          file={file}
          onDrop={handleDropSingleFile}
          onDelete={() => {
            setFile(null);
            setValue('image_url', '', { shouldValidate: true });
          }}
        />

        {errors.image_url && (
          <Typography variant="caption" color="error">
            {errors.image_url.message}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        {renderLogoStep()}

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <LoadingButton
            fullWidth
            size="large"
            variant="contained"
            type="submit"
            loading={isSubmitting}
          >
            Enviar solicitud
          </LoadingButton>
        </Stack>
      </FormProvider>
    </>
  );
}
