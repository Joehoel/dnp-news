import { serve } from "https://deno.land/std@0.155.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
type News = {
  title: string;
  excerpt: string;
  date: string;
};

const BASE_URL = "https://www.denieuwepsalmberijming.nl";
serve(async () => {
  const news = await paginate(BASE_URL + "/nieuws", 1);

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
      return {
        title: $(element).find("h2 a").text(),
        excerpt: $(element).find("p:nth-child(3)").text().replace("Lees meer »", "").trim(),
        date: $(element).find("time").attr("datetime")!,
        url: `${BASE_URL}${$(element).find("p a").attr("href")!}`,
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
