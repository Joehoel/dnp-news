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

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
	dsn: 'https://b311de4d752fb749bd89e84094954cd9@o4504564317749248.ingest.sentry.io/4506304656703488',
	integrations: [new ProfilingIntegration()],
	// Performance Monitoring
	tracesSampleRate: 1.0,
	// Set sampling rate for profiling - this is relative to tracesSampleRate
	profilesSampleRate: 1.0,
});

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
