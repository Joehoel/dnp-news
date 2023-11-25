import { LinearClient } from "linear";
import { env } from "./env.ts";

export const linear = new LinearClient({
  apiKey: env.LINEAR_API_KEY,
});
