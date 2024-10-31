import { createBlogInput, updateBlogInput } from "@ankit_bugade/medium-common";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
    Bindings:{
        DATABASE_URL:string
        JWT_SECRET: string
    },
    Variables:{
        userId:string
    }
}>();


blogRouter.use('/*', async (c, next) => {
    try {
        const authHeader = c.req.header("authorization") || "";
        const response = await verify(authHeader, c.env.JWT_SECRET);

        if (response) {
            c.set('userId', String(response.id));
            await next();
        } else {
            c.status(403);
            return c.json({ error: "You are not logged in" });
        }
    } catch (error) {
        console.error("Authorization error:", error);
        c.status(403);
        return c.json({ error: "Authorization failed" });
    }
});


blogRouter.post('/post',async (c)=>{
    const body = await c.req.json();
    const {success} = createBlogInput.safeParse(body);
    if(!success)
    {
        c.status(411);
        return c.json({
            message:"Wrong Inputs to post blog"
        })
    }
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const user = c.get("userId");
    try {
        const blog = await prisma.post.create({
            data:{
                title: body.title,
                content: body.content,
                authorId: user
            }
        });
        if(!blog){
            c.status(403);
            c.text("blog cannot be created");
        }
        return c.json({
            id: blog.id
        })
    } catch (error) {
        
    }
    return c.text("blog Page");
})

blogRouter.put('/update',async (c)=>{
    const body = await c.req.json();
    const {success} = updateBlogInput.safeParse(body);
    if(!success)
    {
        c.status(411);
        return c.json({
            message:"Wrong Inputs to update blog"
        })
    }
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.post.update({
            where:{
                id: body.id,
            },
            data:{
                title: body.title,
                content: body.content,
            }
        });
        if(!blog){
            c.status(403);
            c.text("blog cannot be updated");
        }
        return c.json({
            id: blog.id
        })
    } catch (error) {
        c.status(411);
        c.text("Cannot update the blog");
    }
})


//TODO add pagination
blogRouter.get('/bulk',async (c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blogs = await prisma.post.findMany();
        return c.json(
            blogs
        );

    } catch (error) {
        c.status(411);
        c.text("Cannot find the blogs");
    }
})


blogRouter.get('/:id',async(c)=>{
    const id =  c.req.param("id");

    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.post.findFirst({
            where:{
                id: String(id),
            }
        });
        if(!blog){
            c.status(403);
            c.text("blog doesn't exist");
        }
        return c.json({
            blog
        })
    } catch (error) {
        c.status(411);
        c.text("Cannot find the blog")
    }
})
