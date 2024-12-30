// @ts-check
import htmx from "astro-htmx";
import { defineConfig, envField } from "astro/config";
import mkcert from "vite-plugin-mkcert";

import node from "@astrojs/node";

import alpinejs from "@astrojs/alpinejs";
import tailwind from "@astrojs/tailwind"; // https://astro.build/config

import pageInsight from "astro-page-insight";

// https://astro.build/config
export default defineConfig({
  image: {
    domains: ["images.unsplash.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cms.optimizely.com",
      },
    ],
  },

  i18n: {
    // locales: ["es", "en", "pt-br"],
    locales: ["en", "es"],
    defaultLocale: "en",
    routing: "manual",
    // routing: {
    //     prefixDefaultLocale: true
    // }
    fallback: {
      es: "en"
    },
  },

  output: "server",

  adapter: node({
    mode: "standalone",
  }),

  server: { port: 4321 },
  vite: {
    ssr: {
      noExternal: ["graphql", "graphql-request"],
    },
    plugins: [mkcert()],
  },
  integrations: [tailwind(), alpinejs(), htmx(), pageInsight()],
  
  env: {
    schema: {
      OPTIMIZELY_GRAPH_SECRET: envField.string({context: "server", access: "secret", optional: false}),
      OPTIMIZELY_GRAPH_APP_KEY: envField.string({context: "client", access: "public", optional: false}),
      OPTIMIZELY_GRAPH_SINGLE_KEY: envField.string({context: "client", access: "public", optional: false}),
      OPTIMIZELY_GRAPH_GATEWAY: envField.string({context: "client", access: "public", optional: false}),
    }
  }
});
