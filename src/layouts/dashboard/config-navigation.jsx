import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { ROLE_IDS } from 'src/auth/guard/role-based-guard';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1, color: "#95541B" }} />
  // OR
  // <Iconify icon="fluent:mail-24-filled" />
  // https://icon-sets.iconify.design/solar/
  // https://www.streamlinehq.com/icons
);

const ICONS = {
  job: icon('ic_job'),
  blog: icon('ic_blog'),
  chat: icon('ic_chat'),
  mail: icon('ic_mail'),
  user: icon('ic_user'),
  file: icon('ic_file'),
  lock: icon('ic_lock'),
  tour: icon('ic_tour'),
  order: icon('ic_order'),
  label: icon('ic_label'),
  blank: icon('ic_blank'),
  kanban: icon('ic_kanban'),
  folder: icon('ic_folder'),
  banking: icon('ic_banking'),
  booking: icon('ic_booking'),
  invoice: icon('ic_invoice'),
  product: icon('ic_product'),
  calendar: icon('ic_calendar'),
  disabled: icon('ic_disabled'),
  external: icon('ic_external'),
  menuItem: icon('ic_menu_item'),
  ecommerce: icon('ic_ecommerce'),
  analytics: icon('ic_analytics'),
  dashboard: icon('ic_dashboard'),
};

// ----------------------------------------------------------------------

/**
 * Permisos de navegación por rol:
 * - Admin (ID 1): Todo
 * - Cocinero (ID 2): Pedidos
 * - Repartidor (ID 3): (sin acceso definido)
 * - Cajero (ID 4): Pedidos, Publicaciones
 * - Supervisor de Ventas (ID 5): Reseñas, Pedidos, Publicaciones, Productos, Estadísticas/Reportes
 * - Propietario (ID 6): Todo lo de su comercio
 */
export function useNavData() {
  const { t } = useTranslate();
  const { user } = useAuthContext();
  
  const roleId = user?.role_id;

  // Helper para verificar si el rol actual tiene acceso a una sección
  const hasAccess = (allowedRoles) => allowedRoles.includes(roleId);

  const data = useMemo(
    () => [
      // OVERVIEW - Reportes/Estadísticas
      // Acceso: Admin, Supervisor de Ventas, Propietario
      // ----------------------------------------------------------------------
      hasAccess([ROLE_IDS.ADMIN, ROLE_IDS.SUPERVISOR_VENTAS, ROLE_IDS.PROPIETARIO]) && {
        subheader: t('general'),
        items: [
          {
            title: t('Reportes'),
            path: paths.dashboard.general.analytics,
            icon: ICONS.analytics,
          },
        ],
      },

      // MANAGEMENT
      // ----------------------------------------------------------------------
      {
        subheader: t('administracion'),
        items: [
          // MI COMERCIO - Solo Propietario
          hasAccess([ROLE_IDS.PROPIETARIO]) && {
            title: t('mi comercio'),
            path: paths.dashboard.commerce.myCommerce,
            icon: ICONS.banking,
          },

          // COMERCIOS - Solo administradores
          hasAccess([ROLE_IDS.ADMIN]) && {
            title: t('comercios'),
            path: paths.dashboard.commerce.root,
            icon: ICONS.folder,
          },

          // USUARIOS - Admin, Propietario
          hasAccess([ROLE_IDS.ADMIN, ROLE_IDS.PROPIETARIO]) && {
            title: t('usuarios'),
            path: paths.dashboard.user.list,
            icon: ICONS.user,
          },

          // PRODUCTOS - Admin, Supervisor de Ventas, Propietario
          hasAccess([ROLE_IDS.ADMIN, ROLE_IDS.SUPERVISOR_VENTAS, ROLE_IDS.PROPIETARIO]) && {
            title: t('productos'),
            path: paths.dashboard.product.root,
            icon: ICONS.menuItem,
          },

          // PUBLICACIONES - Admin, Cajero, Supervisor de Ventas, Propietario
          hasAccess([ROLE_IDS.ADMIN, ROLE_IDS.CAJERO, ROLE_IDS.SUPERVISOR_VENTAS, ROLE_IDS.PROPIETARIO]) && {
            title: t('publicaciones'),
            path: paths.dashboard.publication.root,
            icon: ICONS.ecommerce,
          },

          // PEDIDOS - Admin, Cocinero, Cajero, Supervisor de Ventas, Propietario
          hasAccess([ROLE_IDS.ADMIN, ROLE_IDS.COCINERO, ROLE_IDS.CAJERO, ROLE_IDS.SUPERVISOR_VENTAS, ROLE_IDS.PROPIETARIO]) && {
            title: t('pedidos'),
            path: paths.dashboard.order.root,
            icon: ICONS.order,
          },

          // RESEÑAS - Admin, Supervisor de Ventas, Propietario
          hasAccess([ROLE_IDS.ADMIN, ROLE_IDS.SUPERVISOR_VENTAS, ROLE_IDS.PROPIETARIO]) && {
            title: t('reseñas'),
            path: paths.dashboard.reviews,
            icon: ICONS.chat,
          },

          // SUSCRIPCIONES - Admin, Propietario
          hasAccess([ROLE_IDS.ADMIN, ROLE_IDS.PROPIETARIO]) && {
            title: t('suscripciones'),
            path: paths.dashboard.pricing,
            icon: ICONS.label,
          },
        ].filter(Boolean),
      },
    ].filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, roleId]
  );

  return data;
}
