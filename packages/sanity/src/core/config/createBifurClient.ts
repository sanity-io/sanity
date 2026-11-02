import {fromUrl} from '@sanity/bifur-client'
import {type SanityClient} from '@sanity/client'
import {map, type Observable, shareReplay} from 'rxjs'

export function createBifurClient(client: SanityClient, token$?: Observable<string | null>) {
  const bifurVersionedClient = client.withConfig({apiVersion: '2022-06-30'})
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {dataset, url: baseUrl, requestTagPrefix = 'sanity.studio'} = bifurVersionedClient.config()
  const url = `${baseUrl.replace(/\/+$/, '')}/socket/${dataset}`.replace(/^http/, 'ws')
  const urlWithTag = `${url}?tag=${requestTagPrefix}`

  // Both bifur and connection status must see the token that starts a new attempt.
  const sharedToken$ = token$?.pipe(shareReplay({bufferSize: 1, refCount: true}))
  const auth = sharedToken$?.pipe(map((token) => Promise.resolve(token ? {token} : undefined)))
  // `idleTimeout`: React unmounts and remounts subscribers during boot, see
  // https://github.com/sanity-io/sanity/pull/14152
  const bifur = fromUrl(urlWithTag, {auth, idleTimeout: 5_000})

  return {bifur, token$: sharedToken$}
}
