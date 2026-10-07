import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AIChatProvider } from './context/AIChatContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { router } from './router';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AIChatProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </AIChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
