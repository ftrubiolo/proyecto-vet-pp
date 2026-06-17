import { createContext, useState, type ReactNode } from 'react';

interface AIChatContextType {
  isAIChatOpen: boolean;
  setIsAIChatOpen: (open: boolean) => void;
  activeMascotaId: string | null;
  setActiveMascotaId: (id: string | null) => void;
}

export const AIChatContext = createContext<AIChatContextType>({
  isAIChatOpen: false,
  setIsAIChatOpen: () => {},
  activeMascotaId: null,
  setActiveMascotaId: () => {},
});

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [activeMascotaId, setActiveMascotaId] = useState<string | null>(null);

  return (
    <AIChatContext.Provider
      value={{
        isAIChatOpen,
        setIsAIChatOpen,
        activeMascotaId,
        setActiveMascotaId,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
}
