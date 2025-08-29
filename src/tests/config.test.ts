import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../src/config';

describe('Config loader', () => {
  it('returns defaults when env not set', () => {
    const cfg = loadConfig();
    expect(cfg.modelPath).toBeDefined();
    expect(typeof cfg.serverPort).toBe('number');
  });
});
