import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuthContext } from 'src/auth/hooks';
import { useGetCommerce } from 'src/api/commerce';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CommerceNewEditForm from '../commerce-new-edit-form';

// ----------------------------------------------------------------------

export default function MyCommerceView() {
  const settings = useSettingsContext();
  const { user } = useAuthContext();

  // Obtener el commerce_id del usuario logueado
  const commerceId = user?.commerce?.id ?? user?.commerce_id ?? user?.commerceId ?? null;

  const { commerce, commerceLoading, commerceError } = useGetCommerce(commerceId);

  // Si no tiene comercio asociado
  if (!commerceId) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Mi Comercio"
          links={[{ name: '' }]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No tienes un comercio asociado a tu cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Contacta al administrador para que te asigne un comercio
          </Typography>
        </Box>
      </Container>
    );
  }

  // Loading
  if (commerceLoading) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Mi Comercio"
          links={[{ name: '' }]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error
  if (commerceError) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Mi Comercio"
          links={[{ name: '' }]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
          }}
        >
          <Typography variant="h6" color="error">
            Error al cargar los datos del comercio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {commerceError?.message || 'Intenta nuevamente más tarde'}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Mi Comercio"
        links={[{ name: '' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CommerceNewEditForm currentCommerce={commerce} isMyCommerce />
    </Container>
  );
}

