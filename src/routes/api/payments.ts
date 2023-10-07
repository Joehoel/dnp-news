import { Hono } from "hono";
import { env } from "../../lib/env.ts";

const payments = new Hono();

payments.post("/", async (ctx) => {
  const { amount, description, redirectUrl } = await ctx.req.json<{
    amount: number;
    description: string;
    redirectUrl: string;
  }>();

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
});

export default payments;
