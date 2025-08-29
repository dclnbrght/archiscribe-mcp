import { describe, it, expect } from 'vitest';
import { createTools } from '../../src/mcp/tools';
import { join } from 'path';

describe('MCP tools', () => {
  it('searchViewsHandler returns markdown', async () => {
    const modelPath = join(__dirname, '..', '..', 'data', 'archimate-scribe-demo-model.xml');
    const tools = createTools(modelPath);
    const result = await tools.searchViewsHandler({ query: 'dataflow' });
    expect(result.markdown).toContain('Dataflow');
    expect(result.markdown).toContain('Views');
  });

  it('getViewDetailsHandler returns view markdown', async () => {
    const modelPath = join(__dirname, '..', '..', 'data', 'archimate-scribe-demo-model.xml');
    const tools = createTools(modelPath);
    const result = await tools.getViewDetailsHandler({ viewname: 'Dataflow View' });
    expect(result.markdown).toContain('ArchiMate View name: Dataflow View');
    expect(result.markdown).toContain('Elements');
  });
});
