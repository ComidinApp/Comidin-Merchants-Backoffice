import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const _carouselsMembers = [
  { id: 1, name: 'Lautaro Clever Cargnelutti', role: 'Front-End Developer', avatarUrl: '' },
  { id: 2, name: 'Florencia Farace', role: 'UX/UI & Front-End Developer', avatarUrl: '' },
  { id: 3, name: 'Francisco Somoza', role: 'QA & Back-End Developer', avatarUrl: '' },
  { id: 4, name: 'Juan Pablo Donalisio', role: 'Back-End Developer', avatarUrl: '' },
];

// ----------------------------------------------------------------------

export const _faqs = [
  {
    id: _mock.id(0),
    value: 'panel1',
    heading: '¿Cómo empiezo a vender?',
    detail: _mock.description(0),
  },
  {
    id: _mock.id(1),
    value: 'panel2',
    heading: '¿Se cobra comisión por cada pedido realizado?',
    detail: _mock.description(1),
  },
  {
    id: _mock.id(2),
    value: 'panel3',
    heading: '¿A qué tipo de comercios está destinado?',
    detail: _mock.description(2),
  },
  {
    id: _mock.id(3),
    value: 'panel4',
    heading: '¿Puedo devolver un pedido?',
    detail: _mock.description(3),
  },
  {
    id: _mock.id(4),
    value: 'panel5',
    heading: '¿Qué métodos de pago aceptan?',
    detail: _mock.description(4),
  },
  {
    id: _mock.id(5),
    value: 'panel6',
    heading: '¿Cómo me registro en la aplicación?',
    detail: _mock.description(5),
  },
  {
    id: _mock.id(6),
    value: 'panel7',
    heading: '¿?',
    detail: _mock.description(6),
  },
  {
    id: _mock.id(7),
    value: 'panel8',
    heading: '¿?',
    detail: _mock.description(7),
  },
]
// ----------------------------------------------------------------------

export const _addressBooks = [...Array(24)].map((_, index) => ({
  id: _mock.id(index),
  primary: index === 0,
  name: _mock.fullName(index),
  email: _mock.email(index + 1),
  fullAddress: _mock.fullAddress(index),
  phoneNumber: _mock.phoneNumber(index),
  company: _mock.companyName(index + 1),
  addressType: index === 0 ? 'Home' : 'Office',
}));

// ----------------------------------------------------------------------

export const _contacts = [...Array(20)].map((_, index) => {
  const status =
    (index % 2 && 'online') || (index % 3 && 'offline') || (index % 4 && 'alway') || 'busy';

  return {
    id: _mock.id(index),
    status,
    role: _mock.role(index),
    email: _mock.email(index),
    name: _mock.fullName(index),
    phoneNumber: _mock.phoneNumber(index),
    lastActivity: _mock.time(index),
    avatarUrl: _mock.image.avatar(index),
    address: _mock.fullAddress(index),
  };
});

// ----------------------------------------------------------------------

export const _notifications = [...Array(9)].map((_, index) => ({
  id: _mock.id(index),
  avatarUrl: [
    _mock.image.avatar(1),
    _mock.image.avatar(2),
    _mock.image.avatar(3),
    _mock.image.avatar(4),
    _mock.image.avatar(5),
    null,
    null,
    null,
    null,
    null,
  ][index],
  type: ['friend', 'project', 'file', 'tags', 'payment', 'order', 'chat', 'mail', 'delivery'][
    index
  ],
  category: [
    'Communication',
    'Project UI',
    'File Manager',
    'File Manager',
    'File Manager',
    'Order',
    'Order',
    'Communication',
    'Communication',
  ][index],
  isUnRead: _mock.boolean(index),
  createdAt: _mock.time(index),
  title:
    (index === 0 && `<p><strong>Deja Brady</strong> sent you a friend request</p>`) ||
    (index === 1 &&
      `<p><strong>Jayvon Hull</strong> mentioned you in <strong><a href='#'>Minimal UI</a></strong></p>`) ||
    (index === 2 &&
      `<p><strong>Lainey Davidson</strong> added file to <strong><a href='#'>File Manager</a></strong></p>`) ||
    (index === 3 &&
      `<p><strong>Angelique Morse</strong> added new tags to <strong><a href='#'>File Manager<a/></strong></p>`) ||
    (index === 4 &&
      `<p><strong>Giana Brandt</strong> request a payment of <strong>$200</strong></p>`) ||
    (index === 5 && `<p>Your order is placed waiting for shipping</p>`) ||
    (index === 6 && `<p>Delivery processing your order is being shipped</p>`) ||
    (index === 7 && `<p>You have new message 5 unread messages</p>`) ||
    (index === 8 && `<p>You have new mail`) ||
    '',
}));

// ----------------------------------------------------------------------

export const _mapContact = [
  {
    latlng: [33, 65],
    address: _mock.fullAddress(1),
    phoneNumber: _mock.phoneNumber(1),
  },
  {
    latlng: [-12.5, 18.5],
    address: _mock.fullAddress(2),
    phoneNumber: _mock.phoneNumber(2),
  },
];

// ----------------------------------------------------------------------

