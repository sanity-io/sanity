import {type ProxyRequest, type ProxyResponse} from '@repo/debug-proxy'

import {type ListenHub} from '../sse'
import {type DocumentStore} from '../store'

export interface FeatureRequestContext {
  req: ProxyRequest
  res: ProxyResponse
  method: string
  /** version-stripped path */
  path: string
  rawPath: string
  url: URL
  store: DocumentStore
  hub: ListenHub
  record: (endpointClass: string, bytesOut: number) => void
}

export interface FeatureModule {
  /** Matches entries in scenario.features (e.g. 'comments'). */
  name: string
  /** Keys unioned into the /features response while active (e.g. ['studioComments']). */
  featureFlags?: readonly string[]
  /** Extra routes, tried after built-ins, before the 404 fallthrough. Returns true if handled. */
  routes?: readonly ((context: FeatureRequestContext) => boolean | Promise<boolean>)[]
  /** Ledger allowlist patterns active only while this module is (report-only escape hatch). */
  allow?: readonly RegExp[]
}
