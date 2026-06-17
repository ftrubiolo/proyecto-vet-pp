import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AIChatProvider } from './context/AIChatContext';
import { router } from './router';
import './components/ui/ui.css';

export default function App() {
  return (
    <AuthProvider>
      <AIChatProvider>
        <RouterProvider router={router} />
      </AIChatProvider>
    </AuthProvider>
  );
}
