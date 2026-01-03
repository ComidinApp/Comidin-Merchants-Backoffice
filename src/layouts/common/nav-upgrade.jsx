import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { useMockedUser } from 'src/hooks/use-mocked-user';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import { useSnackbar } from 'src/components/snackbar';
// import { usePopover } from 'src/components/custom-popover';
import { SplashScreen } from 'src/components/loading-screen';
// ----------------------------------------------------------------------

export default function NavUpgrade() {
  const router = useRouter();

  const { user } = useMockedUser();

  const authUser = useAuthContext();

  const { logout } = useAuthContext();

  const { enqueueSnackbar } = useSnackbar();

  // const popover = usePopover();

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

  return (
  <>
    <Stack
      sx={{
        px: 2,
        py: 5,
        textAlign: 'center',
      }}
    >
      <Stack alignItems="center">
        <Box sx={{ position: 'relative' }}>
          <Avatar src={user?.photoURL} alt={user?.displayName} sx={{ width: 48, height: 48 }}>
            {user?.displayName?.charAt(0).toUpperCase()}
          </Avatar>

          <Label
            color="success"
            variant="filled"
            sx={{
              top: -6,
              px: 0.5,
              left: 40,
              height: 20,
              position: 'absolute',
              borderBottomLeftRadius: 2,
            }}
          >
            Hola!
          </Label>
        </Box>

        <Stack spacing={0.5} sx={{ mb: 2, mt: 1.5, width: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {`${authUser.user?.first_name} ${authUser.user?.last_name}`}
          </Typography>

          <Typography variant="body2" noWrap sx={{ color: 'text.disabled' }}>
            {authUser.user?.email}
          </Typography>
        </Stack>

        <Button variant="contained" onClick={handleLogout}>
          Cerrar Sesión
        </Button>
      </Stack>
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
