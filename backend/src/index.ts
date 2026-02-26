import { config } from "dotenv";
import { resolve } from "path";

// Load .env from backend/ first, then fall back to root .env
config(); // tries ./backend/.env (if CWD is backend/)
config({ path: resolve(process.cwd(), "../.env") }); // tries root .env
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { generateRoute } from "./routes/generate.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api", generateRoute);

const port = Number(process.env.PORT) || 3001;

console.log(`Crusties backend running on port ${port}`);

serve({ fetch: app.fetch, port });

export default app;
