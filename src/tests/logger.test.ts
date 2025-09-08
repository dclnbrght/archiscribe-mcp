import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getLogger } from '../utils/logger';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Basic test to ensure log line written and has required fields

describe('logger', () => {
  const logger = getLogger();
  let logFile: string = '';

  beforeAll(() => {
    const today = new Date().toISOString().slice(0,10);
    logFile = join(process.cwd(), 'logs', `archiscribe-${today}.log`);
  });

  afterAll(async () => {
    await logger.flush();
  });

  it('writes audit line for tool invocation', async () => {
    await logger.auditToolInvocation('TestTool', { foo: 'bar' }, async () => ({ ok: true }));
    await logger.flush();
    expect(existsSync(logFile)).toBe(true);
    const content = readFileSync(logFile, 'utf8').trim().split('\n');
    expect(content.length).toBeGreaterThan(0);
    const last = JSON.parse(content[content.length - 1]);
    expect(last.tool).toBe('TestTool');
    expect(last.event).toBe('tool.invoke');
    expect(last.success).toBe(true);
    expect(typeof last.durationMs).toBe('number');
  });
});
