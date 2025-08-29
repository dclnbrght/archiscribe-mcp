import { describe, it, expect } from 'vitest';
import { ModelLoader } from '../../src/model/loader';
import { renderViewDetailsMarkdownFromModel } from '../../src/renderer';
import { join } from 'path';

describe('Renderer', () => {
  it('renders Dataflow view similar to sample', () => {
    const p = join(__dirname, '..', '..', 'data', 'archimate-scribe-demo-model.xml');
    const loader = new ModelLoader(p);
    const model = loader.load();
    const view = model.views.find(v => v.name && v.name.includes('Dataflow'));
    expect(view).toBeDefined();
    if (view) {
      const md = renderViewDetailsMarkdownFromModel(model, view);
      expect(md).toContain('# ArchiMate View name: Dataflow View');
      expect(md).toContain('## Elements');
      expect(md).toContain('## Relationships');
    }
  });
});
