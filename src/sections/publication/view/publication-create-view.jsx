import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import PublicationNewEditForm from '../publication-new-edit-form';

// ----------------------------------------------------------------------

export default function PublicationCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Create a new publication"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Publication',
            href: paths.dashboard.publication.root,
          },
          { name: 'New publication' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <PublicationNewEditForm />
    </Container>
  );
}
