import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, PawPrint, X, Plus, FileDown } from 'lucide-react';
import { useAIChat } from '../../hooks/useAIChat';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../api/client';
import { downloadPdf } from '../../utils/download';
import './AIChatDrawer.css';

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
}

let messageIdCounter = 0;
function generateMessageId(): string {
  return `${Date.now()}-${messageIdCounter++}`;
}

let tabIdCounter = 0;
function generateTabId(): string {
  return `chat-${Date.now()}-${tabIdCounter++}`;
}

export function AIChatDrawer() {
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
          return parsed;
        }
      } catch (e) {
        // Fallback to default if JSON is corrupt
      }
    }
    return [{ id: 'general', name: 'General', messages: [] }];
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
      alert('No se pudo descargar el PDF del mensaje.');
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
            },
          ];
        });
        setActiveTabId(tabId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeMascotaId, activePet]);

  // Persist tabs to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tabs));
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

  // Suggestion chips based on user role
  const vetSuggestions = [
    '¿Esta mascota tiene alergias o contraindicaciones?',
    'Resumir el historial de consultas médicas',
    'Buscar Cefalexina en el vademécum oficial',
  ];

  const ownerSuggestions = [
    '¿Cuándo le toca el próximo refuerzo de vacuna?',
    'Explicar los diagnósticos recientes en palabras simples',
    'Mi mascota está vomitando y decaída, ¿es urgente? (Triaje)',
  ];

  const suggestions = isVet ? vetSuggestions : ownerSuggestions;

  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const messages = currentTab.messages;

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
    <div className={`ai-chat-drawer ${isAIChatOpen ? 'open' : ''}`} ref={drawerRef}>
      {/* Header */}
      <div className="ai-chat-header">
        <div className="ai-chat-title-group">
          <div>
            <h3>Vet<span>Vault</span> Copilot</h3>
            <div className="ai-chat-subtitle">
              <span>{isVet ? 'Asistente Clínico Profesional' : 'Asistente de Cuidado Animal'}</span>
            </div>
          </div>
        </div>
        {activePet && (
          <span className="context-badge">
            Paciente: {activePet.nombre}
          </span>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="ai-chat-tabs-bar">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`ai-chat-tab-pill ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.id === editingTabId ? (
              <input
                type="text"
                className="tab-name-input"
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
                className="tab-name"
                onDoubleClick={(e) => handleStartRename(tab.id, tab.name, e)}
                title="Doble clic para renombrar"
              >
                {tab.name}
              </span>
            )}
            {tab.id !== 'general' && (
              <button
                className="tab-close-btn"
                onClick={(e) => handleCloseTab(tab.id, e)}
                title="Cerrar pestaña"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        <button
          className="ai-chat-new-tab-btn"
          onClick={handleCreateNewTab}
          title="Nueva conversación"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Messages List */}
      <div className="ai-chat-messages">
        {messages.length === 0 ? (
          <div className="ai-welcome-panel">
            <div className="ai-welcome-icon">
              <Sparkles size={28} />
            </div>
            <h4>¡Hola, {user?.nombre || 'usuario'}!</h4>
            <p>
              {isVet
                ? 'Soy tu copiloto clínico. Puedo ayudarte a resumir el historial de tus pacientes, consultar contraindicaciones, buscar medicamentos en el catálogo de SENASA o agendar turnos rápidos.'
                : 'Soy tu asistente de cuidado. Puedo ayudarte a comprender las notas de las visitas de tu mascota, hacer un triaje básico de síntomas o sugerirte turnos para vacunación.'}
            </p>
            <div className="ai-suggestions-container">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="ai-suggestion-chip"
                  onClick={() => handleSend(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`ai-message-wrapper ${msg.sender}`}>
              <div className="ai-message-icon">
                {msg.sender === 'ai' ? <Sparkles size={14} /> : <PawPrint size={14} />}
              </div>
              <div className="ai-message-bubble">
                {formatMessageText(msg.text)}
                {msg.technicalError && (
                  <details className="ai-chat-tech-details">
                    <summary>Detalles técnicos (Desarrollador)</summary>
                    <pre>{msg.technicalError}</pre>
                  </details>
                )}
                {msg.sender === 'ai' && !msg.technicalError && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      onClick={() => handleDownloadMessagePdf(msg)}
                      disabled={isDownloadingMsg === msg.id}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-primary-light, #2563eb)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'background 0.2s',
                      }}
                      title="Descargar respuesta como PDF"
                    >
                      <FileDown size={12} />
                      {isDownloadingMsg === msg.id ? 'Descargando...' : 'Descargar PDF'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="ai-message-wrapper ai">
            <div className="ai-message-icon">
              <Sparkles size={14} />
            </div>
            <div className="ai-message-bubble">
              <div className="ai-typing-loader">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer & Text Area */}
      <div className="ai-chat-footer">
        <div className="ai-input-wrapper">
          <textarea
            ref={inputRef}
            className="ai-chat-input"
            placeholder="Pregúntale a VetVault AI..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className="ai-send-btn"
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            title="Enviar mensaje"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="ai-disclaimer">
          {isVet
            ? 'Las sugerencias del Copiloto son de carácter orientativo. Valide dosis clínicamente.'
            : 'Las respuestas son informativas y preventivas. No reemplazan la consulta veterinaria.'}
        </p>
      </div>
    </div>
  );
}
