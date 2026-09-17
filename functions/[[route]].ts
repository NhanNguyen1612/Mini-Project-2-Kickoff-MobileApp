import { handle } from 'hono/cloudflare-pages';
import app from '../backend/src/index';

// Root Cloudflare Pages Functions adapter for Hono
export const onRequest = handle(app);
