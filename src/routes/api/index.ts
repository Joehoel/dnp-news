import { Hono } from "hono";
import news from "./news.ts";
import payments from "./payments.ts";
import feedback from "./feedback.ts";

const api = new Hono();

api.route("/news", news);
api.route("/payments", payments);
api.route("/feedback", feedback);

export default api;
