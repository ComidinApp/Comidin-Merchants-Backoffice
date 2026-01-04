import PropTypes from 'prop-types';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useGetCommerce } from 'src/api/commerce';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CommerceNewEditForm from '../commerce-new-edit-form';

// ----------------------------------------------------------------------

export default function CommerceEditView({ id }) {
  const settings = useSettingsContext();

  const { commerce: currentCommerce } = useGetCommerce(id);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Editar comercio"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Comercios',
            href: paths.dashboard.commerce.root,
          },
          { name: currentCommerce?.name },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <CommerceNewEditForm currentCommerce={currentCommerce} />
    </Container>
  );
}

CommerceEditView.propTypes = {
  id: PropTypes.string,
};
