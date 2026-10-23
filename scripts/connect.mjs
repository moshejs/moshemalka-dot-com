#!/usr/bin/env node
/**
 * One-time OAuth hookup for the homepage "Right now" section.
 *
 *   node scripts/connect.mjs spotify
 *   node scripts/connect.mjs oura
 *
 * Reads client IDs/secrets from .env.local, opens the provider's consent page,
 * catches the redirect on http://127.0.0.1:8888/callback, exchanges the code,
 * then:
 *   spotify → writes SPOTIFY_REFRESH_TOKEN to .env.local (it never rotates)
 *   oura    → seeds the token pair into Upstash Redis (refresh tokens rotate)
 *
 * Register http://127.0.0.1:8888/callback as the redirect URI in both apps
 * (Spotify rejects "localhost"). If an app is registered with a different
 * loopback URI, set SPOTIFY_REDIRECT_URI / OURA_REDIRECT_URI to match it.
 */
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ENV_FILE = ".env.local";
const DEFAULT_REDIRECT_URI = "http://127.0.0.1:8888/callback";

const PROVIDERS = {
  spotify: {
    authorize: "https://accounts.spotify.com/authorize",
    token: "https://accounts.spotify.com/api/token",
    scope: "user-read-currently-playing user-read-recently-played user-top-read",
    idKey: "SPOTIFY_CLIENT_ID",
    secretKey: "SPOTIFY_CLIENT_SECRET",
    redirectKey: "SPOTIFY_REDIRECT_URI",
  },
  oura: {
    authorize: "https://cloud.ouraring.com/oauth/authorize",
    token: "https://api.ouraring.com/oauth/token",
    scope: "daily heartrate personal",
    idKey: "OURA_CLIENT_ID",
    secretKey: "OURA_CLIENT_SECRET",
    redirectKey: "OURA_REDIRECT_URI",
  },
};

function readEnv() {
  const env = { ...process.env };
  if (existsSync(ENV_FILE)) {
    for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && m[2]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

function setEnvVar(key, value) {
  const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8").split("\n") : [];
  const i = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (i >= 0) lines[i] = `${key}=${value}`;
  else lines.splice(lines.at(-1) === "" ? lines.length - 1 : lines.length, 0, `${key}=${value}`);
  writeFileSync(ENV_FILE, lines.join("\n").replace(/\n?$/, "\n"));
}

// Listen on the redirect URI's own loopback host and port. "localhost" may
// resolve to either stack in the browser, so cover both.
function waitForCode(redirectUri, state) {
  const target = new URL(redirectUri);
  const port = Number(target.port) || 80;
  const hosts =
    target.hostname === "localhost" ? ["127.0.0.1", "::1"] : [target.hostname.replace(/^\[|\]$/g, "")];
  const servers = [];
  const closeAll = () => servers.forEach((s) => s.close());
  return new Promise((resolve, reject) => {
    const handler = (req, res) => {
      const url = new URL(req.url, redirectUri);
      if (url.pathname !== target.pathname) return res.writeHead(404).end();
      const done = (status, msg) => {
        res.writeHead(status, { "Content-Type": "text/plain" }).end(msg);
        closeAll();
      };
      if (url.searchParams.get("state") !== state) {
        done(400, "State mismatch. Close this tab and run the script again.");
        return reject(new Error("OAuth state mismatch"));
      }
      const error = url.searchParams.get("error");
      if (error) {
        done(400, `Authorization failed: ${error}`);
        return reject(new Error(error));
      }
      done(200, "Got it. You can close this tab; the terminal finishes the setup.");
      resolve(url.searchParams.get("code"));
    };
    for (const host of hosts) {
      const server = createServer(handler);
      server.on("error", (err) => {
        // ::1 can be unavailable when IPv6 is off; the IPv4 listener suffices.
        if (host === "::1" && err.code === "EADDRNOTAVAIL") return;
        closeAll();
        reject(err);
      });
      server.listen(port, host);
      servers.push(server);
    }
  });
}

async function main() {
  const name = process.argv[2];
  const p = PROVIDERS[name];
  if (!p) {
    console.error("Usage: node scripts/connect.mjs <spotify|oura>");
    process.exit(1);
  }
  const env = readEnv();
  const clientId = env[p.idKey];
  const clientSecret = env[p.secretKey];
  if (!clientId || !clientSecret) {
    console.error(`Set ${p.idKey} and ${p.secretKey} in ${ENV_FILE} first.`);
    process.exit(1);
  }
  const redisUrl = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const redisToken = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (name === "oura" && !(redisUrl && redisToken)) {
    console.error(
      `Oura needs the Redis store. Add Upstash Redis to the Vercel project, then copy\n` +
        `KV_REST_API_URL and KV_REST_API_TOKEN into ${ENV_FILE} (vercel env pull does this).`
    );
    process.exit(1);
  }

  const redirectUri = env[p.redirectKey] || DEFAULT_REDIRECT_URI;
  const state = randomBytes(16).toString("hex");
  const authUrl = `${p.authorize}?${new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: p.scope,
    state,
  })
    // URLSearchParams encodes spaces as "+", which Oura reads literally (one
    // unknown scope, so the token gets no scopes). %20 works for both.
    .toString()
    .replace(/\+/g, "%20")}`;
  const codePromise = waitForCode(redirectUri, state);
  console.log(`Redirect URI: ${redirectUri} (must match the app's settings exactly)`);
  console.log(`Opening ${name} consent page. If it doesn't open, visit:\n\n  ${authUrl}\n`);
  execFile("open", [authUrl], () => {});
  const code = await codePromise;

  const res = await fetch(p.token, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    console.error(`Token exchange failed (${res.status}): ${await res.text()}`);
    process.exit(1);
  }
  const tokens = await res.json();

  if (name === "spotify") {
    setEnvVar("SPOTIFY_REFRESH_TOKEN", tokens.refresh_token);
    console.log(`Saved SPOTIFY_REFRESH_TOKEN to ${ENV_FILE}. Add the same value in Vercel.`);
    return;
  }

  const pair = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in - 3600) * 1000,
  };
  const put = await fetch(redisUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken}` },
    body: JSON.stringify(["SET", "oura:tokens", JSON.stringify(pair)]),
  });
  if (!put.ok) {
    console.error(`Saving to Redis failed (${put.status}): ${await put.text()}`);
    process.exit(1);
  }
  console.log("Seeded Oura tokens into Redis. The site refreshes them from here on.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
