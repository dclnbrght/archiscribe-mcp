import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { appService } from '../services/app';

export class Router {
  async handle(req: IncomingMessage, res: ServerResponse) {
    const url = parse(req.url || '', true);
    const pathname = url.pathname || '/';

    if (req.method === 'GET' && pathname === '/health') {
      res.statusCode = 200;
      res.setHeader('content-type', 'text/plain');
      res.end('OK');
      return;
    }

    try {
      if (req.method === 'GET' && pathname === '/views') {
        const q = (url.query && (url.query.q || url.query.query)) || url.query?.query || '';
        const input = { query: String(q || '') };
        const out = await appService.tools.searchViewsHandler(input);
        res.statusCode = 200;
        res.setHeader('content-type', 'text/markdown');
        res.end(out.markdown);
        return;
      }

      if (req.method === 'GET' && pathname && pathname.startsWith('/views/')) {
        const name = decodeURIComponent(pathname.replace('/views/', ''));
        const out = await appService.tools.getViewDetailsHandler({ viewname: name });
        res.statusCode = 200;
        res.setHeader('content-type', 'text/markdown');
        res.end(out.markdown);
        return;
      }
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain');
      res.end(String(err?.message || err));
      return;
    }

    res.statusCode = 404;
    res.setHeader('content-type', 'text/plain');
    res.end('Not Found');
  }
}
