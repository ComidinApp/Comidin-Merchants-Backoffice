// src/sections/auth/cognito/cognito-register-view.jsx
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRef, useState, useEffect, useCallback } from 'react';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { useBoolean } from 'src/hooks/use-boolean';

import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';
import { createCommerce } from 'src/api/commerce';
import { VITE_API_COMIDIN, VITE_S3_ASSETS_AVATAR } from 'src/config-global';

import Iconify from 'src/components/iconify';
import { Upload } from 'src/components/upload';
import { SplashScreen } from 'src/components/loading-screen';
import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

// ================== CONSTANTES ==================

// Endpoint para chequear email de empleado existente
const EMAIL_EXISTS_ENDPOINT = (email) =>
  `${VITE_API_COMIDIN}/api/employee/exists?email=${encodeURIComponent(email)}`;

// Endpoint para chequear DNI existente
const NATIONAL_ID_EXISTS_ENDPOINT = (nationalId) =>
  `${VITE_API_COMIDIN}/api/employee/exists?national_id=${encodeURIComponent(nationalId)}`;

// Endpoint para chequear teléfono existente
const PHONE_EXISTS_ENDPOINT = (phoneNumber) =>
  `${VITE_API_COMIDIN}/api/employee/exists?phone_number=${encodeURIComponent(phoneNumber)}`;

// Política Cognito: 8+ con mayúscula, minúscula, número y símbolo
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// DNI: solo números, 7–8 dígitos
const DNI_REGEX = /^[0-9]{7,8}$/;

// CUIT/CUIL del comercio: solo números, 11 dígitos
const CUIL_REGEX = /^[0-9]{11}$/;

// Teléfono sencillo: números, espacios, + y -
const PHONE_REGEX = /^[0-9+\s-]{6,20}$/;

const POSTAL_CODE_REGEX = /^[0-9]{3,10}$/;

const daysOfWeek = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

// 🔒 Límite de imagen: 600KB (archivo real)
const MAX_IMAGE_SIZE_KB = 600;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_KB * 1024;

