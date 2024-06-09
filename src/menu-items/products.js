// assets
import { IconTypography, IconPalette, IconShadow, IconWindmill } from '@tabler/icons-react';

// constant
const icons = {
  IconTypography,
  IconPalette,
  IconShadow,
  IconWindmill
};

// ==============================|| PRODUCTS MENU ITEMS ||============================== //

const products = {
  id: 'utilities',
  title: 'Productos',
  type: 'group',
  children: [
    {
      id: 'util-typography',
      title: 'Productos',
      type: 'item',
      url: '/utils/util-typography',
      icon: icons.IconTypography,
      breadcrumbs: false
    }
  ]
};

export default products;
