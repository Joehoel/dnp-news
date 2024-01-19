import { CheerioCrawler } from 'crawlee';
import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { router } from './routes.js';
import { Actor } from 'apify';

const startUrls = ['https://www.denieuwepsalmberijming.nl/nieuws'];

const crawler = new CheerioCrawler({
	requestHandler: router,
	maxRequestsPerCrawl: process.env.NODE_ENV === 'production' ? 1000 : 10,
});

await crawler.run(startUrls);
await Actor.exit();

if (process.env.NODE_ENV !== 'production') {
	const jsonFiles = await glob('storage/datasets/default/*.json', {
		absolute: true,
	});

	const results = [];
	for (const file of jsonFiles) {
		const data = JSON.parse(await readFile(file, 'utf-8'));
		results.push(data);
	}

	await writeFile('output.json', JSON.stringify(results, null, 2));
}
