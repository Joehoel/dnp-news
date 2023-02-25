import * as cheerio from "cheerio";
import { News, newsSchema } from "../types.ts";
import { BASE_URL } from "./constants.ts";

export async function* streamNews() {
  const res = await fetch(`${BASE_URL}/nieuws?mx_page=${1}`, {
    method: "GET",
    headers: {
      "Content-Type": "text/html",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    },
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const elements = $(".mx_news_category_item").toArray();

  const items = elements.map(element => {
    const title = $(element).find("h2 a").text();
    const excerpt = $(element).find("p:nth-child(3)").text().replace("Lees meer »", "").trim();
    const date = $(element).find("time").attr("datetime")!;
    const slug = $(element).find("p a").attr("href")!;
    const url = `${BASE_URL}/${slug}`;
    const content = "";

    return {
      title,
      excerpt,
      date,
      content,
      url,
      slug,
    };
  });

  yield "[";

  for (const item of items) {
    const article = await parse(item.url);

    if (!article) continue;

    item.content = article;

    yield JSON.stringify(newsSchema.parse(item));
    yield;
  }

  yield "]";
}

export const getPage = async (page: number) => {
  const res = await fetch(`${BASE_URL}/nieuws?mx_page=${1}`, {
    method: "GET",
    headers: {
      "Content-Type": "text/html",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    },
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const elements = $(".mx_news_category_item").toArray();

  const items = elements.map(element => {
    const title = $(element).find("h2 a").text();
    const excerpt = $(element).find("p:nth-child(3)").text().replace("Lees meer »", "").trim();
    const date = $(element).find("time").attr("datetime")!;
    const slug = $(element).find("p a").attr("href")!;
    const url = `${BASE_URL}/${slug}`;
    const content = "";

    return {
      title,
      excerpt,
      date,
      content,
      url,
      slug,
    };
  });

  for (const item of items) {
    const article = await parse(item.url, true);

    item.content = article;

    newsSchema.parse(item);
  }
  const totalPageCount = +$(".mx_pagination ul li:last-child a").text();

  return { data: items, nextPage: page + 1, hasNextPage: page < totalPageCount };
};

export const paginate = async (
  url: string,
  page = 1
): Promise<News[] | Array<Omit<News, "content">>> => {
  const { data: news, hasNextPage } = await getPage(page);

  if (hasNextPage) {
    return news.concat(await paginate(url, page + 1));
  }

  return news;
};

export const parse = async (url: string, nieuwsbrief = false) => {
  const html = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "text/html",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    },
  }).then(res => res.text());
  const $ = cheerio.load(html);

  if (nieuwsbrief) {
    // const href = $("#mx_news_item").find("a",);
    // Find the href where the link contains the word upload
    const href = $("#mx_news_item")
      .find("a")
      .filter(function () {
        return $(this).attr("href")?.includes("upload")!;
      })
      .attr("href")!;

    console.log(href);

    const nieuwsbriefHTML = await fetch(href, {
      method: "GET",
      headers: {
        "Content-Type": "text/html",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
      },
    }).then(res => res.text());

    const content = cheerio.load(nieuwsbriefHTML)("table").html();

    console.log(nieuwsbriefHTML);

    return content;
  }

  const content = $("#mx_news_item").html();

  return content?.split("<script").shift()!;
};
