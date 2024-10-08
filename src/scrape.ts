import * as cheerio from "cheerio";
import { BASE_URL } from "./constants.ts";
import { newsSchema } from "./types.ts";
import { parse } from "./parse.ts";
import ky from "ky";

const dnp = ky.create({
  prefixUrl: BASE_URL,
  headers: {
    "Content-Type": "text/html",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  },
});

export async function getPage(page: number | string = 1) {
  console.log(`Fetching page: ${BASE_URL}nieuws?mx_page=${page}`);
  const res = await dnp.get("nieuws?mx_page=" + page);
  const html = await res.text();
  const $ = cheerio.load(html);

  const totalPageCount = +$(".mx_pagination ul li:last-child a").text();

  const news = $(".mx_news_category_item_new")
    .map(function (_, element) {
      const slug = $(element).find("a").attr("href")!.slice(1);
      const url = `${BASE_URL}${slug}`;

      return {
        title: $(element).find("h3").text().trim(),
        excerpt: $(element).find("p:nth-child(3)").text().trim(),
        date: $(element).find("time").attr("datetime")!,
        content: "",
        url: url,
        slug,
      };
    })
    .toArray();

  for (const item of news) {
    const article = await parse(item.url);

    item.content = article;

    newsSchema.parse(item);
  }

  console.log("Done fetching page: " + page);

  return {
    data: news,
    nextPage: +page + 1,
    hasNextPage: +page < totalPageCount,
  };
}
