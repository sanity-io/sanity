import {VARIANTS_STUDIO_CLIENT_OPTIONS} from 'sanity'

import {prefixApiVersion} from './util/prefixApiVersion'

/** The API version content variants need, so a selected variant forces this version */
export const VARIANTS_API_VERSION = prefixApiVersion(VARIANTS_STUDIO_CLIENT_OPTIONS.apiVersion)

export const API_VERSIONS = [
  'v1',
  'vX',
  'v2021-03-25',
  'v2021-10-21',
  'v2022-03-07',
  'v2025-02-19',
  VARIANTS_API_VERSION,
  `v${new Date().toISOString().split('T')[0]}`,
]
export const [DEFAULT_API_VERSION] = API_VERSIONS.slice(-1)
