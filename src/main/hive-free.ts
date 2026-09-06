import fs from 'fs'
import path from 'path'
import { app, ipcMain } from 'electron'

/** Hive-hosted TokenRouter key — GLM 5.3 only. Nemotron has $0 credits. */
export const HIVE_FREE_KEY = 'sk-NwtPUPnpuq8v7VW1PgPejUV6R7ykLl3netGXIANWhKQdHS0R'

/** Live TokenRouter host. tokenrouter.me has no DNS; api.tokenrouter.io wants tr_ keys. */
export const TOKENROUTER_BASES = ['https://api.tokenrouter.com/v1']

export const FREE_GLM = 'z-ai/glm-5.3-free'
/** Kept for migration of saved hive_model values. Never called. */
export const FREE_NEMOTRON = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'

export const HIVE_FREE_MODELS = [FREE_GLM]
