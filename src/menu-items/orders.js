// assets
import { IconTypography, IconPalette, IconShadow, IconWindmill } from '@tabler/icons-react';

// constant
const icons = {
  IconTypography,
  IconPalette,
  IconShadow,
  IconWindmill
};

// ==============================|| ORDERS MENU ITEMS ||============================== //

const orders = {
  id: 'utilities',
  title: 'Ordenes',
  type: 'group',
  children: [
    {
      id: 'util-typography',
      title: 'Historial de ordenes',
      type: 'item',
      url: '/utils/util-typography',
      icon: icons.IconTypography,
      breadcrumbs: false
    },
    {
      id: 'util-color',
      title: 'Ordenes en curso',
      type: 'item',
      url: '/utils/util-color',
      icon: icons.IconPalette,
      breadcrumbs: false
    }
  ]
};

export default orders;
