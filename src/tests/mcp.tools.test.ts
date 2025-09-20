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
    expect(result.id).toBeTypeOf('string');
    expect(result.id && result.id.length).toBeGreaterThan(0);
  });

  it('searchElementsHandler returns markdown', async () => {
    const modelPath = join(__dirname, '..', '..', 'data', 'archimate-scribe-demo-model.xml');
    const tools = createTools(modelPath);
    
    // Test searching by name
    const nameResult = await tools.searchElementsHandler({ query: 'core' });
    expect(nameResult.markdown).toContain('Elements');
    expect(nameResult.markdown).toContain('Core');
    
    // Test searching by type
    const typeResult = await tools.searchElementsHandler({ type: 'ApplicationComponent' });
    expect(typeResult.markdown).toContain('ApplicationComponent');
  });

  it('getElementDetailsHandler returns element markdown', async () => {
    const modelPath = join(__dirname, '..', '..', 'data', 'archimate-scribe-demo-model.xml');
    const tools = createTools(modelPath);
    
    const result = await tools.getElementDetailsHandler({ elementname: 'RDBMS' });
    expect(result.markdown).toContain('ArchiMate Element:');
    expect(result.markdown).toContain('RDBMS');
    expect(result.id).toBeTypeOf('string');
    expect(result.id && result.id.length).toBeGreaterThan(0);
  });
});
