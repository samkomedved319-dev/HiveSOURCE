import { create } from 'zustand'
import type { Settings } from '../types'

interface SettingsState {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  theme: 'dark',
  apiKey: '',
  apiProvider: 'openrouter',
  phoneNumber: null,
  notifications: true,
  autoStart: false
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates }
  }))
}))
