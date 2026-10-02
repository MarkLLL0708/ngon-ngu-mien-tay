import { createFileRoute } from "@tanstack/react-router";

function readCookie(header: string | null, name: string) {
  const m = (header ?? "").match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]!) : "";
}

export const Route = createFileRoute("/api/public/auth/zalo/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = url.origin;
        const fail = (code: string) => {
          const h = new Headers({ Location: `${origin}/login#zalo_error=${code}`, "Cache-Control": "no-store" });
          h.append("Set-Cookie", "zalo_pkce=; Path=/api/public/auth/zalo; Max-Age=0");
          h.append("Set-Cookie", "zalo_state=; Path=/api/public/auth/zalo; Max-Age=0");
          return new Response(null, { status: 302, headers: h });
        };
        try {
          const appId = process.env["ZALO_APP_ID"];
          const secret = process.env["ZALO_SECRET_KEY"];
          if (!appId || !secret) return fail("not_configured");
          const code = url.searchParams.get("code") ?? "";
          const state = url.searchParams.get("state") ?? "";
          const cookies = request.headers.get("cookie");
          const verifier = readCookie(cookies, "zalo_pkce");
          if (!code || code.length > 2048) return fail("denied");
          if (!state || state !== readCookie(cookies, "zalo_state") || !verifier) return fail("state");

          // Token exchange — Zalo wants app_id in body and secret_key as a header.
          const tokenRes = await fetch("https://oauth.zaloapp.com/v4/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", secret_key: secret },
            body: new URLSearchParams({ code, app_id: appId, grant_type: "authorization_code", code_verifier: verifier }),
          });
          const token = (await tokenRes.json().catch(() => ({}))) as { access_token?: string };
          if (!token.access_token) { console.error("zalo token exchange failed", tokenRes.status); return fail("token"); }

          // Profile — Zalo wants the token in an `access_token` header, not Bearer.
          const meRes = await fetch("https://graph.zalo.me/v2.0/me?fields=id,name,picture", { headers: { access_token: token.access_token } });
          const me = (await meRes.json().catch(() => ({}))) as { id?: string; name?: string; picture?: { data?: { url?: string } }; error?: number };
          if (!me.id || !/^\d{1,32}$/.test(me.id)) { console.error("zalo profile failed", meRes.status, me.error); return fail("profile"); }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const email = `zalo_${me.id}@zalo.tangpt.app`;
          const meta = { provider: "zalo", zalo_id: me.id, full_name: (me.name ?? "").slice(0, 100), avatar_url: me.picture?.data?.url ?? "" };
          const created = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, user_metadata: meta, app_metadata: { provider: "zalo", providers: ["zalo"] } });
          if (created.error && !/already|registered|exists/i.test(created.error.message)) { console.error("zalo createUser", created.error.message); return fail("account"); }

          // One-time, short-lived token the browser redeems for a normal session.
          const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
          const hashed = link.data?.properties?.hashed_token;
          if (link.error || !hashed) { console.error("zalo generateLink", link.error?.message); return fail("session"); }

          const h = new Headers({ Location: `${origin}/login#zalo_token=${encodeURIComponent(hashed)}`, "Cache-Control": "no-store" });
          h.append("Set-Cookie", "zalo_pkce=; Path=/api/public/auth/zalo; Max-Age=0");
          h.append("Set-Cookie", "zalo_state=; Path=/api/public/auth/zalo; Max-Age=0");
          return new Response(null, { status: 302, headers: h });
        } catch (e) {
          console.error("zalo callback error", e instanceof Error ? e.message : e);
          return fail("unknown");
        }
      },
    },
  },
});
