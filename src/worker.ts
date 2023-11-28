import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { createContext } from './context';
import { createDb } from './db/client';
import { article } from './db/schema';
import { getPage, getPageCount } from './lib/scraper';
import { appRouter } from './router';
import news from './routes/news';
import payments from './routes/payments';

export type Env = {
	DB: D1Database;
	MOLLIE_API_KEY: string;
	LINEAR_API_KEY: string;
	LINEAR_TEAM_ID: string;
};

const app = new Hono<{ Bindings: Env }>();

app.get(
	'*',
	cache({
		cacheName: 'dnp',
		cacheControl: 'max-age=3600',
	})
);

// Setup TRPC server with context
app.use('/trpc/*', async (c, next) => {
	return await trpcServer({
		router: appRouter,
		createContext: async () => {
			return await createContext(c.env.DB);
		},
	})(c, next);
});

app.route('/news', news);
app.route('/payments', payments);
// app.route('/feedback', feedback);

export default {
	fetch: app.fetch,
	async scheduled(_, env) {
		const db = createDb(env.DB);
		const pageCount = await getPageCount();

		console.log({ pageCount });

		for (let i = 1; i <= pageCount; i++) {
			console.log('Scraping page', i);
			const page = await getPage(i);
			const queries = page.data.map((item) => {
				return db
					.insert(article)
					.values(item)
					.onConflictDoUpdate({
						set: {
							title: item.title,
							excerpt: item.excerpt,
							date: item.date,
							url: item.url,
							slug: item.slug,
						},
						target: [article.slug],
					});
			});

			type Query = (typeof queries)[number];

			await db.batch(queries as [Query, ...Query[]]);
		}
	},
} satisfies ExportedHandler<Env>;
