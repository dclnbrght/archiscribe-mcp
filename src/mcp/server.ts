import { appService } from '../services/app';
import { z } from 'zod';
import { getLogger } from '../utils/logger';

type SdkServer = any;

// Create and start an MCP server registering our tools. This function will try to import
// the `@modelcontextprotocol/sdk` package and register tools using a best-effort API.
// If the SDK is not available, it will return a shim that exposes the tools for in-process use.
export async function createMcpServer() {
  const tools = appService.tools;
  let sdkServer: SdkServer | null = null;
  const logger = getLogger();
  
  try {
    // Try to load the high-level McpServer (preferred approach)
    const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
    
    console.info('MCP: initialising server');
    logger.log('info', 'mcp.init', { message: 'initialising server' });
    
    const server = new McpServer(
      { name: 'ArchiScribe MCP', version: '1.0.0' }, 
      { capabilities: { tools: { listChanged: true } } }
    );

    // Register the SearchViews tool
    server.registerTool(
      'SearchViews',
      {
        title: 'Search Views',
        description: 'Search view names in the ArchiMate model',
        inputSchema: { 
          query: z.string().optional().describe('Search keyword to filter view names') 
        },
      },
      async (args: { query?: string }) => {
        const out = await tools.searchViewsHandler({ query: args?.query });
        return { content: [{ type: 'text', text: out.markdown }], structuredContent: out };
      }
    );
    console.info('MCP: registered tool: SearchViews');
    logger.log('info', 'mcp.tool.register', { tool: 'SearchViews', highLevel: true });

    // Register the GetViewDetails tool
    server.registerTool(
      'GetViewDetails',
      {
        title: 'Get View Details',
        description: 'Get detailed markdown for a named view in the ArchiMate model',
        inputSchema: { 
          viewname: z.string().describe('The exact name of the view to retrieve details for') 
        },
      },
      async (args: { viewname: string }) => {
        const out = await tools.getViewDetailsHandler({ viewname: args.viewname });
        return { content: [{ type: 'text', text: out.markdown }], structuredContent: out };
      }
    );
    console.info('MCP: registered tool: GetViewDetails');
    logger.log('info', 'mcp.tool.register', { tool: 'GetViewDetails', highLevel: true });

    // Register the SearchElements tool
    server.registerTool(
      'SearchElements',
      {
        title: 'Search Elements',
        description: 'Search elements in the ArchiMate model by name, type, or documentation',
        inputSchema: { 
          query: z.string().optional().describe('Search keyword to filter element names, documentation, and properties'),
          type: z.string().optional().describe('Filter elements by type')
        },
      },
      async (args: { query?: string, type?: string }) => {
        const out = await tools.searchElementsHandler({ query: args?.query, type: args?.type });
        return { content: [{ type: 'text', text: out.markdown }], structuredContent: out };
      }
    );
    console.info('MCP: registered tool: SearchElements');
    logger.log('info', 'mcp.tool.register', { tool: 'SearchElements', highLevel: true });

    // Register the GetElementDetails tool
    server.registerTool(
      'GetElementDetails',
      {
        title: 'Get Element Details',
        description: 'Get detailed markdown for a named element in the ArchiMate model',
        inputSchema: { 
          elementname: z.string().describe('The name of the element to retrieve details for') 
        },
      },
      async (args: { elementname: string }) => {
        const out = await tools.getElementDetailsHandler({ elementname: args.elementname });
        return { content: [{ type: 'text', text: out.markdown }], structuredContent: out };
      }
    );
    console.info('MCP: registered tool: GetElementDetails');
    logger.log('info', 'mcp.tool.register', { tool: 'GetElementDetails', highLevel: true });

    sdkServer = server;
  } catch (err) {
    // SDK not available or registration failed; continue with in-process tools only
    const msg = (err as Error)?.message || String(err);
    console.warn('MCP SDK not loaded, falling back to in-process tools only:', msg);
    logger.log('warn', 'mcp.init.fallback', { message: 'SDK not loaded, using in-process tools', error: msg });
    sdkServer = null;
  }

  async function start() {
    if (sdkServer && typeof sdkServer.start === 'function') {
      await sdkServer.start();
      logger.log('info', 'mcp.server.start', { mode: 'sdk', tools: Object.keys(tools) });
    } else {
      logger.log('info', 'mcp.server.start', { mode: 'in-process', tools: Object.keys(tools) });
    }
    return { tools };
  }

  async function stop() {
    if (sdkServer && typeof sdkServer.stop === 'function') {
      await sdkServer.stop();
      logger.log('info', 'mcp.server.stop', { mode: 'sdk' });
    } else {
      logger.log('info', 'mcp.server.stop', { mode: 'in-process' });
    }
    return;
  }

  return { start, stop, tools, sdkServer };
}
