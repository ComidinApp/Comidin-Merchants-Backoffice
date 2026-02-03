import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import { ForbiddenIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

/**
 * Mapeo de role_id numérico a nombre de rol.
 * Ajustar según los roles definidos en el backend (04_roleSeeder.js).
 */
const ROLE_ID_TO_NAME = {
  1: 'admin',           // Administrador - Acceso completo
  2: 'cocinero',        // Cocinero - Solo pedidos
  3: 'repartidor',      // Repartidor
  4: 'cajero',          // Cajero - Pedidos, Publicaciones
  5: 'supervisor_ventas', // Supervisor de Ventas - Reseñas, Pedidos, Publicaciones, Productos, Estadísticas
  6: 'propietario',     // Propietario - Todo lo de su comercio
};

/**
 * IDs de roles para usar en allowedRoleIds
 */
export const ROLE_IDS = {
  ADMIN: 1,
  COCINERO: 2,
  REPARTIDOR: 3,
  CAJERO: 4,
  SUPERVISOR_VENTAS: 5,
  PROPIETARIO: 6,
};

// ----------------------------------------------------------------------

/**
 * Guard que protege contenido basado en roles.
 *
 * @param {Object} props
 * @param {string[]} props.roles - Array de nombres de roles permitidos (ej: ['admin', 'supervisor'])
 * @param {number[]} props.allowedRoleIds - Alternativa: Array de role_ids permitidos (ej: [1, 2])
 * @param {boolean} props.hasContent - Si es true, muestra mensaje de "Acceso Denegado"
 * @param {React.ReactNode} props.children - Contenido a proteger
 * @param {Object} props.sx - Estilos adicionales para el container de error
 */
export default function RoleBasedGuard({ hasContent, roles, allowedRoleIds, children, sx }) {
  const { user } = useAuthContext();

  const currentRoleId = user?.role_id;
  const currentRoleName = ROLE_ID_TO_NAME[currentRoleId] || 'unknown';

  // Verificar acceso por role_id numérico (preferido)
  if (typeof allowedRoleIds !== 'undefined' && !allowedRoleIds.includes(currentRoleId)) {
    return renderAccessDenied(hasContent, sx);
  }

  // Verificar acceso por nombre de rol
  if (typeof roles !== 'undefined' && !roles.includes(currentRoleName)) {
    return renderAccessDenied(hasContent, sx);
  }

  return <> {children} </>;
}

// ----------------------------------------------------------------------

function renderAccessDenied(hasContent, sx) {
  if (!hasContent) return null;

  return (
    <Container component={MotionContainer} sx={{ textAlign: 'center', ...sx }}>
      <m.div variants={varBounce().in}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Acceso Denegado
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <Typography sx={{ color: 'text.secondary' }}>
          No tienes permisos para acceder a esta página
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <ForbiddenIllustration
          sx={{
            height: 260,
            my: { xs: 5, sm: 10 },
          }}
        />
      </m.div>
    </Container>
  );
}

// ----------------------------------------------------------------------

RoleBasedGuard.propTypes = {
  children: PropTypes.node,
  hasContent: PropTypes.bool,
  roles: PropTypes.arrayOf(PropTypes.string),
  allowedRoleIds: PropTypes.arrayOf(PropTypes.number),
  sx: PropTypes.object,
};
