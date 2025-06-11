import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, verify, jwt, sign } from 'hono/jwt'
import { createBlogInput, updateBlogInput } from "@rac42/medium-common";

export const blogRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string
    };
    Variables: {
    userId: string;
  };
  }>();

blogRouter.use('/*', async (c, next) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const token = c.req.header('Authorization')?.replace('Bearer ', '');  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const decoded = await verify(token, 'secret') as { id: string };
    if (decoded) {
      c.set('userId', decoded.id);
      await next();
    } else {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

blogRouter.post('/', async(c)=> {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const { success } = createBlogInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }
    const authorId = c.get('userId');
    const blog = await prisma.blog.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: Number(authorId),
        },
    });

    return c.json({
        id: blog.id
    })
  })

blogRouter.put('/', async(c)=> {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const { success } = updateBlogInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }
    const blog = await prisma.blog.update({
        where: {
            id: body.id
        },
        data: {
            title: body.title,
            content: body.content,
        },
    });

    return c.json({
        id: blog.id
    })
  })

blogRouter.get('/bulk', async(c)=> {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blogs = await prisma.blog.findMany();

    return c.json({
        blogs
    })
  })

blogRouter.get('/:id', async(c)=> {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const id = await c.req.param("id");
    const blog = await prisma.blog.findFirst({
        where: {
            id: Number(id)
        }, select: {
                id: true,
                title: true,
                content: true,
                author: {
                    select: {
                        name: true
                    }
                }
            }

    });
    return c.json({
        blog
    })
})