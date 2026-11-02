import {type BifurClient, fromUrl} from '@sanity/bifur-client'
import {type SanityClient} from '@sanity/client'
import {map, type Observable} from 'rxjs'

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
  // `idleTimeout`: React unmounts and remounts subscribers during boot, see
  // https://github.com/sanity-io/sanity/pull/14152
  return fromUrl(urlWithTag, {auth, idleTimeout: 5_000})
}
