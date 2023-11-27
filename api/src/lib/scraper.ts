import { load } from 'cheerio';
import { BASE_URL } from '../constants';
import { InsertArticle, insertArticleSchema } from '../db/schema';
import { parse, parseAsync } from 'valibot';

export async function getPageCount() {
	const url = `${BASE_URL}/nieuws?mx_page=1`;

	const response = await fetch(url, {
		headers: {
			'Content-Type': 'text/html',
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
		},
	});
	const html = await response.text();
	const $ = load(html);

	const totalPageCount = +$('.mx_pagination ul li:last-child a').text();

	return totalPageCount;
}

export async function getPage(page: number | string = 1) {
	const url = `${BASE_URL}/nieuws?mx_page=${page}`;

	const response = await fetch(url, {
		headers: {
			'Content-Type': 'text/html',
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
		},
	});
	const html = await response.text();
	const $ = load(html);

	const totalPageCount = +$('.mx_pagination ul li:last-child a').text();

	const news = $('.mx_news_category_item')
		.map(function (_, element): InsertArticle {
			const slug = $(element).find('p a').attr('href')!.slice(1).split('/')[1];
			const url = `${BASE_URL}/nieuws/${slug}`;

			return {
				title: $(element).find('h2 a').text(),
				excerpt: $(element).find('p:nth-child(3)').text().replace('Lees meer »', '').trim(),
				date: $(element).find('time').attr('datetime')!,
				content: '',
				url: url,
				slug,
			};
		})
		.toArray();

	for (const item of news) {
		const content = await getArticleContent(item.url);
		item.content = content;
		await parseAsync(insertArticleSchema, item);
	}

	console.log('Done fetching page: ' + page);

	return {
		data: news,
		nextPage: +page + 1,
		hasNextPage: +page < totalPageCount,
	};
}

async function getArticleContent(url: string) {
	const response = await fetch(url, {
		headers: {
			'Content-Type': 'text/html',
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
		},
	});

	const html = await response.text();

	const $ = load(html);
	$('.mx_share').remove();
	$('.back').remove();

	const content = $('#mx_news_item').html()?.trim();

	return content!;
}
