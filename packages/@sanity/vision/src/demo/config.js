/* eslint-disable no-process-env */
const apiHost = process.env.REACT_APP_API_HOST
const apiHostCfg = apiHost ? {apiHost} : {}

module.exports = {
  client: apiHostCfg
}
