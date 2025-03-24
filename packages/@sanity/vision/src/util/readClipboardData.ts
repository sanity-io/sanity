import {API_VERSIONS} from '../apiVersions'
import {parseApiQueryString, type ParsedApiQueryString} from './parseApiQueryString'
import {validateApiVersion} from './validateApiVersion'

const sanityUrl =
  /\.(?:api|apicdn)\.sanity\.io\/(vX|v1|v\d{4}-\d\d-\d\d)\/.*?(?:query|listen)\/(.*?)\?(.*)/

export function readClipboardData(evt: ClipboardEvent): null | {
  perspective: string
  query: string
  params: Record<string, unknown>
  dataset: string
  apiVersion: string | undefined
  customApiVersion: string | false | undefined
} {
  if (!evt.clipboardData) {
    return null
  }

  const data = evt.clipboardData.getData('text/plain')
  const match = data.match(sanityUrl)
  if (!match) {
    return null
  }

  const [, apiVersion, dataset, urlQuery] = match
  let parts: ParsedApiQueryString

  try {
    const qs = new URLSearchParams(urlQuery)
    parts = parseApiQueryString(qs)
  } catch (err) {
    console.warn('Error while trying to parse API URL: ', err.message) // eslint-disable-line no-console
    return null
  }

  let newApiVersion: string | undefined
  let newCustomApiVersion: string | false | undefined

  if (validateApiVersion(apiVersion)) {
    if (API_VERSIONS.includes(apiVersion)) {
      newApiVersion = apiVersion
      newCustomApiVersion = false
    } else {
      newCustomApiVersion = apiVersion
    }
  }

  return {
    perspective: parts.options.perspective,
    query: parts.query,
    params: parts.params,
    dataset,
    apiVersion: newApiVersion,
    customApiVersion: newCustomApiVersion,
  }
}
