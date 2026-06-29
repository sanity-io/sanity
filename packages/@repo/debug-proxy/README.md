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
- Fault toggles: `--sse-faults`, `--drop-probability`, `--reset-probability`, `--org-401`

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
- `createConnectionFlapper({onlineMs, offlineMs})` — cycles simulated connectivity; `flapper.wrap(handler)` makes any handler's requests fail like a dead network during the offline phases (and cuts in-flight streams on each transition).
- `withLatency(handler, {minMs, maxMs})` — holds each request back by a random delay in the range before forwarding it upstream.
- `intermittentServiceErrors(probability)` — wraps a handler so that, with the given probability, a request short-circuits with a synthetic random 5xx response instead of being forwarded upstream (skipping `OPTIONS` preflights). Use it to simulate an incident where endpoints intermittently return various server errors.
- Route matchers: `urlIncludes`, `isListenEndpoint`, `isGetOrgIdEndpoint`, `anyOf`, `allOf`.

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
