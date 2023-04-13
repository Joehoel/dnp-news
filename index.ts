import { Handler, serve } from "https://deno.land/std@0.175.0/http/server.ts";
import { Cache } from "https://deno.land/x/local_cache/mod.ts";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const newsSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: z.string(),
  content: z.string(),
  slug: z.string(),
});

type News = z.infer<typeof newsSchema>;

// TTL of 1 week
type Value = Awaited<ReturnType<typeof getPage>>;

const cache = new Cache<string, Value>(604800);
// const cache = new Cache<string, News[]>(0);
const BASE_URL = "https://www.denieuwepsalmberijming.nl";

const getPage = async (page: number) => {
  console.log(`Fetching page: ${BASE_URL}/nieuws?mx_page=${page}`);
  const res = await fetch(`${BASE_URL}/nieuws?mx_page=${page}`, {
    method: "GET",
    headers: {
      "Content-Type": "text/html",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    },
  });
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

const paginate = async (url: string, page = 1): Promise<News[] | Array<Omit<News, "content">>> => {
  const res = await fetch(`${url}?mx_page=${page}`, {
    method: "GET",
    headers: {
      "Content-Type": "text/html",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    },
  });
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
  const html = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "text/html",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    },
  }).then(res => res.text());

  const $ = cheerio.load(html);

  const content = $("#mx_news_item").html();

  return content?.split("<script").shift()!;
};

const handler: Handler = async req => {
  try {
    const url = new URL(req.url);

    // Get the search params as number
    const params = Object.fromEntries(url.searchParams.entries());

    if (cache.get("nieuws")) {
      return new Response(JSON.stringify(cache.get("nieuws")), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (params.page) {
      const news = await getPage(parseInt(params.page));
      cache.set("nieuws", news);

      return new Response(JSON.stringify(news), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify([]), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message ?? "Something went wrong", status: 500 }), {
      status: 500,
    });
  }
};

await serve(handler, { port: 8000 });

// router
//   .get("/", async ctx => {
//     const params = paramsSchema.parse(getQuery(ctx, { mergeParams: true }));

//     if (cache.get("nieuws")) {
//       ctx.response.body = cache.get("nieuws");
//     }

//     if (params.page) {
//       const news = await getPage(params.page);

//       ctx.response.body = news;
//     } else {
//       const news = await paginate(BASE_URL + "/nieuws", 1);

//       cache.set("nieuws", news);
//       ctx.response.body = news;
//     }
//   })
//   .get("/:slug", ctx => {});

// app.use(router.routes());
// app.use(router.allowedMethods());

// app.addEventListener("listen", ({ port }) => {
//   console.log(`Listening on: localhost:${port}`);
// });

// app.listen({ port: parseInt(Deno.env.get("PORT") || "8080") });

// addEventListener("fetch", app.handle);

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
