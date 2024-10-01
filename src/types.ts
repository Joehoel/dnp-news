import { z } from "zod";

export const newsSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: z.string(),
  content: z.string(),
  slug: z.string(),
});

export type News = z.infer<typeof newsSchema>;
