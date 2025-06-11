import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, verify, jwt, sign } from 'hono/jwt'

export const userRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string
    };
    Variables: {
    userId: string;
  };
  }>()

userRouter.post('/signup', async(c)=> {
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL, 
    }).$extends(withAccelerate())

    const body = await c.req.json();


    const user = await prisma.user.create({
      data:{
        username: body.email,
        password: body.password,
      },
    })

    const token = await sign({id: user.id}, "secret")
    return c.json({
      jwt: token,
    });
  })

  userRouter.post('/signin', async(c)=> {
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL, 
    }).$extends(withAccelerate())

    const body = await c.req.json();


    const user = await prisma.user.findUnique({
      where:{
        username: body.email,
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
