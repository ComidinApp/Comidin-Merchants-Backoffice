import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import UserNewEditForm from '../user-new-edit-form';
// ----------------------------------------------------------------------
const { VITE_API_COMIDIN } = import.meta.env;
export default function UserEditView({ id }) {
  const settings = useSettingsContext();

  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/employee/${id}`);
        const data = await response.json();
        console.log(data);
        setEmployee(data || null);
      } catch (error) {
        console.error('Error fetching employee:', error);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const currentUser = employee;

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Editar usuario"
        links={[
          {
            name: 'Inicio',
            href: paths.dashboard.root,
          },
          {
            name: 'Usuario',
            href: paths.dashboard.user.root,
          },
          { name: currentUser?.first_name || 'Cargando...' }, // Manejar el caso en que no haya un currentUser
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      {currentUser ? (
        <UserNewEditForm currentUser={currentUser} />
      ) : (
        <p>Cargando datos del usuario...</p> // Mostrar mensaje de carga si no hay datos
      )}
    </Container>
  );
}

UserEditView.propTypes = {
  id: PropTypes.string.isRequired, // Cambiado a isRequired si id es obligatorio
};
