import { Cache } from "cache";
import { News } from "../types.ts";

export const cache = new Cache<string, News[]>(604800);
