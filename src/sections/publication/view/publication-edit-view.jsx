import PropTypes from 'prop-types';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useGetPublication } from 'src/api/publications';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import PublicationNewEditForm from '../publication-new-edit-form';

// ----------------------------------------------------------------------

export default function PublicationEditView({ id }) {
  const settings = useSettingsContext();

  const { publication: currentPublication } = useGetPublication(id);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Editar publicacion"
        links={[
          { name: 'Incio', href: paths.dashboard.root },
          {
            name: 'Publicaciones',
            href: paths.dashboard.publication.root,
          },
          { name: currentPublication?.name },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <PublicationNewEditForm currentPublication={currentPublication} />
    </Container>
  );
}

PublicationEditView.propTypes = {
  id: PropTypes.string,
};
