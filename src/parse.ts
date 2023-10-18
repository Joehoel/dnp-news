import * as cheerio from "cheerio";

export async function parse(url: string) {
  const html = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "text/html",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    },
  }).then((res) => res.text());

  const $ = cheerio.load(html);

  const content = $("#mx_news_item").html();

  return content?.split("<script").shift()!;
}
