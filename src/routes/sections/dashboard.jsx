import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import DashboardLayout from 'src/layouts/dashboard';
import { AuthGuard, RoleBasedGuard } from 'src/auth/guard';

import { LoadingScreen } from 'src/components/loading-screen';

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
      { element: <OverviewAnalyticsPage />, index: true },
      { path: 'analytics', element: <OverviewAnalyticsPage /> },
      {
        path: 'user',
        children: [
          { element: <UserListPage />, index: true },
          { path: 'list', element: <UserListPage /> },
          { path: 'new', element: <UserCreatePage /> },
          { path: ':id/edit', element: <UserEditPage /> },
          { path: 'account', element: <UserAccountPage /> },
        ],
      },
      // RESEÑAS - Todos pueden ver, la página maneja internamente qué muestra
      { path: 'reviews', element: <ReviewsPage /> },
      {
        path: 'product',
        children: [
          { element: <ProductListPage />, index: true },
          { path: 'list', element: <ProductListPage /> },
          { path: ':id', element: <ProductDetailsPage /> },
          { path: 'new', element: <ProductCreatePage /> },
          { path: ':id/edit', element: <ProductEditPage /> },
        ],
      },
      // MI COMERCIO - Supervisores y admins (role_id = 1, 2)
      {
        path: 'my-commerce',
        element: (
          <RoleBasedGuard allowedRoleIds={[1, 2]} hasContent>
            <MyCommercePage />
          </RoleBasedGuard>
        ),
      },
      // COMERCIOS - Solo administradores (role_id = 1)
      {
        path: 'commerce',
        element: (
          <RoleBasedGuard allowedRoleIds={[1]} hasContent>
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
      {
        path: 'publication',
        children: [
          { element: <PublicationListPage />, index: true },
          { path: 'list', element: <PublicationListPage /> },
          { path: ':id', element: <PublicationDetailsPage /> },
          { path: 'new', element: <PublicationCreatePage /> },
          { path: ':id/edit', element: <PublicationEditPage /> },
        ],
      },
      {
        path: 'order',
        children: [
          { element: <OrderListPage />, index: true },
          { path: 'list', element: <OrderListPage /> },
          { path: ':id', element: <OrderDetailsPage /> },
        ],
      },
      { path: 'pricing', element: <PricingPage /> },
    ],
  },
];
