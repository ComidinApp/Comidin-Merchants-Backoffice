// assets
import { IconTypography, IconPalette, IconShadow, IconWindmill } from '@tabler/icons-react';

// constant
const icons = {
  IconTypography,
  IconPalette,
  IconShadow,
  IconWindmill
};

// ==============================|| SETTINGS MENU ITEMS ||============================== //

const settings = {
  id: 'utilities',
  title: 'Configuraciones',
  type: 'group',
  children: [
    {
      id: 'util-typography',
      title: 'Perfil del comercio',
      type: 'item',
      url: '/utils/util-typography',
      icon: icons.IconTypography,
      breadcrumbs: false
    },
    {
        id: 'util-typography',
        title: 'Suscripcion',
        type: 'item',
        url: '/utils/util-typography',
        icon: icons.IconTypography,
        breadcrumbs: false
    },
    {
        id: 'util-typography',
        title: 'Ayuda',
        type: 'item',
        url: '/utils/util-typography',
        icon: icons.IconTypography,
        breadcrumbs: false
    }
  ]
};

export default settings;