// ================== Validación Yup ==================
const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .nullable()
    .required('El nombre del comercio es requerido')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  // ================== COMERCIO (step 0) ==================

  street_name: Yup.string()
    .nullable()
    .required('La dirección es requerida')
    .max(30, 'La dirección no puede superar los 30 caracteres'),

  open_at: Yup.date()
    .nullable()
    .typeError('La hora de apertura es requerida')
    .required('La hora de apertura es requerida'),

  // close_at debe ser estrictamente mayor que open_at
  close_at: Yup.date()
    .nullable()
    .typeError('La hora de cierre es requerida')
    .required('La hora de cierre es requerida')
    .test(
      'is-later-than-open',
      'La hora de cierre debe ser posterior a la hora de apertura',
      function validateCloseAt(value) {
        const { open_at } = this.parent;
        if (!open_at || !value) return true;
        try {
          return value.getTime() > open_at.getTime();
        } catch (_e) {
          return true;
        }
      }
    ),

  number: Yup.string()
    .nullable()
    .required('El número de la calle es requerido')
    .matches(/^[0-9]{1,6}$/, 'La altura debe ser numérica y razonable'),

  postal_code: Yup.string()
    .nullable()
    .required('El código postal es requerido')
    .matches(POSTAL_CODE_REGEX, 'El código postal debe ser numérico'),

  commerce_national_id: Yup.string()
    .nullable()
    .required('El CUIT/CUIL es requerido')
    .matches(CUIL_REGEX, 'El CUIT/CUIL debe tener 11 números, sin guiones ni puntos'),

  commerce_category_id: Yup.string()
    .nullable()
    .required('La categoría de comercio es requerida')
    .matches(/^[0-9]+$/, 'La categoría seleccionada no es válida'),

  available_days: Yup.array()
    .nullable()
    .of(
      Yup.number()
        .min(0, 'Día inválido')
        .max(6, 'Día inválido')
    )
    .min(1, 'Debe seleccionar al menos un día disponible')
    .required('Debe seleccionar los días disponibles'),

  // ================== RESPONSABLE (step 1) ==================
  first_name: Yup.string()
    .nullable()
    .required('El nombre del responsable es requerido')
    .max(50, 'El nombre no puede superar los 50 caracteres'),

  last_name: Yup.string()
    .nullable()
    .required('El apellido del responsable es requerido')
    .max(50, 'El apellido no puede superar los 50 caracteres'),

  national_id: Yup.string()
    .nullable()
    .required('El DNI es requerido')
    .matches(DNI_REGEX, 'El DNI debe tener solo números (7 u 8 dígitos)'),

  email: Yup.string().nullable().required('El email es requerido').email('Debe ser un email válido'),

  phone_number: Yup.string()
    .nullable()
    .required('El teléfono es requerido')
    .matches(PHONE_REGEX, 'El teléfono solo puede contener números, espacios, + y -'),

  password: Yup.string()
    .nullable()
    .required('La contraseña es requerida')
    .matches(
      PASSWORD_POLICY,
      'Debe tener al menos 8 caracteres, con mayúscula, minúscula, número y símbolo'
    ),

  confirmPassword: Yup.string()
    .nullable()
    .required('Debés confirmar la contraseña')
    .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden'),

  // ✅ NUEVOS CAMPOS DEL RESPONSABLE (employee)
  address: Yup.string().nullable().required('La dirección del responsable es requerida'),

  city: Yup.string().nullable().required('La ciudad del responsable es requerida'),

  country: Yup.string().nullable().required('El país del responsable es requerido'),

  // Ojo: este postal_code es del responsable (employee). El de comercio ya existe arriba.
  // Para evitar colisión de nombre, este form YA usa postal_code para comercio.
  // ✅ Solución: mantenemos postal_code como comercio (step 0) y agregamos postal_code_employee para responsable.
  // Pero vos pediste "postal_code" tal cual. Si lo dejás igual, vas a pisar el CP del comercio.
  // Por consistencia y para que no rompas el payload, lo agrego como postal_code_employee y lo mapeo al submit.
  postal_code_employee: Yup.string()
    .nullable()
    .required('El código postal del responsable es requerido')
    .matches(POSTAL_CODE_REGEX, 'El código postal del responsable debe ser numérico'),

  // ================== LOGO (step 2) ==================
  image_url: Yup.string().nullable().required('La imagen es requerida'),
});

const defaultValues = {
  // Comercio
  name: '',
  street_name: '',
  number: '',
  open_at: null,
  close_at: null,
  postal_code: '',
  commerce_national_id: '',
  commerce_category_id: '',
  available_days: [],

  // Responsable
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  password: '',
  confirmPassword: '',
  national_id: '',

  // ✅ NUEVOS Responsable (employee)
  address: '',
  city: '',
  country: 'Argentina',
  postal_code_employee: '',

  // Logo
  image_url: '',
  image_name: '',
};

