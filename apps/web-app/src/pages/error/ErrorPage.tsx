import { useState } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, Home, RotateCcw, ChevronDown, ChevronUp, FileQuestion } from 'lucide-react';
import './ErrorPage.css';

export function ErrorPage() {
  const error = useRouteError();
  const [showDetails, setShowDetails] = useState(false);

  let status = 500;
  let title = 'Algo salió mal';
  let message = 'Ha ocurrido un error inesperado en la aplicación.';
  let is404 = false;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (error.status === 404) {
      is404 = true;
      title = 'Página no encontrada';
      message = 'Lo sentimos, la página que estás buscando no existe o ha sido movida.';
    } else {
      title = `Error ${error.status}`;
      message = error.statusText || 'Ha ocurrido un error de servidor.';
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="error-page">
      <div className="error-card">
        <div className="error-icon-container">
          <div className={`error-icon-wrapper ${is404 ? 'warning' : 'danger'}`}>
            {is404 ? <FileQuestion size={48} /> : <AlertTriangle size={48} />}
          </div>
        </div>

        <h1 className="error-title">{title}</h1>
        <p className="error-message">{message}</p>

        {status !== 404 && !!error && (
          <div className="error-details-section">
            <button
              type="button"
              className="error-details-toggle"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span>Detalles técnicos</span>
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showDetails && (
              <pre className="error-details-content">
                {error instanceof Error ? error.stack || error.message : JSON.stringify(error, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="error-actions">
          <button
            type="button"
            className="error-btn secondary"
            onClick={handleReload}
          >
            <RotateCcw size={18} />
            Recargar
          </button>
          
          <Link to="/" className="error-btn primary">
            <Home size={18} />
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
