import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";

export const newsSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: z.string(),
  content: z.string(),
  slug: z.string(),
});

export type News = z.infer<typeof newsSchema>;
