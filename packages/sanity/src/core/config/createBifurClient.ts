import {type BifurClient, fromUrl} from '@sanity/bifur-client'
import {type SanityClient} from '@sanity/client'
import {filter, fromEvent, map, type Observable} from 'rxjs'

export function createBifurClient(
  client: SanityClient,
  token$?: Observable<string | null>,
): BifurClient {
  const bifurVersionedClient = client.withConfig({apiVersion: '2022-06-30'})
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {dataset, url: baseUrl, requestTagPrefix = 'sanity.studio'} = bifurVersionedClient.config()
  const url = `${baseUrl.replace(/\/+$/, '')}/socket/${dataset}`.replace(/^http/, 'ws')
  const urlWithTag = `${url}?tag=${requestTagPrefix}`

  // bifur subscribes on every new socket, so `token$` must replay its latest value, like the auth
  // store's does
  const auth = token$?.pipe(map((token) => Promise.resolve(token ? {token} : undefined)))
  return fromUrl(urlWithTag, {
    auth,
    // React unmounts and remounts subscribers during boot, see
    // https://github.com/sanity-io/sanity/pull/14152
    idleTimeout: 5_000,
    // Emits when the page is hidden on its way into the back/forward cache. The browser can't keep
    // the socket open there, and closes it itself if we don't, logging "WebSocket connection to …
    // failed: Page entered Back-Forward Cache". The restored page reconnects through the usual
    // recovery. There is no `window` when the config is resolved outside a browser.
    closeOn:
      typeof window === 'undefined'
        ? undefined
        : fromEvent<PageTransitionEvent>(window, 'pagehide').pipe(
            filter((event) => event.persisted),
          ),
  })
}