export const _socials = [
  {
    value: 'facebook',
    name: 'FaceBook',
    icon: 'eva:facebook-fill',
    color: '#1877F2',
    path: 'https://www.facebook.com/caitlyn.kerluke',
  },
  {
    value: 'instagram',
    name: 'Instagram',
    icon: 'ant-design:instagram-filled',
    color: '#E02D69',
    path: 'https://www.instagram.com/caitlyn.kerluke',
  },
  {
    value: 'linkedin',
    name: 'Linkedin',
    icon: 'eva:linkedin-fill',
    color: '#007EBB',
    path: 'https://www.linkedin.com/caitlyn.kerluke',
  },
  {
    value: 'twitter',
    name: 'Twitter',
    icon: 'eva:twitter-fill',
    color: '#00AAEC',
    path: 'https://www.twitter.com/caitlyn.kerluke',
  },
];

// ----------------------------------------------------------------------

export const _homePlans = [...Array(3)].map((_, index) => ({
  license: ['Standard', 'Standard Plus', 'Extended'][index],
  commons: ['One end products', '12 months updates', '6 months of support'],
  options: [
    'JavaScript version',
    'TypeScript version',
    'Design Resources',
    'Commercial applications',
  ],
  icons: [
    '/assets/icons/platforms/ic_js.svg',
    '/assets/icons/platforms/ic_ts.svg',
    '/assets/icons/platforms/ic_figma.svg',
  ],
}));

// ----------------------------------------------------------------------

export const _pricingPlans = [
  {
    subscription: 'Básica',
    price: 0,
    caption: 'Perfecto para dar tus primeros pasos y descubrir lo que Comidin tiene para ofrecer.',
    lists: ['Hasta 15 publicaciones disponibles'],
    not_lists: [
      'Capacidad de agregar stock.',
      'Visibilidad de listado de comercios.',
      'Acceso a reportes y estadisticas.',
      'Agregado de empleados y roles.',
    ],
    labelAction: 'Plan Actual',
  },
  {
    subscription: 'Estándar',
    price: 5999.99,
    caption: 'Lleva tu comercio al siguiente nivel con mas herramientas para impulsar tus ventas.',
    lists: [
      'Hasta 35 publicaciones disponibles',
      'Acceso a reportes y estadisticas.',
      'Agregado de empleados y roles.',
    ],
    not_lists: ['Visibilidad de listado de comercios.'],
    labelAction: 'Elegir Estándar',
  },
  {
    subscription: 'Premium',
    price: 13999.99,
    caption:
      'Disfruta las ventajas y maximiza el potencial de tu comercio con nuestra oferta mas completa.',
    lists: [
      'Publicaciones ilimitadas para tu comercio.',
      'Mejor posicionamiento en las busquedas.',
      'Acceso a reportes y estadisticas.',
      'Acceso a promociones exclusivas.',
      'Agregado de empleados y roles.',
    ],
    not_lists: [],
    labelAction: 'Elegi Premium',
  },
];

// ----------------------------------------------------------------------

export const _testimonials = [
  {
    name: _mock.fullName(1),
    postedDate: _mock.time(1),
    ratingNumber: _mock.number.rating(1),
    avatarUrl: _mock.image.avatar(1),
    content: `Excellent Work! Thanks a lot!`,
  },
  {
    name: _mock.fullName(2),
    postedDate: _mock.time(2),
    ratingNumber: _mock.number.rating(2),
    avatarUrl: _mock.image.avatar(2),
    content: `It's a very good dashboard and we are really liking the product . We've done some things, like migrate to TS and implementing a react useContext api, to fit our job methodology but the product is one of the best in terms of design and application architecture. The team did a really good job.`,
  },
  {
    name: _mock.fullName(3),
    postedDate: _mock.time(3),
    ratingNumber: _mock.number.rating(3),
    avatarUrl: _mock.image.avatar(3),
    content: `Customer support is realy fast and helpful the desgin of this theme is looks amazing also the code is very clean and readble realy good job !`,
  },
  {
    name: _mock.fullName(4),
    postedDate: _mock.time(4),
    ratingNumber: _mock.number.rating(4),
    avatarUrl: _mock.image.avatar(4),
    content: `Amazing, really good code quality and gives you a lot of examples for implementations.`,
  },
  {
    name: _mock.fullName(5),
    postedDate: _mock.time(5),
    ratingNumber: _mock.number.rating(5),
    avatarUrl: _mock.image.avatar(5),
    content: `Got a few questions after purchasing the product. The owner responded very fast and very helpfull. Overall the code is excellent and works very good. 5/5 stars!`,
  },
  {
    name: _mock.fullName(6),
    postedDate: _mock.time(6),
    ratingNumber: _mock.number.rating(6),
    avatarUrl: _mock.image.avatar(6),
    content: `CEO of Codealy.io here. We’ve built a developer assessment platform that makes sense - tasks are based on git repositories and run in virtual machines. We automate the pain points - storing candidates code, running it and sharing test results with the whole team, remotely. Bought this template as we need to provide an awesome dashboard for our early customers. I am super happy with purchase. The code is just as good as the design. Thanks!`,
  },
];
