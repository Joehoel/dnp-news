import { LinearClient } from "linear";

export const linear = new LinearClient({
  apiKey: Deno.env.get("LINEAR_API_KEY")!,
});
