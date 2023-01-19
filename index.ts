import { serve } from "https://deno.land/std@0.155.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

serve(async () => {
  const res = await fetch("https://www.denieuwepsalmberijming.nl/nieuws");

  const html = await res.text();
  const $ = cheerio.load(html);

  const news = $(".mx_news_category_item")
    .map(function (_, element) {
      // TODO: get content from news item
      return {
        title: $(element).find("h2 a").text(),
        excerpt: $(element).find("p:nth-child(3)").text().split("...")[0] + "...",
        date: $(element).find("time").attr("datetime"),
      };
    })
    .toArray();

  return new Response(JSON.stringify(news));
});
