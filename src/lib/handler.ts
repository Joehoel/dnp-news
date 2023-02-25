import { Handler } from "server";
import { cache } from "./cache.ts";
import { StreamResponse } from "https://deno.land/x/stream_response@v0.1.0-pre.4/index.ts";
import { streamNews } from "./api.ts";

export const stream: Handler = _ => {
  return new StreamResponse(streamNews(), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const handler: Handler = async req => {
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

      return new Response(JSON.stringify(news), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const news = await paginate(BASE_URL + "/nieuws", 1);

    cache.set("nieuws", news);
    return new Response(JSON.stringify(news), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message ?? "Something went wrong", status: 500 }),
      { status: 500 }
    );
  }
};
