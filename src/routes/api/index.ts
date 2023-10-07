import { Hono } from "hono";
import news from "./news.ts";
import payments from "./payments.ts";

const api = new Hono();

api.route("/news", news);
api.route("/payments", payments);

export default api;
