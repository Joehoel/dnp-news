import { serve } from "https://deno.land/std@0.155.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { Cache } from "https://deno.land/x/local_cache/mod.ts";
import { Readability } from "https://esm.sh/@mozilla/readability";
import { JSDOM } from "https://jspm.dev/jsdom";
import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { getQuery } from "https://deno.land/x/oak@v11.1.0/helpers.ts";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";

const app = new Application();
const router = new Router();

const newsSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: z.string(),
  content: z.string(),
  slug: z.string(),
});

type News = z.infer<typeof newsSchema>;

const getPage = async (page: number) => {
  console.log(`Fetching page: ${page}`);
  const res = await fetch(`${BASE_URL}/nieuws?mx_page=${page}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const totalPageCount = +$(".mx_pagination ul li:last-child a").text();

  const news = $(".mx_news_category_item")
    .map(function (_, element) {
      const slug = $(element).find("p a").attr("href")!;
      const url = `${BASE_URL}/${slug}`;

      return {
        title: $(element).find("h2 a").text(),
        excerpt: $(element).find("p:nth-child(3)").text().replace("Lees meer »", "").trim(),
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

  return { data: news, nextPage: page + 1, hasNextPage: page < totalPageCount };
};

const paginate = async (url: string, page = 1) => {
  const res = await fetch(`${url}?mx_page=${page}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const news = $(".mx_news_category_item")
    .map(function (_, element) {
      const slug = $(element).find("p a").attr("href")!;
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

  // Remove all content after the last script tag
  return content?.split("<script").shift()!;

  // const document = new JSDOM(html).window.document;

  // const reader = new Readability(document);

  // const article = reader.parse();

  // return article;
};

// type News = {
//   title: string;
//   excerpt: string;
//   date: string;
//   content?: string;
//   slug: string;
// };

// TTL of 1 week
const cache = new Cache<string, News[]>(604800);
// const cache = new Cache<string, News[]>(0);
const BASE_URL = "https://www.denieuwepsalmberijming.nl";

const paramsSchema = z.object({
  page: z.preprocess(v => parseInt(z.string().parse(v)), z.number().positive()),
});

router
  .get("/", async ctx => {
    const params = paramsSchema.parse(getQuery(ctx, { mergeParams: true }));

    if (cache.get("nieuws")) {
      ctx.response.body = cache.get("nieuws");
    }

    if (params.page) {
      const news = await getPage(params.page);

      ctx.response.body = news;
    } else {
      const news = await paginate(BASE_URL + "/nieuws", 1);

      cache.set("nieuws", news);
      ctx.response.body = news;
    }
  })
  .get("/:slug", ctx => {});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000, hostname: "localhost" });

// serve(async () => {
//   if (cache.get("nieuws")) {
//     return new Response(JSON.stringify(cache.get("nieuws")), {
//       headers: {
//         // Set time to live to 1 week
//         "Cache-Control": "s-maxage=604800",
//       },
//     });
//   }

//   const news = await paginate(BASE_URL + "/nieuws", 1);

//   for (const item of news) {
//     const article = await parse(item.url);

//     item.content = article?.content;
//   }

//   cache.set("nieuws", news);

//   return new Response(JSON.stringify(news), {
//     headers: {
//       // Set time to live to 1 week
//       "Cache-Control": "s-maxage=604800",
//     },
//   });
// });

// Paginate function that traverses all pages and gets all the news items