export default function CognitoRegisterView() {
  const { register: registerCognito } = useAuthContext();

  const [openAt, setOpenAt] = useState(null);
  const [closeAt, setCloseAt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [loadingScreen, setLoadingScreen] = useState(false);

  const assets_url = VITE_S3_ASSETS_AVATAR;
  const password = useBoolean();

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
    trigger,
    watch,
    formState: { isSubmitting, errors },
  } = methods;

  // ======== Imagen (con validación de tamaño 600KB) ========
  const handleDropSingleFile = useCallback(
    (acceptedFiles) => {
      const newFile = acceptedFiles?.[0];
      if (!newFile) return;

      if (newFile.size > MAX_IMAGE_SIZE_BYTES) {
        setFile(null);

        setValue('image_url', '', { shouldValidate: false });
        setValue('image_name', '', { shouldValidate: false });

        setError('image_url', {
          type: 'manual',
          message: `Error: la imagen no debe superar los ${MAX_IMAGE_SIZE_KB}KB.`,
        });
        return;
      }

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

  // ======== Conversor de hora 12h a 24h ========
  function convertTime(hora12) {
    if (!hora12) return null;
    const partes = hora12.split(' ');
    const horaMin = partes[0] || '';
    const periodo = (partes[1] || '').toUpperCase();

    const [hStr, mStr] = horaMin.split(':');
    const hora = parseInt(hStr, 10);
    const minutos = mStr || '00';

    if (Number.isNaN(hora)) return null;

    let hora24 = hora;
    if (periodo === 'PM' && hora !== 12) hora24 += 12;
    if (periodo === 'AM' && hora === 12) hora24 = 0;

    return `${hora24.toString().padStart(2, '0')}:${minutos}`;
  }

  // ======== Chequeo remoto de email (debounced) ========
  const email = watch('email');
  const [emailStatus, setEmailStatus] = useState('idle'); // idle | checking | available | exists | invalid
  const emailDebounceRef = useRef(null);

  const emailHelperText = () => {
    if (errors.email?.message) return errors.email.message;
    if (emailStatus === 'exists') return 'Este email ya está en uso. Ingresá otro.';
    if (emailStatus === 'available') return 'Email disponible';
    if (emailStatus === 'checking') return 'Verificando...';
    if (emailStatus === 'invalid') return 'Debe ser un email válido';
    return ' ';
  };

  const emailAdornment = () => {
    if (emailStatus === 'checking') return <CircularProgress size={18} />;
    if (emailStatus === 'available') return <Iconify icon="solar:check-circle-bold" width={20} />;
    if (emailStatus === 'exists') return <Iconify icon="solar:danger-bold" width={20} />;
    if (emailStatus === 'invalid') return <Iconify icon="solar:danger-bold" width={20} />;
    return null;
  };

  useEffect(() => {
    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);

    if (!email) {
      setEmailStatus('idle');
      clearErrors('email');
    } else {
      const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isValidFormat) {
        setEmailStatus('invalid');
        setError('email', { type: 'manual', message: 'Debe ser un email válido' });
        return;
      }

      setEmailStatus('checking');
      clearErrors('email');

      emailDebounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(EMAIL_EXISTS_ENDPOINT(email), { method: 'GET' });

          if (!res.ok) {
            setEmailStatus('available');
            clearErrors('email');
            return;
          }

          const data = await res.json();
          const emailExists = data?.emailExists ?? data?.exists ?? false;

          if (emailExists) {
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
          setEmailStatus('available');
          clearErrors('email');
        }
      }, 600);
    }
  }, [email, clearErrors, setError]);

  const isEmailBusy =
    emailStatus === 'checking' || emailStatus === 'exists' || emailStatus === 'invalid';

  // ======== Chequeo remoto de DNI (national_id) ========
  const nationalId = watch('national_id');
  const [nationalIdStatus, setNationalIdStatus] = useState('idle'); // idle | checking | available | exists | invalid
  const nationalIdDebounceRef = useRef(null);

  useEffect(() => {
    if (nationalIdDebounceRef.current) clearTimeout(nationalIdDebounceRef.current);

    if (!nationalId) {
      setNationalIdStatus('idle');
      clearErrors('national_id');
      return;
    }

    if (!DNI_REGEX.test(nationalId)) {
      setNationalIdStatus('invalid');
      setError('national_id', {
        type: 'manual',
        message: 'El DNI debe tener solo números (7 u 8 dígitos).',
      });
      return;
    }

    setNationalIdStatus('checking');
    clearErrors('national_id');

    nationalIdDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(NATIONAL_ID_EXISTS_ENDPOINT(nationalId), { method: 'GET' });

        if (!res.ok) {
          setNationalIdStatus('available');
          clearErrors('national_id');
          return;
        }

        const data = await res.json();
        const exists = data?.nationalIdExists ?? false;

        if (exists) {
          setNationalIdStatus('exists');
          setError('national_id', {
            type: 'manual',
            message: 'Este documento ya está registrado. Ingresá otro.',
          });
        } else {
          setNationalIdStatus('available');
          clearErrors('national_id');
        }
      } catch (_e) {
        setNationalIdStatus('available');
        clearErrors('national_id');
      }
    }, 600);
  }, [nationalId, clearErrors, setError]);

  const isNationalIdBusy =
    nationalIdStatus === 'checking' || nationalIdStatus === 'exists' || nationalIdStatus === 'invalid';

  const nationalIdHelperText = () => {
    if (errors.national_id?.message) return errors.national_id.message;
    if (nationalIdStatus === 'checking') return 'Verificando documento...';
    if (nationalIdStatus === 'exists') return 'Este documento ya está registrado.';
    if (nationalIdStatus === 'invalid') return 'El DNI debe tener solo números (7 u 8 dígitos).';
    return 'Sólo números, sin puntos ni espacios';
  };

  // ======== Chequeo remoto de teléfono (phone_number) ========
  const phoneNumber = watch('phone_number');
  const [phoneStatus, setPhoneStatus] = useState('idle'); // idle | checking | available | exists | invalid
  const phoneDebounceRef = useRef(null);

  useEffect(() => {
    if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);

    if (!phoneNumber) {
      setPhoneStatus('idle');
      clearErrors('phone_number');
      return;
    }

    if (!PHONE_REGEX.test(phoneNumber)) {
      setPhoneStatus('invalid');
      setError('phone_number', {
        type: 'manual',
        message: 'El teléfono solo puede contener números, espacios, + y -',
      });
      return;
    }

    setPhoneStatus('checking');
    clearErrors('phone_number');

    phoneDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(PHONE_EXISTS_ENDPOINT(phoneNumber), { method: 'GET' });

        if (!res.ok) {
          setPhoneStatus('available');
          clearErrors('phone_number');
          return;
        }

        const data = await res.json();
        const exists = data?.phoneExists ?? false;

        if (exists) {
          setPhoneStatus('exists');
          setError('phone_number', {
            type: 'manual',
            message: 'Este teléfono ya está registrado. Ingresá otro.',
          });
        } else {
          setPhoneStatus('available');
          clearErrors('phone_number');
        }
      } catch (_e) {
        setPhoneStatus('available');
        clearErrors('phone_number');
      }
    }, 600);
  }, [phoneNumber, clearErrors, setError]);

  const isPhoneBusy = phoneStatus === 'checking' || phoneStatus === 'exists' || phoneStatus === 'invalid';

  const phoneHelperText = () => {
    if (errors.phone_number?.message) return errors.phone_number.message;
    if (phoneStatus === 'checking') return 'Verificando teléfono...';
    if (phoneStatus === 'exists') return 'Este teléfono ya está registrado.';
    if (phoneStatus === 'invalid') return 'El teléfono solo puede contener números, espacios, + y -';
    return 'Sólo números, espacios, + y - (ej: +54 11 1234-5678)';
  };

  // ======== Submit ========
  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      setLoadingScreen(true);

      if (emailStatus === 'exists' || emailStatus === 'invalid') {
        setLoadingScreen(false);
        setError('email', {
          type: 'manual',
          message:
            emailStatus === 'exists'
              ? 'Este email ya está en uso. Por favor ingresá otro.'
              : 'Debe ser un email válido',
        });
        return;
      }

      if (isNationalIdBusy) {
        setLoadingScreen(false);
        setError('national_id', {
          type: 'manual',
          message:
            nationalIdStatus === 'exists'
              ? 'Este documento ya está registrado. Ingresá otro.'
              : 'El DNI ingresado no es válido.',
        });
        return;
      }

      if (isPhoneBusy) {
        setLoadingScreen(false);
        setError('phone_number', {
          type: 'manual',
          message:
            phoneStatus === 'exists'
              ? 'Este teléfono ya está registrado. Ingresá otro.'
              : 'El teléfono ingresado no es válido.',
        });
        return;
      }

      if (!data.image_url) {
        setLoadingScreen(false);
        setStep(2);
        setError('image_url', {
          type: 'manual',
          message: `La imagen es requerida y no debe superar los ${MAX_IMAGE_SIZE_KB}KB.`,
        });
        return;
      }

      // ===== Mapeos/formatos finales =====
      data.available_days = data.available_days.join(',');
      data.is_active = true;

      if (data.open_at instanceof Date) {
        const formattedOpenAt = convertTime(
          data.open_at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        );
        data.open_at = formattedOpenAt;
      }

      if (data.close_at instanceof Date) {
        const formattedCloseAt = convertTime(
          data.close_at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        );
        data.close_at = formattedCloseAt;
      }

      // Creamos comercio
      const commerce = await createCommerce(data);

      // Armamos data para employee/cognito
      data.role_id = 6;
      data.commerce_id = commerce.id;
      data.avatar_url = `${assets_url}coffe.png`;

      // ✅ IMPORTANTE: el CP del responsable va en postal_code (modelo employee)
      // Como el form ya usa postal_code para comercio, lo guardamos en postal_code_employee y lo mapeamos acá:
      data.postal_code = data.postal_code_employee;
      delete data.postal_code_employee;

      await registerCognito?.(data);
    } catch (error) {
      console.error('Error', error);
      setLoadingScreen(false);

      const backendErrors = error?.response?.data?.errors;
      const closeAtError = Array.isArray(backendErrors)
        ? backendErrors.find(
            (e) =>
              typeof e?.msg === 'string' &&
              e.msg.toLowerCase().includes('close_at must be later than open_at'.toLowerCase())
          )
        : null;

      if (closeAtError) {
        setStep(0);
        setError('close_at', {
          type: 'server',
          message: 'La hora de cierre debe ser posterior a la hora de apertura',
        });
        setErrorMsg('La hora de cierre debe ser posterior a la hora de apertura.');
      } else {
        setErrorMsg(
          typeof error === 'string' ? error : error?.message || 'Ocurrió un error al registrar el comercio.'
        );
      }
    }
  };

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
        'confirmPassword',
        'national_id',

        // ✅ NUEVOS: datos del responsable
        'address',
        'city',
        'country',
        'postal_code_employee',
      ]);

      if (isEmailBusy || isNationalIdBusy || isPhoneBusy) {
        isStepValid = false;
      }
    } else {
      isStepValid = true;
    }

    if (isStepValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  // ======= Carga de categorías =======
  const [commerce_categories, setCommerceCategories] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/api/commerceCategory`);
        const data = await response.json();
        setCommerceCategories(data || []);
      } catch (error) {
        console.error('Error fetching commerce categories:', error);
      }
    })();
  }, []);

  const renderFormStep = () => {
    if (step === 0) {
      const selectedDays = watch('available_days') || [];

      return (
        <Stack spacing={2.5}>
          <RHFTextField
            name="name"
            label="Nombre del comercio"
            inputProps={{ maxLength: 100 }}
          />

          <RHFTextField
            name="commerce_national_id"
            label="CUIT/CUIL del comercio"
            helperText={errors.commerce_national_id?.message || 'Sólo números, sin puntos ni guiones'}
            inputProps={{
              maxLength: 11,
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
          />

          <RHFTextField select name="commerce_category_id" SelectProps={{ native: true }} fullWidth>
            <option value="">Seleccioná una categoría</option>
            {commerce_categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </RHFTextField>

          <RHFTextField
            name="street_name"
            label="Dirección"
            inputProps={{ maxLength: 50 }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <RHFTextField
              name="number"
              label="Altura"
              inputProps={{ maxLength: 6 }}
            />
            <RHFTextField name="postal_code" label="Código Postal" inputProps={{ maxLength: 6 }} />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TimePicker
              name="open_at"
              label="Horario de apertura"
              value={openAt}
              ampm={false}
              onChange={(newValue) => {
                setOpenAt(newValue);
                setValue('open_at', newValue, { shouldValidate: true });
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                  error: !!errors.open_at,
                  helperText: errors.open_at?.message,
                },
              }}
            />
            <TimePicker
              name="close_at"
              label="Horario de cierre"
              value={closeAt}
              ampm={false}
              onChange={(newValue) => {
                setCloseAt(newValue);
                setValue('close_at', newValue, { shouldValidate: true });
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                  error: !!errors.close_at,
                  helperText: errors.close_at?.message,
                },
              }}
            />
          </Stack>

          <Typography variant="subtitle2">Días disponibles</Typography>
          <Grid container spacing={1}>
            {daysOfWeek.map((day) => (
              <Grid item xs={12} sm={4} key={day.value}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="available_days"
                      checked={selectedDays.includes(day.value)}
                      onChange={(event) => {
                        const current = selectedDays;
                        let newValue;

                        if (event.target.checked) {
                          newValue = [...current, day.value];
                        } else {
                          newValue = current.filter((v) => v !== day.value);
                        }

                        setValue('available_days', newValue, { shouldValidate: true });
                      }}
                    />
                  }
                  label={day.label}
                />
              </Grid>
            ))}
          </Grid>
          {errors.available_days && (
            <Typography variant="caption" color="error">
              {errors.available_days.message}
            </Typography>
          )}
        </Stack>
      );
    }

    if (step === 1) {
      return (
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <RHFTextField
              name="first_name"
              label="Nombre del responsable"
              inputProps={{ maxLength: 30 }}
            />
            <RHFTextField
              name="last_name"
              label="Apellido del responsable"
              inputProps={{ maxLength: 30 }}
              />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <RHFAutocomplete
              name="country"
              type="country"
              label="País del responsable"
              placeholder="Elegí un país"
              fullWidth
              options={countries.map((option) => option.label)}
              getOptionLabel={(option) => option}
            />
            <RHFTextField name="city" label="Ciudad del responsable" placeholder="Ej: Córdoba" inputProps={{ maxLength: 30 }} />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <RHFTextField name="address" label="Dirección del responsable" placeholder="Calle y número" inputProps={{ maxLength: 50 }} />
            <RHFTextField name="postal_code_employee" label="Código Postal del responsable"
              inputProps={{ maxLength: 30 }}
            />
          </Stack>

          <RHFTextField
            name="national_id"
            label="DNI del responsable"
            helperText={nationalIdHelperText()}
            inputProps={{
              maxLength: 8,
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {nationalIdStatus === 'checking' && <CircularProgress size={18} />}
                  {nationalIdStatus === 'exists' && <Iconify icon="solar:danger-bold" width={20} />}
                  {nationalIdStatus === 'available' && (
                    <Iconify icon="solar:check-circle-bold" width={20} />
                  )}
                </InputAdornment>
              ),
            }}
          />

          <RHFTextField
            name="email"
            label="Email del responsable"
            InputProps={{
              endAdornment: <InputAdornment position="end">{emailAdornment()}</InputAdornment>,
            }}
            helperText={emailHelperText()}
          />

          <RHFTextField
            name="phone_number"
            label="Teléfono del responsable"
            helperText={phoneHelperText()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {phoneStatus === 'checking' && <CircularProgress size={18} />}
                  {phoneStatus === 'exists' && <Iconify icon="solar:danger-bold" width={20} />}
                  {phoneStatus === 'available' && (
                    <Iconify icon="solar:check-circle-bold" width={20} />
                  )}
                </InputAdornment>
              ),
            }}
          />

          <RHFTextField
            name="password"
            label="Contraseña"
            type={password.value ? 'text' : 'password'}
            helperText={
              errors.password?.message ||
              'Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo'
            }
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
            label="Confirmar Contraseña"
            type={password.value ? 'text' : 'password'}
            helperText={errors.confirmPassword?.message}
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
    }

    // step === 2 → Logo
    return (
      <Card>
        <CardHeader title={`Subí el logo de tu comercio (máx. ${MAX_IMAGE_SIZE_KB}KB)`} />
        <CardContent>
          <Upload file={file} onDrop={handleDropSingleFile} onDelete={() => setFile(null)} />
          {errors.image_url && (
            <Typography variant="caption" color="error">
              {errors.image_url.message}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
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

      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <div key={`register-step-${step}`}>{renderFormStep()}</div>

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
              disabled={step === 1 && (isEmailBusy || isNationalIdBusy || isPhoneBusy)}
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
              disabled={isEmailBusy || isNationalIdBusy || isPhoneBusy}
            >
              Enviar solicitud
            </LoadingButton>
          )}
        </Stack>
      </FormProvider>

      {loadingScreen && (
        <SplashScreen
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal + 999,
          }}
        />
      )}

      <Typography
        component="div"
        sx={{ mt: 2.5, textAlign: 'center', typography: 'caption', color: 'text.secondary' }}
      >
        {'Al registrarte aceptás los '}
        <Link underline="always" color="text.primary">
          Términos y Condiciones
        </Link>
        {' y la '}
        <Link underline="always" color="text.primary">
          Política de Privacidad
        </Link>
        .
      </Typography>
    </>
  );
}
