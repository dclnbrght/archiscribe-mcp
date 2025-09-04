import { ModelLoader } from '../model/loader';
import { renderViewListMarkdown, renderViewDetailsMarkdownFromModel } from '../renderer';
import { loadConfig } from '../config';
import { ViewObject, ModelData } from '../model/types';

export interface SearchViewsInput {
  query?: string;
}

export interface SearchViewsOutput {
  markdown: string;
  [key: string]: unknown; // MCP compatibility
}

export interface GetViewDetailsInput {
  viewname: string;
}

export interface GetViewDetailsOutput {
  id?: string;
  markdown: string;
  [key: string]: unknown; // MCP compatibility
}

// Helper functions to ensure type safety while maintaining MCP compatibility
function createSearchViewsOutput(markdown: string): SearchViewsOutput {
  return { markdown };
}

function createGetViewDetailsOutput(markdown: string, id?: string): GetViewDetailsOutput {
  return { markdown, id };
}

export function createTools(modelPath?: string) {
  const cfg = loadConfig();
  const loader = new ModelLoader(modelPath || cfg.modelPath);

  async function searchViewsHandler(input: SearchViewsInput): Promise<SearchViewsOutput> {
    const q = input?.query ? String(input.query).toLowerCase() : '';
    const model = loader.load();
    let views = model.views || [];
    if (q) views = views.filter(v => (v.name || '').toLowerCase().includes(q));
    if (cfg.viewsFilterByProperty) {
      const pname = cfg.viewsFilterPropertyName;
      views = views.filter(v => v.properties && Object.prototype.hasOwnProperty.call(v.properties, pname));
    }
    const markdown = renderViewListMarkdown(views);
    return createSearchViewsOutput(markdown);
  }

  async function getViewDetailsHandler(input: GetViewDetailsInput): Promise<GetViewDetailsOutput> {
    if (!input || !input.viewname) throw new Error('viewname required');
    const model = loader.load();
    // find by exact name or contains
    const v = model.views.find(x => (x.name || '').toLowerCase() === input.viewname.toLowerCase())
      || model.views.find(x => (x.name || '').toLowerCase().includes(input.viewname.toLowerCase()));
    if (!v) return createGetViewDetailsOutput(`# View not found: ${input.viewname}`);
    const markdown = renderViewDetailsMarkdownFromModel(model, v);
    return createGetViewDetailsOutput(markdown, v.id);
  }

  return { searchViewsHandler, getViewDetailsHandler, loader };
}

export type ToolsFactory = ReturnType<typeof createTools>;
