import { Hono } from "hono";
import { kv } from "../../lib/kv.ts";
import { Article } from "../../types.ts";

const news = new Hono();

news.get("/", async (ctx) => {
  const page = ctx.req.query("page") ?? "1";

  const data: Article[] = [];
  const iter = kv.list<string>({ prefix: ["news"] });

  for await (const item of iter) {
    data.push(JSON.parse(item.value));
  }

  const sorted = data.toSorted((a, b) => {
    // Sort on date
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // const data = await getPage(page);

  // Cache the data for 1 day
  ctx.res.headers.set(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=300"
  );
  // Expires in 1 day
  ctx.res.headers.set(
    "Expires",
    new Date(Date.now() + 86400 * 1000).toUTCString()
  );
  // Set unique ETag
  ctx.res.headers.set("ETag", `news-${page}`);

  return ctx.json(sorted);
});

export default news;
