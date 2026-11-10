# @repo/debug-proxy

An internal development tool for working on Sanity Studio in this monorepo (private, never published). It's a local debugging proxy that sits between the studio (or any Sanity client) and the Sanity API, for manually exercising clients under adverse network conditions:

- Server-Sent Events (SSE) connection issues and latency
- Dropped, duplicated, or reordered mutation events
- Network flakiness and (partial) service outage
- Access control issues (by configuring a token with different permissions, or forcing 401s)

It can also be used to quickly verify how clients respond to backend changes by modifying API responses before forwarding them to the client.

## Prerequisites

For this proxy to work, `<projectId>.localhost` must resolve to your local machine. Chrome and Firefox already route `*.localhost` to `127.0.0.1`, but Safari (and possibly other browsers) do not. For those, either add `<projectId>.localhost 127.0.0.1` to `/etc/hosts` or set up dnsmasq.

## Usage

### Quick start: proxy + test studio

```bash
# From the repo root — starts the proxy and the test studio with its
# production workspace pointed at the proxy
pnpm dev:proxy        # studio talks to the proxy over HTTP/2 + TLS (:3051)
pnpm dev:proxy:http1  # studio talks to the proxy over plain HTTP/1.1 (:3050)
```

HTTP/2 is the default since it matches what the studio sees in production. It requires the proxy's TLS certificate to be accepted — see [HTTP/2 and certificate trust](#http2-and-certificate-trust) below for the one-time setup. `dev:proxy:http1` works without any setup but, being a legacy protocol, will trip the studio's slow-connection/legacy-HTTP detection.

### Starting just the proxy

```bash
# From the repo root
pnpm --filter @repo/debug-proxy dev    # watch mode
pnpm --filter @repo/debug-proxy start  # one-off
```

By default the CLI starts a single listener: `https://localhost:3051` — HTTP/2 with HTTP/1.1 fallback via ALPN (TLS). Pass `--http1` to also serve a plain cleartext HTTP/1.1 listener on `http://localhost:3050`. Listeners always bind loopback (`127.0.0.1`) — the proxy injects your API token on every request, so it is deliberately not reachable from other machines.

Configuration is via CLI flags (`--help` for the full list):

