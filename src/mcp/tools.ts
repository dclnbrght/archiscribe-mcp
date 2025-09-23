import { ModelLoader } from '../model/loader';
import { renderViewListMarkdown, renderViewDetailsMarkdownFromModel, renderElementListMarkdown, renderElementDetailsMarkdownFromModel } from '../renderer';
import { loadConfig } from '../config';
import { getLogger } from '../utils/logger';

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

export interface SearchElementsInput {
  query?: string;
  type?: string;
}

export interface SearchElementsOutput {
  markdown: string;
  [key: string]: unknown; // MCP compatibility
}

export interface GetElementDetailsInput {
  elementname: string;
}

export interface GetElementDetailsOutput {
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

function createSearchElementsOutput(markdown: string): SearchElementsOutput {
  return { markdown };
}

function createGetElementDetailsOutput(markdown: string, id?: string): GetElementDetailsOutput {
  return { markdown, id };
}

export function createTools(modelPath?: string) {
  const cfg = loadConfig();
  const loader = new ModelLoader(modelPath || cfg.modelPath);
  const logger = getLogger();
  const DISCLAIMER_PREFIX = cfg.disclaimerPrefix || '';

  // Add disclaimer at the start of the markdown, to reduce risk of prompt injection
  function withDisclaimer(md: string): string {
    if (!md) return DISCLAIMER_PREFIX;
    return md.startsWith(DISCLAIMER_PREFIX) ? md : DISCLAIMER_PREFIX + md;
  }

  async function searchViewsHandler(input: SearchViewsInput): Promise<SearchViewsOutput> {
    return logger.auditToolInvocation('SearchViews', input, async () => {
      const q = input?.query ? String(input.query).toLowerCase() : '';
      const model = loader.load();
      let views = model.views || [];
      if (q) views = views.filter(v => (v.name || '').toLowerCase().includes(q));
      if (cfg.viewsFilterByProperty) {
        const pname = cfg.viewsFilterPropertyName;
        views = views.filter(v => v.properties && Object.prototype.hasOwnProperty.call(v.properties, pname));
      }
      const markdown = withDisclaimer(renderViewListMarkdown(views));
      const out = createSearchViewsOutput(markdown);
      (out as any).__audit = {
        resultCount: views.length
      };
      return out;
    });
  }

  async function getViewDetailsHandler(input: GetViewDetailsInput): Promise<GetViewDetailsOutput> {
    return logger.auditToolInvocation('GetViewDetails', input, async () => {
      if (!input || !input.viewname) throw new Error('viewname required');
      const model = loader.load();
      // find by exact name or contains
      const searchName = String(input.viewname || '').toLowerCase();
      const v = model.views.find(x => String(x.name || '').toLowerCase() === searchName)
        || model.views.find(x => String(x.name || '').toLowerCase().includes(searchName));
      let out: GetViewDetailsOutput;
      if (!v) {
        out = createGetViewDetailsOutput(`# View not found: ${input.viewname}`);
        (out as any).__audit = { found: false };
        return out;
      }
      const markdown = withDisclaimer(renderViewDetailsMarkdownFromModel(model, v));
      out = createGetViewDetailsOutput(markdown, v.id);
      (out as any).__audit = { found: true, viewId: v.id };
      return out;
    });
  }

  async function searchElementsHandler(input: SearchElementsInput): Promise<SearchElementsOutput> {
    return logger.auditToolInvocation('SearchElements', input, async () => {
      const q = input?.query ? String(input.query).toLowerCase() : '';
      const t = input?.type ? String(input.type).toLowerCase() : '';
      const model = loader.load();
      let elements = model.elements || [];

      // Filter by query (name or documentation)
      if (q) {
        elements = elements.filter(e => 
          (e.name || '').toLowerCase().includes(q) || 
          (e.documentation || '').toLowerCase().includes(q) ||
          Object.entries(e.properties || {}).some(([key, value]) => 
            String(key || '').toLowerCase().includes(q) || String(value || '').toLowerCase().includes(q)
          )
        );
      }

      // Filter by type if specified
      if (t) {
        elements = elements.filter(e => (e.type || '').toLowerCase().includes(t));
      }

      const markdown = withDisclaimer(renderElementListMarkdown(elements));
      const out = createSearchElementsOutput(markdown);
      (out as any).__audit = {
        resultCount: elements.length
      };
      return out;
    });
  }

  async function getElementDetailsHandler(input: GetElementDetailsInput): Promise<GetElementDetailsOutput> {
    return logger.auditToolInvocation('GetElementDetails', input, async () => {
      if (!input || !input.elementname) throw new Error('elementname required');
      const model = loader.load();

      // Find element by exact name or contains
      const element = model.elements.find(x => (x.name || '').toLowerCase() === input.elementname.toLowerCase())
        || model.elements.find(x => (x.name || '').toLowerCase().includes(input.elementname.toLowerCase()));

      let out: GetElementDetailsOutput;
      if (!element) {
        out = createGetElementDetailsOutput(`# Element not found: ${input.elementname}`);
        (out as any).__audit = { found: false };
        return out;
      }

      const markdown = withDisclaimer(renderElementDetailsMarkdownFromModel(model, element));
      out = createGetElementDetailsOutput(markdown, element.id);
      (out as any).__audit = { found: true, elementId: element.id };
      return out;
    });
  }

  return { searchViewsHandler, getViewDetailsHandler, searchElementsHandler, getElementDetailsHandler, loader };
}

export type ToolsFactory = ReturnType<typeof createTools>;
