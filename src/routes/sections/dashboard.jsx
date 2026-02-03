import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import DashboardLayout from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import { ROLE_IDS, AuthGuard, RoleBasedGuard } from 'src/auth/guard';

import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------
// PERMISOS POR SECCIÓN:
// - Admin (1): Todo
// - Cocinero (2): Pedidos
// - Repartidor (3): (sin acceso definido)
// - Cajero (4): Pedidos, Publicaciones
// - Supervisor de Ventas (5): Reseñas, Pedidos, Publicaciones, Productos, Estadísticas/Reportes
// - Propietario (6): Todo lo de su comercio
// ----------------------------------------------------------------------

/**
 * Componente que redirige a la sección inicial apropiada según el rol del usuario
 */
function DashboardRedirect() {
  const navigate = useNavigate();
  const { user, loading } = useAuthContext();
  const roleId = user?.role_id;

  useEffect(() => {
    // Esperar a que el usuario esté cargado
    if (loading || !user) return;

    // Ruta por defecto según el rol
    const getDefaultRoute = () => {
      switch (roleId) {
        case ROLE_IDS.ADMIN:
        case ROLE_IDS.SUPERVISOR_VENTAS:
        case ROLE_IDS.PROPIETARIO:
          return '/dashboard/analytics';
        case ROLE_IDS.COCINERO:
        case ROLE_IDS.CAJERO:
        case ROLE_IDS.REPARTIDOR:
        default:
          return '/dashboard/order';
      }
    };

    navigate(getDefaultRoute(), { replace: true });
  }, [roleId, navigate, loading, user]);

  return <LoadingScreen />;
}

