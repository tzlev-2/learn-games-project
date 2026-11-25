import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const lg = process.env.LG_BUILD === "1";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      config: lg ? "wrangler.lg.jsonc" : "wrangler.jsonc",
    }),
    paths: {
      base: lg ? "/games/passcode" : "",
      relative: false,
    },
  },

  vitePlugin: {
    inspector: true,
  },
};

export default config;
