// import { LinearClient } from '@linear/sdk';
// import { Hono } from 'hono';
// import { env } from 'hono/adapter';
// import { validator } from 'hono/validator';
// import { object, safeParse, string } from 'valibot';
// import { Env } from '../worker';
// import { connect } from 'cloudflare:sockets';

// const feedback = new Hono();

// const input = object({
// 	name: string(),
// 	email: string(),
// 	message: string(),
// 	type: string(),
// });

// feedback.post(
// 	'/',
// 	validator('json', (value, ctx) => {
// 		const parsed = safeParse(input, value);

// 		if (!parsed.success) {
// 			return ctx.json(parsed.issues, 400);
// 		}

// 		return parsed.output;
// 	}),
// 	async (ctx) => {
// 		const { name, email, message, type } = ctx.req.valid('json');

// 		const { LINEAR_TEAM_ID, LINEAR_API_KEY } = env<Env>(ctx);

// 		const linear = new LinearClient({
// 			apiKey: LINEAR_API_KEY,
// 			fetcher: { fetch, connect },
// 		});

// 		const payload = await linear.createIssue({
// 			title: `Feedback from ${name}`,
// 			description: `Email: ${email}\n\n${message}\n\nType: ${type}`,
// 			teamId: LINEAR_TEAM_ID,
// 		});

// 		const issue = await payload.issue;

// 		return ctx.json(issue);
// 	}
// );

// export default feedback;
