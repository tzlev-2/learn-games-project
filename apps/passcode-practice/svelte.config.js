import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const isPilot = process.env.PASSCODE_PILOT === "1";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      config: isPilot ? "wrangler.pilot.jsonc" : "wrangler.jsonc",
    }),
    paths: {
      base: isPilot ? "/games/passcode" : "",
      relative: false,
    },
  },

  vitePlugin: {
    inspector: true,
  },
};

export default config;
