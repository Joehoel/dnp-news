import { z } from "zod";
import { getPage } from "./scrape.ts";

export const newsSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: z.string(),
  content: z.string(),
  slug: z.string(),
  url: z.string(),
});

export type News = Awaited<ReturnType<typeof getPage>>;
