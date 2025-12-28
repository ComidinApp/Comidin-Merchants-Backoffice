import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';

import { useMockedUser } from 'src/hooks/use-mocked-user';

import { _appFeatured } from 'src/_mock';
import { SeoIllustration } from 'src/assets/illustrations';

import { useSettingsContext } from 'src/components/settings';

import AppWelcome from '../app-welcome';
import AppFeatured from '../app-featured';

// ----------------------------------------------------------------------

export default function OverviewAppView() {
  const { user } = useMockedUser();

  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <AppWelcome
            title={`Bienvenido 👋 \n ${user?.displayName}`}
            description="¿Qué vas a vender hoy? Hay muchos clientes esperando por tus productos."
            img={<SeoIllustration />}
            action={
              <Button variant="contained" color="primary">
                Ir
              </Button>
            }
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppFeatured list={_appFeatured} />
        </Grid>
      </Grid>
    </Container>
  );
}
