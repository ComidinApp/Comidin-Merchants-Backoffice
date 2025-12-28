import { useAuthContext } from 'src/auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

/**
 * Hook para verificar permisos del usuario actual.
 *
 * Roles conocidos:
 * - role_id = 1: Admin (acceso total)
 * - role_id = 2: Supervisor
 * - role_id = 3: Delivery
 * - role_id = 6: Usuario recién registrado
 *
 * @returns {Object} Objeto con flags de permisos
 */
export function usePermissions() {
  const { user } = useAuthContext();

  const roleId = user?.role_id;

  return {
    // Identificación de rol
    roleId,
    isAdmin: roleId === 1,
    isSupervisor: roleId === 2,
    isDelivery: roleId === 3,

    // Permisos específicos por funcionalidad
    canManageCommerces: roleId === 1,
    canManageReviews: roleId === 1,
    canManageAllUsers: roleId === 1,
    canManageCommerceUsers: [1, 2].includes(roleId), // admin y supervisor

    // Helper para verificar múltiples roles
    hasRole: (allowedRoles) => allowedRoles.includes(roleId),
  };
}

