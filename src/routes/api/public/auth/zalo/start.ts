import { createFileRoute } from "@tanstack/react-router";

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const Route = createFileRoute("/api/public/auth/zalo/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const appId = process.env["ZALO_APP_ID"];
        const origin = new URL(request.url).origin;
        if (!appId) return Response.redirect(`${origin}/login#zalo_error=not_configured`, 302);
        const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
        const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
        const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
        const redirectUri = `${origin}/api/public/auth/zalo/callback`;
        const url = new URL("https://oauth.zaloapp.com/v4/permission");
        url.searchParams.set("app_id", appId);
        url.searchParams.set("redirect_uri", redirectUri);
        url.searchParams.set("code_challenge", challenge);
        url.searchParams.set("state", state);
        const cookie = (n: string, v: string) => `${n}=${v}; Path=/api/public/auth/zalo; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
        const headers = new Headers({ Location: url.toString(), "Cache-Control": "no-store" });
        headers.append("Set-Cookie", cookie("zalo_pkce", verifier));
        headers.append("Set-Cookie", cookie("zalo_state", state));
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
