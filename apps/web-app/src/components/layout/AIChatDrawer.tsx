import { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Send, PawPrint, X, Plus, FileDown } from 'lucide-react';
import { useAIChat } from '../../hooks/useAIChat';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/useToast';
import { api } from '../../api/client';
import { downloadPdf } from '../../utils/download';
import { cn } from '../../utils/cn';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  technicalError?: string;
}

interface Tab {
  id: string;
  name: string;
  messages: Message[];
  suggestions: string[];
}

let messageIdCounter = 0;
function generateMessageId(): string {
  return `${Date.now()}-${messageIdCounter++}`;
}

let tabIdCounter = 0;
function generateTabId(): string {
  return `chat-${Date.now()}-${tabIdCounter++}`;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateSuggestions(tabId: string, isVet: boolean, petName?: string): string[] {
  if (tabId.startsWith('pet-') && petName) {
    const pool = isVet
      ? [
          `Resumir el historial de ${petName}`,
          `¿Qué tratamientos activos tiene ${petName}?`,
          `¿${petName} tiene alergias o contraindicaciones?`,
          `¿Quién es el dueño de ${petName}?`,
          `Últimas 3 consultas de ${petName}`,
          `¿Qué vacunas le faltan a ${petName}?`,
          `Mostrar disponibilidad para turno de ${petName}`,
          `¿Está tomando algún medicamento ${petName}?`,
          `¿Próximo refuerzo de ${petName}?`,
          `Mostrar cartilla de vacunación de ${petName}`,
        ]
      : [
          `¿Cuándo le toca el próximo refuerzo de vacuna a ${petName}?`,
          `Explicar los diagnósticos de ${petName} en palabras simples`,
          `¿Qué tratamientos activos tiene ${petName}?`,
          `Últimas consultas de ${petName}`,
        ];
    return pickRandom(pool, 3);
  }

  const pool = isVet
    ? [
        '¿Qué citas tengo hoy?',
        '¿Pacientes con vacunas atrasadas?',
        'Mostrar disponibilidad para mañana',
        'Resumir el historial de consultas médicas',
        'Buscar paciente por nombre',
        '¿Qué pacientes toman Cefalexina?',
        '¿Quién es el dueño de esta mascota?',
        'Mostrar tratamientos activos',
        '¿Qué pacientes tienen alergias registradas?',
        'Buscar medicamento en vademécum',
      ]
    : [
        '¿Cuándo le toca el próximo refuerzo de vacuna?',
        'Explicar los diagnósticos recientes en palabras simples',
        'Mi mascota está vomitando y decaída, ¿es urgente? (Triaje)',
        '¿Qué tratamientos activos tiene mi mascota?',
      ];
  return pickRandom(pool, 3);
}

export function AIChatDrawer() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAIChatOpen, setIsAIChatOpen, activeMascotaId } = useAIChat();

  const storageKey = user?.id ? `vetvault_ai_chat_tabs_${user.id}` : 'vetvault_ai_chat_tabs_guest';

  // Load tabs from localStorage or initialize with 'general'
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: any) => ({
            id: t.id,
            name: t.name,
            messages: t.messages || [],
            suggestions: [],
          }));
        }
      } catch {
        // Fallback to default if JSON is corrupt
      }
    }
    return [{ id: 'general', name: 'General', messages: [], suggestions: [] as string[] }];
  });

  const [activeTabId, setActiveTabId] = useState<string>('general');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [isDownloadingMsg, setIsDownloadingMsg] = useState<string | null>(null);

  const handleDownloadMessagePdf = async (msg: Message) => {
    setIsDownloadingMsg(msg.id);
    try {
      const activeTab = tabs.find((t) => t.id === activeTabId);
      const title = activeTab ? activeTab.name : 'Consulta de Copiloto';
      await downloadPdf('/ai/pdf', `copiloto-${Date.now()}.pdf`, {
        method: 'POST',
        body: { title, content: msg.text },
      });
    } catch (error) {
      console.error(error);
      toast.error('No se pudo descargar el PDF del mensaje.');
    } finally {
      setIsDownloadingMsg(null);
    }
  };

  const handleStartRename = (tabId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabId(tabId);
    setEditingText(currentName);
  };

  const handleFinishRename = () => {
    if (editingTabId) {
      const trimmed = editingText.trim();
      if (trimmed.length > 0) {
        setTabs((prev) =>
          prev.map((t) => (t.id === editingTabId ? { ...t, name: trimmed } : t))
        );
      }
      setEditingTabId(null);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const isVet = user?.rol === 'Veterinario';

  // Fetch pet details if activeMascotaId is set in global context
  const { data: activePet } = useFetch<any>(
    activeMascotaId ? `/mascotas/${activeMascotaId}` : null
  );

  // Sync tabs with viewed pet detail page
  useEffect(() => {
    if (activeMascotaId && activePet) {
      const tabId = `pet-${activeMascotaId}`;
      const timer = setTimeout(() => {
        setTabs((prevTabs) => {
          const exists = prevTabs.some((t) => t.id === tabId);
          if (exists) return prevTabs;

          const updated = [...prevTabs];
          // Limit to 15 tabs max, pruning oldest custom tab (excluding general)
          if (updated.length >= 15) {
            const idxToRemove = updated.findIndex((t) => t.id !== 'general');
            if (idxToRemove !== -1) {
              updated.splice(idxToRemove, 1);
            }
          }

          return [
            ...updated,
            {
              id: tabId,
              name: `${activePet.nombre}`,
              messages: [],
              suggestions: generateSuggestions(tabId, isVet, activePet.nombre),
            },
          ];
        });
        setActiveTabId(tabId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeMascotaId, activePet, isVet]);

  // Persist tabs to localStorage (strip suggestions to get fresh ones each session)
  useEffect(() => {
    const toSave = tabs.map(({ id, name, messages }) => ({ id, name, messages }));
    localStorage.setItem(storageKey, JSON.stringify(toSave));
  }, [tabs, storageKey]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tabs, activeTabId, isLoading]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isAIChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isAIChatOpen]);

  // Click outside drawer to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isAIChatOpen) return;
      const target = event.target as HTMLElement;
      if (
        drawerRef.current &&
        !drawerRef.current.contains(target) &&
        !target.closest('.ai-btn')
      ) {
        setIsAIChatOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAIChatOpen, setIsAIChatOpen]);

  const handleCreateNewTab = () => {
    const newTabId = generateTabId();
    setTabs((prev) => {
      const updated = [...prev];
      // Limit to 15 tabs max, pruning oldest custom tab (excluding general)
      if (updated.length >= 15) {
        const idxToRemove = updated.findIndex((t) => t.id !== 'general');
        if (idxToRemove !== -1) {
          updated.splice(idxToRemove, 1);
        }
      }
      const newTabName = `Consulta ${updated.length}`;
      return [
        ...updated,
        {
          id: newTabId,
          name: newTabName,
          messages: [],
          suggestions: generateSuggestions(newTabId, isVet),
        },
      ];
    });
    setActiveTabId(newTabId);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      sender: 'user',
      text: textToSend,
    };

    const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
    const updatedMessages = [...currentTab.messages, userMessage];

    // Optimistically update active tab messages
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, messages: updatedMessages } : t))
    );
    setInputValue('');
    setIsLoading(true);

    try {
      const historyPayload = currentTab.messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      // Extract pet context ID if tab is patient-specific
      const petIdContext = activeTabId.startsWith('pet-')
        ? activeTabId.replace('pet-', '')
        : undefined;

      const response = await api.post<{ response: string }>('/ai/chat', {
        message: textToSend,
        history: historyPayload,
        context: petIdContext ? { activeMascotaId: petIdContext } : undefined,
      });

      const aiMessage: Message = {
        id: generateMessageId(),
        sender: 'ai',
        text: response.response,
      };

      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId ? { ...t, messages: [...updatedMessages, aiMessage] } : t
        )
      );
    } catch (err) {
      console.error('AIChatDrawer Error:', err);
      const errorMessage: Message = {
        id: generateMessageId(),
        sender: 'ai',
        text: 'Lo siento, en este momento el copiloto de IA está experimentando una alta demanda o no está disponible temporalmente. Por favor, intenta de nuevo en unos instantes.',
        technicalError: err instanceof Error ? err.message : String(err),
      };
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId ? { ...t, messages: [...updatedMessages, errorMessage] } : t
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabId === 'general') return;

    setTabs((prev) => prev.filter((t) => t.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId('general');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const messages = currentTab.messages;

  // Fill suggestions lazily if tab has none (e.g. loaded from old localStorage)
  const suggestions = useMemo(() => {
    if (currentTab.suggestions.length > 0) return currentTab.suggestions;
    return generateSuggestions(currentTab.id, isVet, activePet?.nombre);
  }, [currentTab.id, currentTab.suggestions, isVet, activePet?.nombre]);

  // Lightweight markdown bold and lists formatter
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmedLine = line.trim();
      const isListItem = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ');
      const cleanText = isListItem
        ? trimmedLine.replace(/^[*+-]\s+/, '')
        : line;

      // Split line by bold tags **word**
      const parts = cleanText.split(/\*\*([^*]+)\*\*/g);
      const parsedLine = parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      );

      if (isListItem) {
        return <li key={idx} style={{ marginBottom: '6px' }}>{parsedLine}</li>;
      }
      return <p key={idx} style={{ margin: '0 0 8px 0' }}>{parsedLine}</p>;
    });
  };

  return (
    <div
      className={cn(
        'fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-[var(--surface-solid)] backdrop-blur-2xl border-l border-[var(--border)] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out',
        isAIChatOpen ? 'translate-x-0' : 'translate-x-full'
      )}
      ref={drawerRef}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-[var(--text-h)] leading-tight">
              Vet<span className="text-[var(--accent)]">Vault</span> Copilot
            </h3>
            <div className="text-[11px] text-[var(--text-muted)] font-medium">
              <span>{isVet ? 'Asistente Clínico Profesional' : 'Asistente de Cuidado Animal'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activePet && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/40">
              {activePet.nombre}
            </span>
          )}
          <button
            type="button"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--surface-solid)] cursor-pointer transition-colors"
            onClick={() => setIsAIChatOpen(false)}
            title="Cerrar Copilot"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-2)] overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium cursor-pointer transition-colors border select-none whitespace-nowrap',
              tab.id === activeTabId
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] border-[var(--accent)]/40 shadow-xs'
                : 'text-[var(--text-muted)] border-transparent hover:bg-[var(--surface-solid)]/60'
            )}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.id === editingTabId ? (
              <input
                type="text"
                className="bg-transparent border-none text-xs outline-none p-0 w-20 text-[var(--text-h)]"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename();
                  if (e.key === 'Escape') setEditingTabId(null);
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                onDoubleClick={(e) => handleStartRename(tab.id, tab.name, e)}
                title="Doble clic para renombrar"
              >
                {tab.name}
              </span>
            )}
            {tab.id !== 'general' && (
              <button
                className="p-0.5 rounded hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-h)] cursor-pointer"
                onClick={(e) => handleCloseTab(tab.id, e)}
                title="Cerrar pestaña"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        <button
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--surface-solid)] cursor-pointer transition-colors"
          onClick={handleCreateNewTab}
          title="Nueva conversación"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center mb-1">
              <Sparkles size={24} />
            </div>
            <h4 className="font-heading font-bold text-base text-[var(--text-h)]">
              ¡Hola, {user?.nombre || 'usuario'}!
            </h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs">
              {isVet
                ? 'Soy tu copiloto clínico. Puedo ayudarte a resumir el historial de tus pacientes, consultar contraindicaciones, buscar medicamentos en el catálogo de SENASA o agendar turnos rápidos.'
                : 'Soy tu asistente de cuidado. Puedo ayudarte a comprender las notas de las visitas de tu mascota, hacer un triaje básico de síntomas o sugerirte turnos para vacunación.'}
            </p>
            <div className="w-full space-y-2 pt-2">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="w-full text-left text-xs p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition-all cursor-pointer text-[var(--text-h)] shadow-xs"
                  onClick={() => handleSend(suggestion)}
                >
                  💡 {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2.5 max-w-[88%]',
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white',
                  msg.sender === 'user'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-tr from-sky-500 to-blue-600'
                )}
              >
                {msg.sender === 'ai' ? <Sparkles size={14} /> : <PawPrint size={14} />}
              </div>
              <div
                className={cn(
                  'rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed space-y-1',
                  msg.sender === 'user'
                    ? 'bg-sky-500 text-white rounded-tr-xs shadow-xs'
                    : 'bg-[var(--surface-2)] text-[var(--text-h)] rounded-tl-xs shadow-xs border border-[var(--border)]'
                )}
              >
                <div>{formatMessageText(msg.text)}</div>
                {msg.technicalError && (
                  <details className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-500">
                    <summary className="font-semibold cursor-pointer">Detalles técnicos</summary>
                    <pre className="mt-1 whitespace-pre-wrap font-mono text-[10px] overflow-x-auto">{msg.technicalError}</pre>
                  </details>
                )}
                {msg.sender === 'ai' && !msg.technicalError && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleDownloadMessagePdf(msg)}
                      disabled={isDownloadingMsg === msg.id}
                      className="hidden text-[10px] text-sky-600 hover:underline cursor-pointer"
                      title="Descargar respuesta como PDF"
                    >
                      <FileDown size={11} className="inline mr-1" />
                      {isDownloadingMsg === msg.id ? 'Descargando...' : 'Descargar PDF'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-2.5 max-w-[88%] mr-auto">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white">
              <Sparkles size={14} />
            </div>
            <div className="bg-[var(--surface-2)] rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs border border-[var(--border)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer & Text Area */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-solid)] backdrop-blur-md space-y-2">
        <div className="relative flex items-center bg-[var(--surface-2)] rounded-2xl p-1.5 border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 focus-within:border-[var(--accent)] transition-all">
          <textarea
            ref={inputRef}
            className="w-full bg-transparent border-none text-[var(--text-h)] text-xs placeholder-[var(--text-muted)] p-2 focus:outline-none resize-none min-h-[44px] max-h-24"
            placeholder="Pregúntale a VetVault AI..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            type="button"
            className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-sky-600 transition-colors cursor-pointer flex-shrink-0 shadow-xs ml-1"
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            title="Enviar mensaje"
          >
            <Send size={13} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-tight">
          {isVet
            ? 'Las sugerencias del Copiloto son de carácter orientativo. Valide dosis clínicamente.'
            : 'Las respuestas son informativas y preventivas. No reemplazan la consulta veterinaria.'}
        </p>
      </div>
    </div>
  );
}

