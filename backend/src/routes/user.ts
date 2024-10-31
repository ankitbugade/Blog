import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import {signinInput, signupInput} from "@ankit_bugade/medium-common";



export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL:string,
        JWT_SECRET:string
    }
}>();


userRouter.post('/signup',async (c)=>{
    const body = await c.req.json();
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const success = signupInput.safeParse(body); 
    if(!success){
      c.status(411);
      
      return c.json({
        message:"Inputs not correct"
      })
    }
    try {
      const user = await prisma.user.create({
        data:{
          email: body.email,
          password: body.password,
        }
      })
  
      const token = await sign({
        id: user.id,
      },
      c.env.JWT_SECRET);
  
      return c.text(token);
    } catch (error) {
      c.status(411);
      c.text("User can't be created");
    }
    
  })
  
userRouter.post('/signin',async (c)=>{
  const body = await c.req.json();
const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL
}).$extends(withAccelerate());
  const success = signinInput.safeParse(body);
  if(!success)
  {
    c.status(411);
    return c.json({
      message: "Wrong signin inputs"
    })
  }

try {
    const user = await prisma.user.findFirst(
    {where:
    {
        email: body.email,
        password: body.password
    }
    });

    if(!user)
    {
    c.status(403);
    return c.json("User Not Found");
    }

    const token = await sign({id:user.id}, c.env.JWT_SECRET);
    return c.text(token);
} catch (error) {
    console.log(error);
    c.status(411);
    c.text("User does not exist");
}

})


