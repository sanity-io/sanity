const tokenHeader = 'Sanity-Token'
const projectHeader = 'Sanity-Project-ID'

exports.getRequestOptions = config => {
  const headers = {}

  if (config.token) {
    headers[tokenHeader] = config.token
  }

  if (!config.useProjectHostname) {
    headers[projectHeader] = config.projectId
  }

  return {
    headers: headers,
    timeout: config.timeout || 15000,
    withCredentials: true,
    json: true
  }
}
