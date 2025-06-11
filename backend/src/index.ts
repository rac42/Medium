  import { Hono } from 'hono'
  import { PrismaClient } from '@prisma/client/edge'
  import { withAccelerate } from '@prisma/extension-accelerate'
  import { decode, verify, jwt, sign } from 'hono/jwt'
  import type { Context } from 'hono';
  import { use } from 'hono/jsx'
  import { userRouter } from './routes/user';
  import { blogRouter } from './routes/blog'; 

  const app = new Hono<{
    Bindings: {
      DATABASE_URL: string
    };
    Variables: {
    userId: string;
  };
  }>()

  app.route("/api/v1/user", userRouter);
  app.route("api/v1/blog", blogRouter);

  app.get('/', (c) => {
    return c.text('Hello Hono!')
  })

export default app


