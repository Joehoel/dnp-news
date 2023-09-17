import { z } from "zod";
import { ReadTimeResults } from "npm:reading-time";

export const newsSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: z.string(),
  content: z.string(),
  slug: z.string(),
  readingTime: z.custom<ReadTimeResults>(),
});

export type News = z.infer<typeof newsSchema>;
