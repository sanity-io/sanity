import {fromUrl} from '@sanity/bifur-client'
import {type SanityClient} from '@sanity/client'
import {type Observable, shareReplay} from 'rxjs'

export function createBifurClient(client: SanityClient, token$?: Observable<string | null>) {
  const bifurVersionedClient = client.withConfig({apiVersion: '2022-06-30'})
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {dataset, url: baseUrl, requestTagPrefix = 'sanity.studio'} = bifurVersionedClient.config()
  const url = `${baseUrl.replace(/\/+$/, '')}/socket/${dataset}`.replace(/^http/, 'ws')
  const urlWithTag = `${url}?tag=${requestTagPrefix}`

  // Both bifur and connection status must see the token that starts a new attempt.
  const sharedToken$ = token$?.pipe(shareReplay({bufferSize: 1, refCount: true}))
  const bifur = fromUrl(urlWithTag, sharedToken$ ? {token$: sharedToken$} : {})

  return {bifur, token$: sharedToken$}
}
