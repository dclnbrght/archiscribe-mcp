import { ServerResponse } from 'http';

export interface ErrorResponse {
  statusCode: number;
  contentType: string;
  message: string;
}

export function createJsonRpcError(code: number, message: string, id: any = null) {
  return {
    jsonrpc: '2.0',
    error: { code, message },
    id
  };
}

export function sendErrorResponse(res: ServerResponse, error: ErrorResponse): void {
  res.statusCode = error.statusCode;
  res.setHeader('content-type', error.contentType);
  res.end(error.message);
}

export function createErrorResponse(statusCode: number, message: string, contentType = 'text/plain'): ErrorResponse {
  return { statusCode, contentType, message };
}

export function handleMcpError(res: ServerResponse, err: any): void {
  console.error('Error handling /mcp request:', err);
  if (!res.headersSent) {
    const errorResponse = createJsonRpcError(-32603, 'Internal server error');
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(errorResponse));
  } else {
    try { 
      res.end(); 
    } catch (_) { 
      // ignore 
    }
  }
}
