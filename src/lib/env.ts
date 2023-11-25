import "dotenv";
import { z } from "zod";

export const env = z
  .object({
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
    MOLLIE_API_KEY: z.string(),
    LINEAR_API_KEY: z.string(),
    LINEAR_TEAM_ID: z.string(),
  })
  .parse(Deno.env.toObject());
