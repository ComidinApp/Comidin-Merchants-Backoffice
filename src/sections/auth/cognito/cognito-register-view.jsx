// src/sections/auth/cognito/cognito-register-view.jsx
import * as Yup from 'yup';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { useRouter } from 'src/routes/hooks';
import { useAuthContext } from 'src/auth/hooks';
import { Upload } from 'src/components/upload';
import { VITE_S3_ASSETS_AVATAR } from 'src/config-global';
import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

const { VITE_API_COMIDIN } = import.meta.env;

// === Ajustá esto si tu backend expone otra ruta ===
const EMAIL_EXISTS_ENDPOINT = (email) =>
  `${VITE_API_COMIDIN}/employee/exists?email=${encodeURIComponent(email)}`;

// Política de contraseña (Cognito suele exigir símbolo, número, mayúscula, minúscula, min 8)
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function CognitoRegisterView() {
  const { register: registerCognito } = useAuthContext();
  const router = useRouter();

  const [openAt, setOpenAt] = useState(null);
  const [closeAt, setCloseAt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);

  const assets_url = VITE_S3_ASSETS_AVATAR;
  const password = useBoolean();

  const daysOfWeek = [
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
    'domingo',
  ];

  // ===== Yup base (sin la verificación remota del email) =====
  const RegisterSchema = Yup.object().shape({
    name: Yup.string().required('El nombre del comercio es requerido'),
    street_name: Yup.string().required('La dirección es requerida'),
    open_at: Yup.date().required('La hora de apertura es requerida'),
    close_at: Yup.date().required('La hora de cierre es requerida'),
    number: Yup.string()
      .required('El número de la calle es requerido')
      .matches(/^\d+[A-Za-z0-9\-\/]*$/, 'Solo números y/o sufijos válidos'),
    postal_code: Yup.string()
      .required('El código postal es requerido')
      .matches(/^[A-Za-z0-9\- ]{3,10}$/, 'Código postal inválido'),
    national_id: Yup.string()
      .required('El DNI es requerido')
      .matches(/^\d{6,10}$/, 'DNI inválido'),
    commerce_national_id: Yup.string()
      .required('El CUIT/CUIL es requerido')
      .matches(/^\d{11}$/, 'CUIT/CUIL debe tener 11 dígitos'),
    first_name: Yup.string().required('El nombre del encargado es requerido'),
    last_name: Yup.string().required('El apellido del encargado es requerido'),
    email: Yup.string()
      .required('El email es requerido')
      .email('Debe ser un email válido'),
    phone_number: Yup.string()
      .required('El teléfono es requerido')
      .matches(/^\+?\d{7,15}$/, 'Teléfono inválido'),
    password: Yup.string()
      .required('La contraseña es requerida')
      .matches(
        PASSWORD_POLICY,
        'Debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo'
      ),
    commerce_category_id: Yup.string().required('La categoría de comercio es requerida'),
    image_url: Yup.string().required('La imagen es requerida'),
    available_days: Yup.array()
      .of(
        Yup.string().oneOf([
          'lunes',
          'martes',
          'miércoles',
          'jueves',
          'viernes',
          'sábado',
          'domingo',
        ])
      )
      .min(1, 'Debe seleccionar al menos un día de disponibilidad')
      .required('Debe seleccionar los días disponibles'),
  });

  const defaultValues = {
    name: '',
    street_name: '',
    number: '',
    open_at: '',
    close_at: '',
    postal_code: '',
    national_id: '',
    commerce_national_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    commerce_category_id: '',
    password: '',
    image_url: '',
    available_days: [],
  };

  const methods = useForm({
    resolver: yupResolver(RegisterSchema),
    defaultValues,
    mode: 'all',
  });

  const {
    reset,
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    trigger,
    watch,
    formState: { isSubmitting },
  } = methods;

  // ======== Imagen (dejamos como estaba) ========
  const handleDropSingleFile = useCallback(
    (acceptedFiles) => {
      const newFile = acceptedFiles[0];
      if (!newFile) return;

      const preview = URL.createObjectURL(newFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFile({ ...newFile, preview, base64: base64String });
        setValue('image_url', base64String);
        setValue('image_name', newFile.name);
      };
      reader.readAsDataURL(newFile);
    },
    [setValue]
  );

  // ======== Conversor de hora 12h a 24h ========
  function convertTime(hora12) {
    const partes = hora12.split(' ');
    const hora = parseInt(partes[0], 10);
    const periodo = (partes[1] || '').toUpperCase();
    let hora24 = hora;
    if (periodo === 'PM' && hora !== 12) hora24 += 12;
    if (periodo === 'AM' && hora === 12) hora24 = 0;
    const minutos = partes[0].split(':')[1] || '00';
    return `${hora24.toString().padStart(2, '0')}:${minutos}`;
  }

  // ======== Chequeo en vivo de email (debounced) ========
  const email = watch('email');
  const [emailStatus, setEmailStatus] = useState('idle'); // idle | checking | available | exists | invalid
  const debounceRef = useRef(null);

  useEffect(() => {
    // limpiar debounce previo
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // si no hay email o el formato es inválido, no consultar
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus(email ? 'invalid' : 'idle');
      // solo mostramos error si tiene formato inválido
      if (email && emailStatus !== 'invalid') {
        setError('email', { type: 'manual', message: 'Debe ser un email válido' });
      }
      return;
    }

    // debounce de 600ms
    setEmailStatus('checking');
    clearErrors('email');

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(EMAIL_EXISTS_ENDPOINT(email), { method: 'GET' });
        if (!res.ok) {
          // si el endpoint no existe o responde 404/500, no bloquear el flujo
          setEmailStatus('available');
          clearErrors('email');
          return;
        }
        const data = await res.json();
        if (data?.exists) {
          setEmailStatus('exists');
          setError('email', {
            type: 'manual',
            message: 'Este email ya está en uso. Por favor ingresá otro.',
          });
        } else {
          setEmailStatus('available');
          clearErrors('email');
        }
      } catch (_e) {
        // en error de red no bloqueamos, pero avisamos visualmente como disponible
        setEmailStatus('available');
        clearErrors('email');
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const isEmailBusy = emailStatus === 'checking' || emailStatus === 'exists';

  // ======== Submit ========
  const onSubmit = handleSubmit(async (data) => {
    try {
      // si el email está ocupado, prevenimos el submit
      if (emailStatus === 'exists') {
        setError('email', {
          type: 'manual',
          message: 'Este email ya está en uso. Por favor ingresá otro.',
        });
        return;
      }
      data.available_days = data.available_days.join(',');
      data.is_active = true;

      const formattedOpenAt = convertTime(
        data.open_at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
      const formattedCloseAt = convertTime(
        data.close_at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );

      data.open_at = formattedOpenAt;
      data.close_at = formattedCloseAt;

      const commerce = await createCommerce(data);
      data.role_id = 6;
      data.commerce_id = commerce.id;
      data.avatar_url = `${assets_url}coffe.png`;

      await registerCognito?.(data);
      // Opcional: redirigir a una pantalla de éxito
      // router.push('/gracias');
    } catch (error) {
      console.error('Error', error);
      reset();
      setErrorMsg(typeof error === 'string' ? error : error.message);
    }
  });

  // ======== Paso a paso ========
  const handleNextStep = async () => {
    let isStepValid = false;
    if (step === 0) {
      isStepValid = await trigger([
        'name',
        'street_name',
        'number',
        'postal_code',
        'open_at',
        'close_at',
        'commerce_national_id',
        'available_days',
        'commerce_category_id',
      ]);
    } else if (step === 1) {
      isStepValid = await trigger([
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'password',
        'national_id',
      ]);
      // bloque extra: si el email está ocupado, no avanzar
      if (isEmailBusy || emailStatus === 'invalid') isStepValid = false;
      if (emailStatus === 'exists') {
        setError('email', {
          type: 'manual',
          message: 'Este email ya está en uso. Por favor ingresá otro.',
        });
      }
    } else {
      isStepValid = true;
    }

    if (isStepValid) setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => setStep((prev) => prev - 1);

  // ======= Carga de categorías (igual que antes) =======
  const [commerce_categories, setCommerceCategories] = useState([]);
  useEffect(() => {
    const fetchCommerceCategories = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/commerceCategory`);
        const data = await response.json();
        setCommerceCategories(data || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };
    fetchCommerceCategories();
  }, []);

  const renderFormStep = () => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={2.5}>
            <RHFTextField name="name" label="Nombre del Comercio" />
            <RHFTextField name="commerce_national_id" label="CUIT/CUIL" />
            <RHFTextField
              select
              name="commerce_category_id"
              label="Categoría del Comercio"
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value=""> </option>
              {commerce_categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </RHFTextField>
            <RHFTextField name="street_name" label="Dirección" />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <RHFTextField name="number" label="Altura" />
              <RHFTextField name="postal_code" label="Código Postal" />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TimePicker
                name="open_at"
                label="Horario de Apertura"
                value={openAt}
                onChange={(newValue) => {
                  setOpenAt(newValue);
                  methods.setValue('open_at', newValue);
                }}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
              <TimePicker
                name="close_at"
                label="Horario de Cierre"
                value={closeAt}
                onChange={(newValue) => {
                  setCloseAt(newValue);
                  methods.setValue('close_at', newValue);
                }}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </Stack>
            <Typography variant="subtitle2">Días disponibles</Typography>
            <Grid container spacing={2}>
              {daysOfWeek.map((day) => (
                <Grid item xs={12} sm={4} key={day}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="available_days"
                        value={day}
                        checked={methods.watch('available_days').includes(day)}
                        onChange={(event) => {
                          const newValue = event.target.checked
                            ? [...methods.watch('available_days'), day]
                            : methods.watch('available_days').filter((d) => d !== day);
                          methods.setValue('available_days', newValue);
                        }}
                      />
                    }
                    label={day.charAt(0).toUpperCase() + day.slice(1)}
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <RHFTextField name="first_name" label="Nombre del Responsable" />
              <RHFTextField name="last_name" label="Apellido del Responsable" />
            </Stack>
            <RHFTextField name="national_id" label="DNI del Responsable" />
            <RHFTextField
              name="email"
              label="Email del Responsable"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {emailStatus === 'checking' && <CircularProgress size={18} />}
                    {emailStatus === 'available' && (
                      <Iconify icon="solar:check-circle-bold" width={20} />
                    )}
                    {emailStatus === 'exists' && (
                      <Iconify icon="solar:danger-bold" width={20} />
                    )}
                  </InputAdornment>
                ),
              }}
              helperText={
                emailStatus === 'exists'
                  ? 'Este email ya está en uso. Ingresá otro.'
                  : emailStatus === 'available'
                  ? 'Email disponible'
                  : emailStatus === 'checking'
                  ? 'Verificando...'
                  : ' '
              }
            />
            <RHFTextField name="phone_number" label="Teléfono del Responsable" />
            <RHFTextField
              name="password"
              label="Contraseña"
              type={password.value ? 'text' : 'password'}
              helperText="Mín. 8, con mayúscula, minúscula, número y símbolo"
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
          </Stack>
        );
      case 2:
        return (
          <Card>
            <CardHeader title="Suelta aquí el logo de tu comercio" />
            <CardContent>
              <Upload file={file} onDrop={handleDropSingleFile} onDelete={() => setFile(null)} />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Stack spacing={2} sx={{ mb: 3, position: 'relative' }}>
        <Typography variant="h4">¡Registrá tu comercio ahora mismo!</Typography>
      </Stack>

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <FormProvider methods={methods} onSubmit={onSubmit}>
        {renderFormStep()}

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          {step > 0 && (
            <LoadingButton fullWidth size="large" variant="outlined" onClick={handlePrevStep}>
              Volver
            </LoadingButton>
          )}
          {step < 2 && (
            <LoadingButton
              fullWidth
              size="large"
              variant="contained"
              onClick={handleNextStep}
              disabled={isEmailBusy && step === 1} // bloquea cuando está chequeando o ya existe
            >
              Siguiente
            </LoadingButton>
          )}
          {step === 2 && (
            <LoadingButton
              fullWidth
              color="inherit"
              size="large"
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={isEmailBusy} // bloquea submit también
            >
              Enviar solicitud
            </LoadingButton>
          )}
        </Stack>
      </FormProvider>

      <Typography
        component="div"
        sx={{ mt: 2.5, textAlign: 'center', typography: 'caption', color: 'text.secondary' }}
      >
        {'By signing up, I agree to '}
        <Link underline="always" color="text.primary">
          Terms of Service
        </Link>
        {' and '}
        <Link underline="always" color="text.primary">
          Privacy Policy
        </Link>
        .
      </Typography>
    </>
  );
}
