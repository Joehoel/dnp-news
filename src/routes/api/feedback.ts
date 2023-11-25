import { Hono, validator } from "hono";

import { linear } from "../../lib/linear.ts";
import { z } from "zod";
import { env } from "../../lib/env.ts";

const feedback = new Hono();

const input = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
  type: z.enum(["bug", "suggestion", "feedback"]),
});

feedback.post(
  "/",
  validator("json", (value, ctx) => {
    const parsed = input.safeParse(value);
    if (!parsed.success) {
      return ctx.text("Invalid!", 401);
    }
    return parsed.data;
  }),
  async (ctx) => {
    const { name, email, message, type } = ctx.req.valid("json");

    const payload = await linear.createIssue({
      title: `Feedback from ${name}`,
      description: `Email: ${email}\n\n${message}\n\nType: ${type}`,
      teamId: env.LINEAR_TEAM_ID,
    });

    const issue = await payload.issue;

    return ctx.json(issue);
  }
);

export default feedback;
