import { useContext } from 'react';
import { AIChatContext } from '../context/AIChatContext';

export function useAIChat() {
  return useContext(AIChatContext);
}
