import { mkdirSync, createWriteStream, WriteStream, statSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '../config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogRecordBase {
  ts: string; // ISO UTC
  level: LogLevel;
  event: string;
  [k: string]: any; // extensible
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

class DailyFileLogger {
  private currentDate: string | null = null; // YYYY-MM-DD
  private stream: WriteStream | null = null;
  private logDir: string;
  private level: LogLevel;
  private warned: boolean = false;

  constructor(dir?: string, level?: LogLevel) {
    const cfg = loadConfig();
    this.logDir = dir || (cfg as any).logPath || 'logs';
    this.level = level || (cfg as any).logLevel || 'info';
    this.ensureStream();
  }

  private today(): string { return new Date().toISOString().slice(0,10); }

  private ensureStream() {
    const d = this.today();
    if (this.currentDate === d && this.stream) return;
    try {
      mkdirSync(this.logDir, { recursive: true });
      this.currentDate = d;
      if (this.stream) {
        try { this.stream.end(); } catch {}
      }
      const file = join(this.logDir, `archiscribe-${d}.log`);
      this.stream = createWriteStream(file, { flags: 'a', encoding: 'utf8' });
    } catch (err) {
      if (!this.warned) {
        // Fallback to console if file logging fails
        console.warn('Logger: cannot write log file:', (err as Error).message);
        this.warned = true;
      }
      this.stream = null; // will fallback to console
    }
  }

  setLevel(l: LogLevel) { this.level = l; }

  shouldLog(l: LogLevel): boolean { return LEVEL_ORDER[l] >= LEVEL_ORDER[this.level]; }

  log(level: LogLevel, event: string, record: Record<string, any>) {
    if (!this.shouldLog(level)) return;
    this.ensureStream();
    const base: LogRecordBase = { ts: new Date().toISOString(), level, event };
    const out = { ...base, ...this.sanitize(record) };
    const line = JSON.stringify(out);
    if (this.stream) {
      this.stream.write(line + '\n');
    } else {
      // fallback
      console.log(line);
    }
  }

  private sanitize(obj: any, depth = 0): any {
    if (obj == null) return obj;
    if (typeof obj === 'string') {
      if (obj.length > 2000) return obj.slice(0, 2000) + '...<truncated>'; // truncate
      return obj;
    }
    if (depth > 3) return '[DepthLimit]';
    if (Array.isArray(obj)) return obj.slice(0, 50).map(v => this.sanitize(v, depth+1));
    if (typeof obj === 'object') {
      const out: any = {};
      const keys = Object.keys(obj).slice(0, 50);
      for (const k of keys) out[k] = this.sanitize(obj[k], depth+1);
      return out;
    }
    return obj;
  }

  flush(): Promise<void> {
    return new Promise(res => {
      if (!this.stream) return res();
      this.stream.once('finish', () => res());
      this.stream.end();
      this.stream = null;
    });
  }

  auditToolInvocation(tool: string, params: any, fn: () => Promise<any>): Promise<any> {
    const start = Date.now();
    return fn().then(result => {
      // Allow tool handlers to attach lightweight audit metadata on the result as __audit
      let auditMeta: any = undefined;
      if (result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, '__audit')) {
        auditMeta = (result as any).__audit;
        // Do not retain the internal field on the outward result
        try { delete (result as any).__audit; } catch {}
      }
      this.log('info', 'tool.invoke', { tool, params, durationMs: Date.now() - start, success: true, ...(auditMeta || {}) });
      return result;
    }).catch(err => {
      this.log('error', 'tool.invoke', { tool, params, durationMs: Date.now() - start, success: false, error: (err as Error).message });
      throw err;
    });
  }

  auditHttpInvocation(method: string, path: string, params: any, fn: () => Promise<any>): Promise<any> {
    const start = Date.now();
    return fn().then(result => {
      this.log('info', 'http.request', { method, path, params, durationMs: Date.now() - start, success: true });
      return result;
    }).catch(err => {
      this.log('error', 'http.request', { method, path, params, durationMs: Date.now() - start, success: false, error: (err as Error).message });
      throw err;
    });
  }
}

// Singleton logger instance
export const logger = new DailyFileLogger();

export function getLogger() { return logger; }
