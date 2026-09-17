import app from '../backend/src/index';

// Native Pages Functions handler using Hono's universal app.fetch
export const onRequest = async (context: any) => {
  return app.fetch(context.request, context.env, context);
};
