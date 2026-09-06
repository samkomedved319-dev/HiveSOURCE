import type { AgentDefinition } from '@/components/office/types/agent';
import type { AppLocale } from '@/components/office/stubs/i18nTypes';

export function applyLocaleToAgents(agents: AgentDefinition[], _locale: AppLocale): AgentDefinition[] {
  return agents;
}
