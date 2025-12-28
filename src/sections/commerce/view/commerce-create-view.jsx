import Container from '@mui/material/Container';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CommerceNewEditForm from '../commerce-new-edit-form';

// ----------------------------------------------------------------------

export default function CommerceCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Agregar nuevo comercio"
        links={[
          {
            name: '',
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <CommerceNewEditForm />
    </Container>
  );
}
