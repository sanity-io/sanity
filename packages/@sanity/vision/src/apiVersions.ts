export const API_VERSIONS = [
  'v1',
  'vX',
  'v2021-03-25',
  'v2021-10-21',
  'v2022-03-07',
  'v2025-02-19',
  `v${new Date().toISOString().split('T')[0]}`,
]
export const [DEFAULT_API_VERSION] = API_VERSIONS.slice(-1)
