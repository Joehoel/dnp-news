import "dotenv";
import { Hono } from "hono";
import { serve } from "http/server";
import { Redis } from "upstash";
import { getPage } from "./scrape.ts";
import { z } from "zod";

type News = Awaited<ReturnType<typeof getPage>>;

const app = new Hono();

const env = z
  .object({
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
  })
  .parse(Deno.env.toObject());

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

app.get("/", async (ctx) => {
  const page = ctx.req.query("page");

  if (!page) {
    return ctx.json({
      error: "No page query parameter provided",
      status: 400,
    });
  }

  const news = await redis.get<News>("news");

  if (news) {
    return ctx.json(news);
  }

  const data = await getPage(page);

  await redis.setex("news", 1000 * 60 * 60 * 24, data);

  return ctx.json(data);
});

await serve(app.fetch, { port: 8000 });
