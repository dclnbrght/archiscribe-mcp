import { readFileSync } from 'fs';
import { join } from 'path';

export interface Config {
  modelPath: string;
  viewsFilterByProperty: boolean;
  viewsFilterPropertyName: string;
  serverPort: number;
  logPath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

function readSettings(): Partial<Config> {
  try {
    const p = join(__dirname, '..', '..', 'config', 'settings.json');
    const raw = readFileSync(p, 'utf8');
    return JSON.parse(raw) as Partial<Config>;
  } catch (err) {
    return {};
  }
}

export function loadConfig(): Config {
  const defaults = readSettings();
  
  // Require explicit configuration - no hardcoded fallbacks
  const modelPath = process.env.MODEL_PATH || defaults.modelPath;
  if (!modelPath) {
    throw new Error('Model path must be specified in config/settings.json or MODEL_PATH environment variable');
  }
  
  return {
    modelPath,
    viewsFilterByProperty: (process.env.VIEWS_FILTER_BY_PROPERTY || String(defaults.viewsFilterByProperty || 'false')) === 'true',
    viewsFilterPropertyName: process.env.VIEWS_FILTER_PROPERTY_NAME || defaults.viewsFilterPropertyName || 'AI-Context',
    serverPort: Number(process.env.SERVER_PORT || defaults.serverPort || 3030),
    logPath: process.env.LOG_PATH || (defaults as any).logPath || 'logs',
    logLevel: (process.env.LOG_LEVEL as any) || (defaults as any).logLevel || 'info',
  };
}
