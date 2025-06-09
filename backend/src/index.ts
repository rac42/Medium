  import { Hono } from 'hono'
  import { PrismaClient } from '@prisma/client/edge'
  import { withAccelerate } from '@prisma/extension-accelerate'
  import { decode, verify, jwt, sign } from 'hono/jwt'
  import type { Context } from 'hono';

  import { use } from 'hono/jsx'

  const app = new Hono<{
    Bindings: {
      DATABASE_URL: string
    };
    Variables: {
    userId: string;
  };
  }>()

  app.get('/', (c) => {
    return c.text('Hello Hono!')
  })

  app.use('/api/v1/blog/*', async (c, next) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const token = c.req.header('Authorization')?.replace('Bearer ', '');  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const decoded = await verify(token, 'secret') as { id: string };
    if (decoded.id) {
      c.set('userId', decoded.id);
      await next();
    } else {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

  app.post('/api/v1/signup', async(c)=> {
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL, 
    }).$extends(withAccelerate())

    const body = await c.req.json();


    const user = await prisma.user.create({
      data:{
        email: body.email,
        password: body.password,
      },
    })

    const token = await sign({id: user.id}, "secret")
    return c.json({
      jwt: token,
    });
  })

  app.post('/api/v1/signin', async(c)=> {
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL, 
    }).$extends(withAccelerate())

    const body = await c.req.json();


    const user = await prisma.user.findUnique({
      where:{
        email: body.email,
        password: body.password,
      },
    })

    if(!user) {
      return c.json({
        error: "User not found",
      }, 404);
    }

    const jwt = await sign({id: user.id}, "secret")
    return c.json({jwt});
  })

  app.post('/api/v1/blog', (c)=> {
    return c.text("Post blog request");
  })

  app.put('/api/v1/blog', (c)=> {
    return c.text("Update blog");
  })

  app.get('/api/v1/blog/:id', (c)=> {
    return c.text("specific blog request");
  })

  export default app


