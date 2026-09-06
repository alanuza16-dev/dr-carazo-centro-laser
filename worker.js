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

    return withUtf8Charset(await env.ASSETS.fetch(request));
  }
};

function withUtf8Charset(response) {
  const contentType = response.headers.get("Content-Type") || "";
  const lowerType = contentType.toLowerCase();
  const needsCharset = [
    "text/html",
    "text/css",
    "text/plain",
    "application/javascript",
    "text/javascript",
    "application/json",
    "image/svg+xml"
  ].some((type) => lowerType.startsWith(type));

  if (!needsCharset || lowerType.includes("charset=")) return response;

  const headers = new Headers(response.headers);
  headers.set("Content-Type", `${contentType}; charset=utf-8`);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