- `--port` / `--http1-port` — listener ports (defaults 3051 / 3050)
- `--http1` — also serve the plain HTTP/1.1 listener
- `--force-http1` — don't offer h2 in the TLS handshake, forcing clients down to HTTP/1.1 over TLS; useful for testing how the studio handles a legacy protocol (e.g. the `isUsingLegacyHttp` warning)
- `--api-host` — upstream API (`api.sanity.io` or `api.sanity.work` for staging)
- `--listener-ttl` — disconnect SSE listeners after N seconds to simulate flaky connections
- `--flap <on>[:<off>]` — simulate flapping connectivity (online → offline → online → …): proxy normally for `<on>` seconds, then go "offline" for `<off>` seconds, repeating. While offline, new requests are reset at the socket level and live SSE streams are cut, so clients see real network-failure errors rather than HTTP error responses. A single number means equal phases, e.g. `--flap 30:15` or `--flap 20`
- `--latency <ms>[:<maxMs>]` — delay each request by this many milliseconds before forwarding it upstream, simulating a slow network; a range applies random jitter per request, e.g. `--latency 800` or `--latency 200:1500`
- `--error-probability <0..1>` — simulate an incident: each request independently fails with a random 5xx (`500`/`502`/`503`/`504`) instead of being forwarded upstream, at this probability. The response carries a JSON body shaped like a real Sanity API error, and the upstream is never contacted (so it also covers the "request never reached the backend" case). CORS preflights (`OPTIONS`) are never faulted, so the real request still gets a chance to fail. e.g. `--error-probability 0.2`
- `--expire-token <seconds>` — after `<seconds>`, answer every API request with the API's expired-session 401 (`SIO-401-AEX`) instead of forwarding it upstream, simulating a token that expires mid-session. The studio keeps working until the deadline, then sees its session lapse and enters its re-authentication flow. Use `0` to start expired, e.g. `--expire-token 30` or `--expire-token 0`
- `--revoke-token <seconds>` — like `--expire-token`, but answers with the API's session-not-found 401 (`SIO-401-ANF`, message "Session not found") — what the API returns when the session was revoked on another device, purged, or the stored token is stale. Mutually exclusive with `--expire-token`. Use `0` to start revoked, e.g. `--revoke-token 30`
- `--bearer-401 <seconds>` — like `--expire-token`, but answers with a plain RFC 6750 bearer token 401 (`{"error": "invalid_token"}` plus a `WWW-Authenticate: Bearer error="invalid_token"` header, no Sanity error code). This is a hypothesis for what an expired OAuth access token gets from the API, not a recording. For a studio signing in with `auth.experimental_oauth`: shows whether the studio renews on a 401 that carries no `SIO-401-*` code. Mutually exclusive with `--expire-token` / `--revoke-token`
- `--refuse-refresh <seconds>` — after `<seconds>`, answer every `POST` to the OAuth token endpoint (`/v1/auth/oauth/token`) with the RFC 6749 `invalid_grant` error: the refresh token expired, was redeemed already, or its session was revoked in Manage. For a studio signing in with `auth.experimental_oauth` this is the one failure that ends the session, so it exercises the forced sign-out path. Combine with `--expire-token` to force a renewal first (`--expire-token 30 --refuse-refresh 30`: the first request after 30s gets a 401, the renewal it triggers is refused, the studio signs out). Not re-armed: a code exchange after a fresh sign-in is refused too, so restart the proxy to sign in again. Use `0` to refuse immediately
- Fault toggles: `--sse-faults`, `--drop-probability`, `--reset-probability`, `--org-401`

### OAuth studios (`auth.experimental_oauth`)

A studio that signs in with OAuth talks to three more endpoints, `/v1/auth/oauth/{authorize,token,revoke}`, and never sends its session to them. `--expire-token`, `--revoke-token` and `--bearer-401` forward all three upstream and treat a token endpoint request (a code exchange or a refresh) as a re-authentication that re-arms the deadline, so a studio that renews keeps working until the deadline passes again. Two things to know before pointing an OAuth studio at the proxy:

- The studio derives the authorization server's issuer from its `apiHost`, so through the proxy it expects `iss=https://<projectId>.localhost:3051`. If the real server puts `iss=https://api.sanity.io` on the authorization response (RFC 9207), the callback fails with `issuer mismatch` and nothing signs in. Either register the studio origin as a redirect URL and sign in without the proxy first (the token pair in localStorage is then used through the proxy), or make the studio compare `iss` against a configured issuer instead of the API host.
- Do not set `SANITY_TOKEN`: the proxy would replace the studio's OAuth bearer token on every request, and a token scenario would then act on the proxy's token, not the studio's.

Pass flags through pnpm like so:

```bash
pnpm --filter @repo/debug-proxy dev --sse-faults --drop-probability 0.2
```

The one exception is the API token, which is a secret and stays out of argv: set `SANITY_TOKEN` in the shell or in a `.env` file in this directory (see `.env.example`). It is injected as `Authorization: Bearer` and required for write operations or private datasets when using cookie-based auth.

### HTTP/2 and certificate trust

Browsers only speak HTTP/2 over TLS, so the `:3051` listener terminates TLS. Because the proxy is addressed by arbitrary `<projectId>.localhost` hostnames — and browsers reject `*.localhost` wildcard certificates (a wildcard needs at least two labels under it) — no single static cert can cover them all. Instead, the proxy mints a certificate for each hostname on demand (via the TLS SNI callback) and caches it in `.certs/sni/`:

