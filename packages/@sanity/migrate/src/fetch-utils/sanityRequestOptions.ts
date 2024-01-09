import type {FetchOptions} from './fetchStream'
import type {Endpoint} from './endpoints'

interface SanityRequestOptions {
  endpoint: Endpoint
  apiVersion: `vX` | `v${number}-${number}-${number}`
  apiHost: string
  projectId: string
  token?: string
  body?: string
}

export function toFetchOptions(req: SanityRequestOptions): FetchOptions {
  const {endpoint, apiVersion, projectId, apiHost, token, body} = req
  const requestInit: RequestInit = {
    method: endpoint.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  }
  if (token) {
    requestInit.headers = {
      ...requestInit.headers,
      Authorization: `bearer ${token}`,
    }
  }
  const path = `/${apiVersion}${endpoint.path}`
  const host = endpoint.global ? apiHost : `${projectId}.${apiHost}`
  return {url: `https://${host}/${path}`, init: requestInit}
}
