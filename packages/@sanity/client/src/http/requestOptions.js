const tokenHeader = 'Sanity-Token'
const projectHeader = 'Sanity-Project-ID'

module.exports = config => {
  const headers = {}

  if (config.token) {
    headers[tokenHeader] = config.token
  }

  if (!config.useProjectHostname && config.projectId) {
    headers[projectHeader] = config.projectId
  }

  return {
    headers: headers,
    timeout: ('timeout' in config) ? config.timeout : 15000,
    withCredentials: true,
    json: true
  }
}
