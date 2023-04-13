import { Handler, serve } from "http/server";
import { Cache } from "cache";
import { getPage } from "./scrape.ts";

type News = Awaited<ReturnType<typeof getPage>>;

// TTL is 1 day
const cache = new Cache<string, News>(1000 * 60 * 60 * 24 * 7);
// const paginate = async (url: string, page = 1): Promise<News[] | Array<Omit<News, "content">>> => {
//   const res = await fetch(`${url}?mx_page=${page}`, {
//     method: "GET",
//     headers: {
//       "Content-Type": "text/html",
//       "User-Agent":
//         "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
//     },
//   });
//   const html = await res.text();
//   const $ = cheerio.load(html);

//   const news = $(".mx_news_category_item")
//     .map(function (_, element) {
//       const slug = $(element).find("p a").attr("href")!;
//       const url = `${BASE_URL}/${slug}`;

//       return {
//         title: $(element).find("h2 a").text(),
//         excerpt: $(element).find("p:nth-child(3)").text().replace("Lees meer »", "").trim(),
//         date: $(element).find("time").attr("datetime")!,
//         url: url,
//         slug,
//       };
//     })
//     .toArray();

//   const totalPageCount = +$(".mx_pagination ul li:last-child a").text();

//   const hasNextPage = page < totalPageCount;

//   if (hasNextPage) {
//     return news.concat(await paginate(url, page + 1));
//   }

//   return news;
// };

const handler: Handler = async req => {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());

  if (cache.has("nieuws")) {
    return new Response(JSON.stringify(cache.get("nieuws")));
  }

  const data = await getPage(params.page);
  cache.set("nieuws", data);

  return new Response(JSON.stringify(data));
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
