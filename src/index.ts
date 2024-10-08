import "@std/dotenv/load";
import { Hono } from "@hono/hono";
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

  if (news?.data.length) {
    return ctx.json(news);
  }

  const data = await getPage(page);

  await redis.setex("news", 60 * 60 * 3, data);

  return ctx.json(data);
});

Deno.serve({ port: 8000 }, app.fetch);
