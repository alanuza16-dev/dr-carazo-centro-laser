import { onRequestGet, onRequestOptions, onRequestPost } from "./functions/api/appointment-chat.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/appointment-chat") {
      if (request.method === "GET") return onRequestGet({ request, env });
      if (request.method === "POST") return onRequestPost({ request, env });
      if (request.method === "OPTIONS") return onRequestOptions({ request, env });
      return new Response("Method not allowed", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  }
};
