import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MascotasPage } from './pages/mascotas/MascotasPage';
import { MascotaDetailPage } from './pages/mascotas/MascotaDetailPage';
import { CitasPage } from './pages/citas/CitasPage';
import { PerfilPage } from './pages/perfil/PerfilPage';
import { ErrorPage } from './pages/error/ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        element: <AuthGuard />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="/dashboard" replace />,
              },
              {
                path: 'dashboard',
                element: <DashboardPage />,
              },
              {
                path: 'mascotas',
                element: <MascotasPage />,
              },
              {
                path: 'mascotas/:id',
                element: <MascotaDetailPage />,
              },
              {
                path: 'citas',
                element: <CitasPage />,
              },
              {
                path: 'perfil',
                element: <PerfilPage />,
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <ErrorPage />,
      },
    ],
  },
]);

