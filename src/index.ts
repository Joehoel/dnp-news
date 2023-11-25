import { Hono } from "hono";
import { serve } from "http/server";
import api from "./routes/api/index.ts";
import { logger } from "hono/middleware";
import { getPage } from "./scrape.ts";
import { kv } from "./lib/kv.ts";

// Cron job every day at 09:00
Deno.cron("scrape", "0 9 * * *", cron());

const app = new Hono();

app.use("*", logger());
app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));

app.get("/healthcheck", (ctx) => {
  return ctx.text("ok");
});

app.get("/cron", (ctx) => {
  cron()();

  return ctx.text("ok");
});

app.delete("/cache", async (ctx) => {
  const iter = kv.list({ prefix: ["news"] });

  for await (const item of iter) {
    await kv.delete(item.key);
  }

  return ctx.text("ok");
});

app.route("/api", api);

await serve(app.fetch, { port: 8000 });

function cron(): () => void | Promise<void> {
  return async () => {
    // Scrape news page
    const firstPage = await getPage(1);

    const firstItem = firstPage.data.at(0);
    if (!firstItem) {
      throw new Error("No items found");
    }
    // Check if the first item is in KV
    const item = await kv.get(["news", firstItem.slug]);

    if (!item.value) {
      console.log("First item not found in KV, starting a new scrape!");
      // Add all items to KV
      for (const item of firstPage.data) {
        console.log(`Adding ${item.slug} to KV`);
        await kv.set(["news", item.slug], JSON.stringify(item));
      }
      // Scrape the rest of the pages and store them in KV with the first page
      for (let i = 2; i <= firstPage.nextPage; i++) {
        const page = await getPage(i);
        for (const item of page.data) {
          console.log(`Adding ${item.slug} to KV`);
          await kv.set(["news", item.slug], JSON.stringify(item));
        }
      }
    }
  };
}
