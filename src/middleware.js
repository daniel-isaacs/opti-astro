import {defineMiddleware, sequence} from "astro:middleware";
import { middleware } from "astro:i18n"; // Astro's own i18n routing config

export const userMiddleware = defineMiddleware(async (ctx, next) => {
  // this response might come from Astro's i18n middleware, and it might return a 404
  const response = await next();
  // the /about page is an exception and we want to render it

  //   console.log("middleware: ", ctx.url)
  console.log("middleware: ", ctx.url.href)
  if (ctx.url.pathname.startsWith("/preview")) {
    console.log("middleware pathname: ", ctx.url.pathname)
    // return next();
    return response;
    // return new Response("Preview", {
    //   status: 200
    // });
  } else {
    return response;
  }
});

export const onRequest = sequence(
  userMiddleware,
  middleware({
    prefixDefaultLocale: true
  })
)