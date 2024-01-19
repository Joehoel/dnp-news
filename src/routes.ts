import { createCheerioRouter } from 'crawlee';
import { Actor } from 'apify';

interface Article {
	url: string;
	title: string;
	html: string;
	date: string;
}

await Actor.init();

const dataset = await Actor.openDataset<Article>('articles');

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ enqueueLinks, log }) => {
	log.info(`enqueueing new URLs`);
	await enqueueLinks({
		globs: ['https://www.denieuwepsalmberijming.nl/nieuws?mx_page=*'],
		label: 'page',
	});
});

router.addHandler('page', async ({ $, enqueueLinks }) => {
	await enqueueLinks({
		selector: '#mx_news_category a',
		label: 'article',
	});

	const nextButton = $(".mx_pagination a[rel='next']");

	if (nextButton) {
		await enqueueLinks({
			selector: ".mx_pagination a[rel='next']",
			label: 'page',
		});
	}
});

router.addHandler('article', async ({ request, $, log }) => {
	const url = request.loadedUrl;
	const title = $('#content h1').text();
	const html = $('#mx_news_item').html()?.trim();
	const date = $('#content time').attr('datetime');

	if (!html || !date || !title || !url) {
		return;
	}

	log.info(`${title}`, { url });

	await dataset.pushData({
		url,
		title,
		html,
		date,
	});
});
