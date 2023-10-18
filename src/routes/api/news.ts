import { Hono } from "hono";
import { redis } from "../../lib/redis.ts";
import { getPage } from "../../scrape.ts";
import { News } from "../../types.ts";

const news = new Hono();

news.get("/", async (ctx) => {
  const page = ctx.req.query("page") ?? "1";
  const news = await redis.get<News>("news");

  if (news?.data.length) {
    return ctx.json(news);
  }

  const data = await getPage(page);
  await redis.setex("news", 60 * 60 * 3, data);

  return ctx.json(data);
});

export default news;
