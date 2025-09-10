import { createServer } from 'http';
import { Router } from '../api/router';
import { createMcpServer } from './server';
import { appService } from '../services/app';
import { createJsonRpcError, handleMcpError } from '../utils/errors';
import { getLogger } from '../utils/logger';

const logger = getLogger();

const port = Number(process.env.PORT || appService.config.serverPort);

// Read request body and attempt to parse JSON
function readRequestBody(req: import('http').IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      if (!buf || buf.length === 0) return resolve(undefined);
      const s = buf.toString('utf8');
      try { resolve(JSON.parse(s)); } catch { resolve(s); }
    });
    req.on('error', reject);
  });
}

async function handleMcpRequest(mcp: any, req: any, res: any): Promise<void> {
  if (!mcp.sdkServer) {
    // Return a 404 JSON-RPC error so clients fall back to legacy SSE
    const errorResponse = createJsonRpcError(-32000, 'Not Found');
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(errorResponse));
    return;
  }

  const body = await readRequestBody(req);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  // Close transport when response closes
  res.on('close', () => {
    try { transport.close(); } catch (_) { /* ignore */ }
  });

  // Connect and handle the request
  await mcp.sdkServer.connect(transport);
  await transport.handleRequest(req as any, res as any, body);
}

async function main() {
  const router = new Router();
  const mcp = await createMcpServer();
  // Start the MCP server if it has SDK backing so transports and notifications are initialized
  try {
    await mcp.start();
    logger.log('info', 'server.mcp.start', { success: true });
  } catch (err) {
    console.warn('MCP server start() failed:', (err as Error)?.message || err);
    logger.log('warn', 'server.mcp.start', { success: false, error: (err as Error)?.message || String(err) });
  }

  const server = createServer(async (req, res) => {
    // handle /mcp transport requests
    const host = 'localhost';
    const url = new URL(`http://${host}`);
    const pathname = url.pathname;

    if (pathname === '/mcp') {
      try {
        await handleMcpRequest(mcp, req, res);
      } catch (err: any) {
        handleMcpError(res, err);
      }
      return;
    }

    // Fallback to existing router for other endpoints
    router.handle(req, res).catch(err => {
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain');
      res.end('Internal Server Error');
      console.error(err);
      logger.log('error', 'http.unhandled', { error: (err as Error)?.message || err });
    });
  });

  server.listen(Number(port), () => {
    console.log(`Server listening on port ${port}`);
    logger.log('info', 'server.listen', { port });
  });
}

main().catch(err => {
  console.error('Failed to start server', err);
  logger.log('error', 'server.start.fail', { error: (err as Error)?.message || String(err) });
  process.exit(1);
});
