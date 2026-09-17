import { handle } from 'hono/cloudflare-pages';
import app from '../src/index';

// Cloudflare Pages Functions adapter for Hono
export const onRequest = handle(app);
