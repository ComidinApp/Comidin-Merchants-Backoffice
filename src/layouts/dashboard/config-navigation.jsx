import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
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

export function useNavData() {
  const { t } = useTranslate();
  const user = useAuthContext();

  const data = useMemo(
    () => [
      // OVERVIEW
      // ----------------------------------------------------------------------
      {
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
          // MI COMERCIO - Supervisores y admins
          [1, 2].includes(user?.user?.role_id) && {
            title: t('mi comercio'),
            path: paths.dashboard.commerce.myCommerce,
            icon: ICONS.banking,
          },

          // COMERCIOS - Solo administradores
          user?.user?.role_id === 1 && {
            title: t('comercios'),
            path: paths.dashboard.commerce.root,
            icon: ICONS.folder,
          },

          // USER
          {
            title: t('usuarios'),
            path: paths.dashboard.user.list,
            icon: ICONS.user,
          },

          // PRODUCT
          {
            title: t('productos'),
            path: paths.dashboard.product.root,
            icon: ICONS.menuItem,
          },

          // Publications
          {
            title: t('publicaciones'),
            path: paths.dashboard.publication.root,
            icon: ICONS.ecommerce,
          },

          // ORDER
          {
            title: t('pedidos'),
            path: paths.dashboard.order.root,
            icon: ICONS.order,
          },

          // RESEÑAS - Todos pueden ver (la página maneja qué muestra a cada rol)
          {
            title: t('reseñas'),
            path: paths.dashboard.reviews,
            icon: ICONS.chat,
          },

          // SUBCRIPCIONES
          {
            title: t('suscripciones'),
            path: paths.dashboard.pricing,
            icon: ICONS.label,
          },
        ].filter(Boolean),
      },
    ],
    [t, user]
  );

  return data;
}
