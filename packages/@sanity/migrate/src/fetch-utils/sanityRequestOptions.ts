import {type Endpoint} from './endpoints'
import {type FetchOptions} from './fetchStream'

function getUserAgent() {
  if (typeof window === 'undefined') {
    // only set UA if we're in a non-browser environment
    try {
      const pkg = require('../../package.json')
      return `${pkg.name}@${pkg.version}`
      // eslint-disable-next-line no-empty
    } catch (err) {}
  }
  return null
}

interface SanityRequestOptions {
  endpoint: Endpoint
  apiVersion: `vX` | `v${number}-${number}-${number}`
  apiHost: string
  projectId: string
  token?: string
  body?: string
  tag?: string
}

function normalizeApiHost(apiHost: string) {
  return apiHost.replace(/^https?:\/\//, '')
}

export function toFetchOptions(req: SanityRequestOptions): FetchOptions {
  const {endpoint, apiVersion, tag, projectId, apiHost, token, body} = req
  const requestInit: RequestInit = {
    method: endpoint.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  }
  const ua = getUserAgent()
  if (ua) {
    requestInit.headers = {
      ...requestInit.headers,
      'User-Agent': ua,
    }
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
  const searchParams = new URLSearchParams([
    ...endpoint.searchParams,
    ...(tag ? [['tag', tag]] : []),
  ]).toString()

  return {
    url: `https://${host}/${path}${searchParams ? `?${searchParams}` : ''}`,
    init: requestInit,
  }
}
