import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AIChatProvider } from './context/AIChatContext';
import { ThemeProvider } from './context/ThemeContext';
import { router } from './router';
import './components/ui/ui.css';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AIChatProvider>
          <RouterProvider router={router} />
        </AIChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
