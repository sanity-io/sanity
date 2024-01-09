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

function normalizeApiHost(apiHost: string) {
  return apiHost.replace(/^https?:\/\//, '')
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
  const normalizedApiHost = normalizeApiHost(apiHost)
  const path = `/${apiVersion}${endpoint.path}`
  const host = endpoint.global ? normalizedApiHost : `${projectId}.${normalizedApiHost}`
  const searchParams = new URLSearchParams(endpoint.searchParams).toString()

  return {
    url: `https://${host}/${path}${searchParams ? `?${searchParams}` : ''}`,
    init: requestInit,
  }
}
