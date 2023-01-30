import { serve } from "https://deno.land/std@0.155.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { Cache } from "https://deno.land/x/local_cache/mod.ts";
import { Readability } from "https://esm.sh/@mozilla/readability";
import { JSDOM } from "https://jspm.dev/jsdom";
type News = {
  title: string;
  excerpt: string;
  date: string;
  content?: string;
  slug: string;
};

// TTL of 1 week
const cache = new Cache<string, News[]>(604800);
// const cache = new Cache<string, News[]>(0);

const BASE_URL = "https://www.denieuwepsalmberijming.nl";

serve(async () => {
  if (cache.get("nieuws")) {
    return new Response(JSON.stringify(cache.get("nieuws")), {
      headers: {
        // Set time to live to 1 week
        "Cache-Control": "s-maxage=604800",
      },
    });
  }

  const news = await paginate(BASE_URL + "/nieuws", 1);

  for (const item of news) {
    const article = await parse(item.url);

    item.content = article?.content;
  }

  cache.set("nieuws", news);

  return new Response(JSON.stringify(news), {
    headers: {
      // Set time to live to 1 week
      "Cache-Control": "s-maxage=604800",
    },
  });
});

// Paginate function that traverses all pages and gets all the news items
const paginate = async (url: string, page = 1) => {
  const res = await fetch(`${url}?mx_page=${page}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const news = $(".mx_news_category_item")
    .map(function (_, element) {
      const slug = $(element).find("p a").attr("href")!.replace("/", "");
      const url = `${BASE_URL}/${slug}`;

      return {
        title: $(element).find("h2 a").text(),
        excerpt: $(element).find("p:nth-child(3)").text().replace("Lees meer »", "").trim(),
        date: $(element).find("time").attr("datetime")!,
        url: url,
        slug,
      };
    })
    .toArray();

  const totalPageCount = +$(".mx_pagination ul li:last-child a").text();

  const hasNextPage = page < totalPageCount;

  if (hasNextPage) {
    return news.concat(await paginate(url, page + 1));
  }

  return news;
};

const parse = async (url: string) => {
  const html = await fetch(url).then(res => res.text());

  const $ = cheerio.load(html);

  const content = $("#mx_news_item").html();

  console.log(url);

  return { content };

  // const document = new JSDOM(html).window.document;

  // const reader = new Readability(document);

  // const article = reader.parse();

  // return article;
};
