import { z } from "zod";

export const newsSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: z.string(),
  content: z.string(),
  slug: z.string(),
  url: z.string(),
});

export type Article = z.infer<typeof newsSchema>;
