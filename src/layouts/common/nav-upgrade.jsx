import { useState } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';
import { useGetCommerce } from 'src/api/commerce';

import { useSnackbar } from 'src/components/snackbar';
// import { usePopover } from 'src/components/custom-popover';
import { SplashScreen } from 'src/components/loading-screen';
// ----------------------------------------------------------------------

export default function NavUpgrade() {
  const router = useRouter();

  const authUser = useAuthContext();

  const { logout } = useAuthContext();

  const { enqueueSnackbar } = useSnackbar();

  const commerceId =
    authUser.user?.commerce?.id ?? authUser.user?.commerce_id ?? authUser.user?.commerceId ?? null;

  const { commerce } = useGetCommerce(commerceId);

  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      router.replace('/');
    } catch (error) {
      console.error(error);
      setLogoutLoading(false);
      enqueueSnackbar('Unable to logout!', { variant: 'error' });
    }
  };

  const avatarSrc = commerce?.image_url ?? authUser.user?.commerce?.image_url ?? null;
  const avatarAlt = commerce?.name ?? authUser.user?.commerce?.name ?? 'Usuario';
  const avatarFallback = avatarAlt?.charAt(0)?.toUpperCase() ?? authUser.user?.first_name?.charAt(0)?.toUpperCase() ?? '?';

  const commerceName = commerce?.name || authUser.user?.commerce?.name;
  const userName = `${authUser.user?.first_name || ''} ${authUser.user?.last_name || ''}`.trim();

  const AVATAR_SIZE = 40;

  return (
  <>
    <Stack sx={{ px: 2, py: 3, alignItems: 'stretch' }}>
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          p: 1.5,
          mb: 2,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 1,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
          borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
        }}
      >
        <Stack
          spacing={0.75}
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {commerceName && (
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                Comercio
              </Typography>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{ fontWeight: 600, lineHeight: 1.3, color: 'text.primary' }}
              >
                {commerceName}
              </Typography>
            </Box>
          )}
          <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
              Usuario
            </Typography>
            <Typography variant="subtitle2" noWrap sx={{ lineHeight: 1.3, color: 'text.primary' }}>
              {userName || '—'}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            noWrap
            sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {authUser.user?.email}
          </Typography>
        </Stack>

        <Avatar
          src={avatarSrc}
          alt={avatarAlt}
          sx={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            flexShrink: 0,
          }}
        >
          {avatarFallback}
        </Avatar>
      </Paper>

      <Button variant="contained" onClick={handleLogout} fullWidth>
        Cerrar Sesión
      </Button>
    </Stack>

    {logoutLoading && (
      <SplashScreen
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: (theme) => theme.zIndex.modal + 999,
        }}
      />
    )}
  </>
);
}