- **With [mkcert](https://github.com/FiloSottile/mkcert) installed** (recommended, one-time setup):

  ```bash
  brew install mkcert && mkcert -install
  ```

  Minted certs are signed by mkcert's locally-trusted CA, so every project host works with zero warnings and zero per-project configuration.

- **Without mkcert**, minted certs are self-signed: open `https://<projectId>.localhost:3051/v1/ping` in the browser once per host and accept the warning ("Advanced" → "Proceed"), then reload the studio.

If a `key.pem`/`cert.pem` pair exists in `.certs/`, the proxy prefers it for any hostname it actually covers and mints for the rest.

The upstream hop (proxy → api.sanity.io) is always HTTP/1.1 — the protocol that matters for debugging is the one the browser negotiates with the proxy.

### Pointing the studio at the proxy manually

`pnpm dev:proxy` sets `SANITY_STUDIO_USE_DEBUG_PROXY=true` (HTTP/2 over TLS, `apiHost: 'https://localhost:3051'`); `pnpm dev:proxy:http1` sets it to `http1` (plain HTTP/1.1, `apiHost: 'http://localhost:3050'`). See `envConfig` in `dev/test-studio/sanity.config.ts`. You can also set the env var yourself when starting the studio, e.g. to run the proxy with custom fault scenarios:

```bash
SANITY_STUDIO_USE_DEBUG_PROXY=true pnpm dev
```

For any other Sanity client:

```ts
const proxiedClient = client.withConfig({apiHost: 'http://localhost:3050'})
```

## Use as a library

Instead of the env-driven CLI, you can embed a configured proxy programmatically:

```ts
import {
  createDebugProxy,
  createSSEProxy,
  dropMutations,
  duplicateMutations,
  isListenEndpoint,
  randomLatency,
} from '@repo/debug-proxy'

const proxy = createDebugProxy({
  port: 3050,
  apiHost: 'api.sanity.io',
  token: process.env.SANITY_TOKEN,
  routes: [
    {
      // Apply SSE fault scenarios to the listener endpoint
      match: isListenEndpoint(),
      handler: createSSEProxy((events$) =>
        events$.pipe(duplicateMutations(0.2), randomLatency(100, 2_000), dropMutations(0.1)),
      ),
    },
  ],
})

await proxy.listen()
// ...later
await proxy.close()
```

Routes are matched in order — the first route whose `match` returns `true` wins. Requests that match no route fall through to a transparent pass-through proxy (override it via `defaultHandler`).

### Building blocks

- `createDebugProxy(config)` — the server factory; returns `{server, listen, close, port}`.
- `createRequestProxy({transformHeaders?, transformBody?})` — the core proxy primitive (RxJS operators over response headers/body).
- `createSSEProxy(operator?)` — builds on `createRequestProxy` for streaming endpoints; parses the byte stream into discrete `SSEEvent`s.
- Scenarios (RxJS operators over the SSE event stream): `randomLatency`, `sendReset`, `duplicateMutations`, `dropMutations`, `shuffleEventDelivery`.
- `invalidSession(handler, isInvalid?, {errorCode?, onReauthenticated?})` — wraps a handler so that, once `isInvalid()` returns true, every request is answered with one of the API's invalid-session 401s instead of being forwarded upstream. `errorCode` picks the variant: `SIO-401-AEX` (expired, the default), `SIO-401-ANF` (session not found — revoked, purged, or a stale stored token) or `invalid_token` (a plain RFC 6750 bearer challenge without a Sanity error code). The OAuth endpoints (`/auth/oauth/*`) are forwarded like `/auth/fetch`, and a token endpoint request fires `onReauthenticated` too. `expiredToken(handler, isExpired?, {onReauthenticated?})` is the same scenario preconfigured for `SIO-401-AEX`. Either way, CORS preflights pass through, public auth endpoints like `/auth/providers` are forwarded so the login screen can still render, and `/auth/logout` is always answered with a synthetic 204 — never forwarded — so the studio can tear the session down without invalidating your real credentials. Re-login works while the session is invalid: `/auth/fetch` (the token exchange the studio runs after a login callback) is forwarded upstream rather than 401'd, and `onReauthenticated` fires so the caller can re-arm the deadline — the CLI uses this so `--expire-token` / `--revoke-token` re-arm after you log back in, letting the session lapse again without a restart. Pair with a time-based predicate to invalidate the session mid-run, or scope it to `isAuthEndpoint()` to fail only the auth probes.
- `createConnectionFlapper({onlineMs, offlineMs})` — cycles simulated connectivity; `flapper.wrap(handler)` makes any handler's requests fail like a dead network during the offline phases (and cuts in-flight streams on each transition).
- `withLatency(handler, {minMs, maxMs})` — holds each request back by a random delay in the range before forwarding it upstream.
- `intermittentServiceErrors(probability)` — wraps a handler so that, with the given probability, a request short-circuits with a synthetic random 5xx response instead of being forwarded upstream (skipping `OPTIONS` preflights). Use it to simulate an incident where endpoints intermittently return various server errors.
- `refusedRefreshToken(handler, isRefused?)` — wraps a handler so that, once `isRefused()` returns true, every `POST` to the OAuth token endpoint is answered with the RFC 6749 `invalid_grant` error instead of being forwarded. Everything else passes through, including the API requests the current access token still authenticates.
- Route matchers: `urlIncludes`, `isListenEndpoint`, `isGetOrgIdEndpoint`, `isAuthEndpoint`, `isLogoutEndpoint`, `isAuthFetchEndpoint`, `isOAuthEndpoint`, `isOAuthTokenEndpoint`, `isPublicEndpoint`, `anyOf`, `allOf`.

## Writing a new scenario

A scenario is just an RxJS operator over the stream of parsed SSE events (`Observable<SSEEvent>`, where an `SSEEvent` is a `message`, `comment`, or `retry`). `createSSEProxy` parses the upstream byte stream into discrete events, runs them through your operator, and re-serializes whatever comes out — so a scenario can delay, drop, duplicate, reorder, or rewrite events with plain RxJS.

Say you want to simulate the API occasionally sending mutation events with an empty payload:

```ts
// src/scenarios.ts
/** Replace mutation payloads with `{}` at the given probability. */
export function truncateMutations(probability: number): MonoTypeOperatorFunction<SSEEvent> {
  return map((event) =>
    event.type === 'message' && event.message.event === 'mutation' && Math.random() < probability
      ? {...event, message: {...event.message, data: '{}'}}
      : event,
  )
}
```

Then:

1. **Export it** from `src/index.ts` alongside the other scenarios.
2. **Wire it up** — either compose it into the listener route in `src/cli.ts` (optionally behind a new flag, following the `--drop-probability` pattern) or pass it in a custom route when using the library API:

   ```ts
   {match: isListenEndpoint(), handler: createSSEProxy((events$) => events$.pipe(truncateMutations(0.1)))}
   ```

Conventions worth keeping: key off `event.message.event === 'mutation'` (or whichever event type you're targeting) and pass everything else through untouched — the `welcome` handshake event in particular must reach the client for the listener to work. Scenarios compose with `pipe(...)`, so prefer several small single-purpose operators over one configurable mega-operator.

## Limitations

**Upstream protocol:** the proxy always talks HTTP/1.1 to the upstream API. The browser-facing protocol (HTTP/1.1 on `:3050`, HTTP/2 on `:3051`) is what clients observe and react to; the upstream hop is not part of what's being simulated.

**WebSockets:** upgrade requests (e.g. the bifur client's `wss://…/socket/…`) are tunneled transparently to the upstream — the handshake is forwarded and raw bytes are piped both ways — so socket connections work through the proxy, but routes and fault scenarios don't apply to them.
