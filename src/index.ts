import { serve } from "server";
import { handler, stream } from "./lib/handler.ts";

await serve(stream, { port: 8000 });
