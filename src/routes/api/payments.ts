import { Hono, validator } from "hono";
import { env } from "../../lib/env.ts";
import { z } from "zod";

const payments = new Hono();

const input = z.object({
  amount: z.number().min(1),
  description: z.string(),
  redirectUrl: z.string().url(),
});

payments.post(
  "/",
  validator("json", (value, ctx) => {
    const parsed = input.safeParse(value);
    if (!parsed.success) {
      return ctx.text("Invalid!", 401);
    }
    return parsed.data;
  }),
  async (ctx) => {
    const { amount, description, redirectUrl } = ctx.req.valid("json");

    const response = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MOLLIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: {
          value: amount.toFixed(2),
          currency: "EUR",
        },
        description: description,
        redirectUrl: redirectUrl,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      return ctx.json(json, response.status);
    }

    return ctx.json(json);
  }
);

export default payments;
