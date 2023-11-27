import { and, eq, ne } from 'drizzle-orm';
import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { createDb } from '../db/client';
import { article } from '../db/schema';
import { Bindings } from '../worker';

import { withCursorPagination } from 'drizzle-pagination';
import { object, optional, safeParse, string } from 'valibot';

const news = new Hono<{ Bindings: Bindings }>();

const input = object({
	cursor: optional(string()),
	limit: optional(string()),
});

news.get(
	'/',
	validator('query', (value, ctx) => {
		const parsed = safeParse(input, value);

		if (!parsed.success) {
			return ctx.json(parsed.issues, 400);
		}

		return parsed.output;
	}),
	async (ctx) => {
		const { cursor, limit } = ctx.req.valid('query');

		const db = createDb(ctx.env.DB);

		const articles = await db.query.article.findMany(
			withCursorPagination({
				limit: parseInt(limit ?? '10', 10),
				cursors: [[article.date, 'desc', cursor]],
				where: ne(article.content, ''),
			})
		);

		// Cache the data for 1 day
		ctx.res.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=300');
		// Expires in 1 day
		ctx.res.headers.set('Expires', new Date(Date.now() + 86400 * 1000).toUTCString());
		return ctx.json({ data: articles, cursor: articles.at(-1)?.date ?? null });
	}
);

news.get('/:slug', async (ctx) => {
	const db = createDb(ctx.env.DB);

	const slug = ctx.req.param('slug');

	const found = await db.query.article.findFirst({
		where: and(eq(article.slug, slug), ne(article.content, '')),
	});

	if (!found) {
		return ctx.json({ error: 'Article not found' }, 404);
	}

	// Cache the data for 1 day
	ctx.res.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=300');
	// Expires in 1 day
	ctx.res.headers.set('Expires', new Date(Date.now() + 86400 * 1000).toUTCString());

	return ctx.json(found);
});

export default news;
