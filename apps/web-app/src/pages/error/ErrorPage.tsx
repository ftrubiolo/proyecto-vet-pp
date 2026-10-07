import { useState } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, Home, RotateCcw, ChevronDown, ChevronUp, FileQuestion } from 'lucide-react';
import { Button } from '../../components/ui/Button';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] font-sans">
      <div className="w-full max-w-md p-8 rounded-3xl bg-[var(--surface-solid)] border border-[var(--border)] shadow-2xl backdrop-blur-xl text-center space-y-4 animate-fade-in text-[var(--text)]">
        <div className="flex justify-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
              is404
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-red-500/10 text-red-500'
            }`}
          >
            {is404 ? <FileQuestion size={36} /> : <AlertTriangle size={36} />}
          </div>
        </div>

        <h1 className="font-heading font-bold text-2xl text-[var(--text-h)]">
          {title}
        </h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {message}
        </p>

        {status !== 404 && !!error && (
          <div className="text-left rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-3 space-y-2">
            <button
              type="button"
              className="flex items-center justify-between w-full text-xs font-semibold text-[var(--text-h)] cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span>Detalles técnicos</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDetails && (
              <pre className="text-[11px] font-mono text-[var(--text)] overflow-x-auto p-2 bg-[var(--surface-solid)] rounded-xl max-h-48 whitespace-pre-wrap">
                {error instanceof Error
                  ? error.stack || error.message
                  : JSON.stringify(error, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-4">
          <Button variant="secondary" onClick={handleReload}>
            <RotateCcw size={16} />
            <span>Recargar</span>
          </Button>

          <Link to="/">
            <Button>
              <Home size={16} />
              <span>Ir al Inicio</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
