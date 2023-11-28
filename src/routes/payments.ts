import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { minValue, number, object, safeParse, string, url } from 'valibot';
import { env } from 'hono/adapter';
import { Env } from '../worker';

const payments = new Hono();

const input = object({
	amount: number([minValue(1)]),
	description: string(),
	redirectUrl: string([url()]),
});

payments.post(
	'/',
	validator('json', (value, ctx) => {
		const parsed = safeParse(input, value);

		if (!parsed.success) {
			return ctx.json(parsed.issues, 400);
		}

		return parsed.output;
	}),
	async (ctx) => {
		const { amount, description, redirectUrl } = ctx.req.valid('json');

		const response = await fetch('https://api.mollie.com/v2/payments', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env<Env>(ctx).MOLLIE_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				amount: {
					value: amount.toFixed(2),
					currency: 'EUR',
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
