import { appService } from '../services/app';
import { z } from 'zod';

type SdkServer = any;

// Create and start an MCP server registering our tools. This function will try to import
// the `@modelcontextprotocol/sdk` package and register tools using a best-effort API.
// If the SDK is not available, it will return a shim that exposes the tools for in-process use.
export async function createMcpServer() {
  const tools = appService.tools;
  let sdkServer: SdkServer | null = null;
  
  try {
    // Try to load the high-level McpServer (preferred approach)
    const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
    
    console.info('MCP SDK: using high-level McpServer API');
    
    const server = new McpServer(
      { name: 'ArchiScribe MCP', version: '0.1.0' }, 
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
    console.info('MCP: registered high-level tool: SearchViews');

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
    console.info('MCP: registered high-level tool: GetViewDetails');

    sdkServer = server;
  } catch (err) {
    // SDK not available or registration failed; continue with in-process tools only
    console.warn('MCP SDK not loaded, falling back to in-process tools only:', (err as Error)?.message || err);
    sdkServer = null;
  }

  async function start() {
    if (sdkServer && typeof sdkServer.start === 'function') await sdkServer.start();
    return { tools };
  }

  async function stop() {
    if (sdkServer && typeof sdkServer.stop === 'function') await sdkServer.stop();
    return;
  }

  return { start, stop, tools, sdkServer };
}
