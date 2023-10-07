import { Hono } from "hono";
import { serve } from "http/server";
import api from "./routes/api/index.ts";
import { logger } from "hono/middleware";

const app = new Hono();

app.use("*", logger());
app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));

app.get("/healthcheck", (ctx) => {
  return ctx.text("ok");
});

app.route("/api", api);

await serve(app.fetch, { port: 8000 });