// ----------------------------------------------------------------------
// PRICING
const PricingPage = lazy(() => import('src/pages/pricing'));
// OVERVIEW
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
// PRODUCT
const ProductDetailsPage = lazy(() => import('src/pages/dashboard/product/details'));
const ProductListPage = lazy(() => import('src/pages/dashboard/product/list'));
const ProductCreatePage = lazy(() => import('src/pages/dashboard/product/new'));
const ProductEditPage = lazy(() => import('src/pages/dashboard/product/edit'));
// COMMERCE
const CommerceDetailsPage = lazy(() => import('src/pages/dashboard/commerce/details'));
const CommerceListPage = lazy(() => import('src/pages/dashboard/commerce/list'));
const CommerceCreatePage = lazy(() => import('src/pages/dashboard/commerce/new'));
const CommerceEditPage = lazy(() => import('src/pages/dashboard/commerce/edit'));
const MyCommercePage = lazy(() => import('src/pages/dashboard/commerce/my-commerce'));
// PUBLICATION
const PublicationDetailsPage = lazy(() => import('src/pages/dashboard/publication/details'));
const PublicationListPage = lazy(() => import('src/pages/dashboard/publication/list'));
const PublicationCreatePage = lazy(() => import('src/pages/dashboard/publication/new'));
const PublicationEditPage = lazy(() => import('src/pages/dashboard/publication/edit'));
// ORDER
const OrderListPage = lazy(() => import('src/pages/dashboard/order/list'));
const OrderDetailsPage = lazy(() => import('src/pages/dashboard/order/details'));
// USER
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserAccountPage = lazy(() => import('src/pages/dashboard/user/account'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
// REVIEWS
const ReviewsPage = lazy(() => import('src/pages/reviews'));

// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      // Redirige automáticamente a la sección correcta según el rol del usuario
      {
        element: <DashboardRedirect />,
        index: true
      },

      // ANALYTICS/REPORTES - Admin, Supervisor de Ventas, Propietario
      {
        path: 'analytics',
        element: (
          <RoleBasedGuard allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.SUPERVISOR_VENTAS, ROLE_IDS.PROPIETARIO]} hasContent>
            <OverviewAnalyticsPage />
          </RoleBasedGuard>
        )
      },

      // USUARIOS - Admin, Propietario
      {
        path: 'user',
        element: (
          <RoleBasedGuard allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.PROPIETARIO]} hasContent>
            <Outlet />
          </RoleBasedGuard>
        ),
        children: [
          { element: <UserListPage />, index: true },
          { path: 'list', element: <UserListPage /> },
          { path: 'new', element: <UserCreatePage /> },
          { path: ':id/edit', element: <UserEditPage /> },
          { path: 'account', element: <UserAccountPage /> },
        ],
      },

      // RESEÑAS - Admin, Supervisor de Ventas, Propietario
      {
        path: 'reviews',
        element: (
          <RoleBasedGuard allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.SUPERVISOR_VENTAS, ROLE_IDS.PROPIETARIO]} hasContent>
            <ReviewsPage />
          </RoleBasedGuard>
        )
      },

      // PRODUCTOS - Admin, Supervisor de Ventas, Propietario
      {
        path: 'product',
        element: (
          <RoleBasedGuard allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.SUPERVISOR_VENTAS, ROLE_IDS.PROPIETARIO]} hasContent>
            <Outlet />
          </RoleBasedGuard>
        ),
        children: [
          { element: <ProductListPage />, index: true },
          { path: 'list', element: <ProductListPage /> },
          { path: ':id', element: <ProductDetailsPage /> },
          { path: 'new', element: <ProductCreatePage /> },
          { path: ':id/edit', element: <ProductEditPage /> },
        ],
      },

      // MI COMERCIO - Solo Propietario
      {
        path: 'my-commerce',
        element: (
          <RoleBasedGuard allowedRoleIds={[ROLE_IDS.PROPIETARIO]} hasContent>
            <MyCommercePage />
          </RoleBasedGuard>
        ),
      },

      // COMERCIOS - Solo Admin
      {
        path: 'commerce',
        element: (
          <RoleBasedGuard allowedRoleIds={[ROLE_IDS.ADMIN]} hasContent>
            <Outlet />
          </RoleBasedGuard>
        ),
        children: [
          { element: <CommerceListPage />, index: true },
          { path: 'list', element: <CommerceListPage /> },
          { path: ':id', element: <CommerceDetailsPage /> },
          { path: 'new', element: <CommerceCreatePage /> },
          { path: ':id/edit', element: <CommerceEditPage /> },
        ],
      },

      // PUBLICACIONES - Admin, Cajero, Supervisor de Ventas, Propietario
      {
        path: 'publication',
        element: (
          <RoleBasedGuard allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.CAJERO, ROLE_IDS.SUPERVISOR_VENTAS, ROLE_IDS.PROPIETARIO]} hasContent>
            <Outlet />
          </RoleBasedGuard>
        ),
        children: [
          { element: <PublicationListPage />, index: true },
          { path: 'list', element: <PublicationListPage /> },
          { path: ':id', element: <PublicationDetailsPage /> },
          { path: 'new', element: <PublicationCreatePage /> },
          { path: ':id/edit', element: <PublicationEditPage /> },
        ],
      },

      // PEDIDOS - Admin, Cocinero, Cajero, Supervisor de Ventas, Propietario
      {
        path: 'order',
        element: (
          <RoleBasedGuard allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.COCINERO, ROLE_IDS.CAJERO, ROLE_IDS.SUPERVISOR_VENTAS, ROLE_IDS.PROPIETARIO]} hasContent>
            <Outlet />
          </RoleBasedGuard>
        ),
        children: [
          { element: <OrderListPage />, index: true },
          { path: 'list', element: <OrderListPage /> },
          { path: ':id', element: <OrderDetailsPage /> },
        ],
      },

      // SUSCRIPCIONES/PRICING - Admin, Propietario
      {
        path: 'pricing',
        element: (
          <RoleBasedGuard allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.PROPIETARIO]} hasContent>
            <PricingPage />
          </RoleBasedGuard>
        )
      },
    ],
  },
];
