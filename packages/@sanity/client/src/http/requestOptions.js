const assign = require('object-assign')

const projectHeader = 'X-Sanity-Project-ID'

module.exports = (config, overrides = {}) => {
  const headers = {}

  const token = overrides.token || config.token
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (!overrides.useGlobalApi && (!config.useProjectHostname && config.projectId)) {
    headers[projectHeader] = config.projectId
  }

  const withCredentials = Boolean(
    typeof overrides.withCredentials === 'undefined'
      ? config.token || config.withCredentials
      : overrides.withCredentials
  )

  const timeout = typeof overrides.timeout === 'undefined' ? config.timeout : overrides.timeout
  return assign({}, overrides, {
    headers: assign({}, headers, overrides.headers || {}),
    timeout: typeof timeout === 'undefined' ? 5 * 60 * 1000 : timeout,
    json: true,
    withCredentials
  })
}
