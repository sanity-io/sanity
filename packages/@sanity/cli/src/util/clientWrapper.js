import client from '@sanity/client'
import getUserConfig from './getUserConfig'

const sanityEnv = process.env.SANITY_ENV || 'production' // eslint-disable-line no-process-env
const apiHosts = {
  staging: 'https://api.sanity.work',
  development: 'http://api.sanity.wtf'
}

/**
 * Creates a wrapper/getter function to retrieve a Sanity API client.
 * Instead of spreading the error checking logic around the project,
 * we call it here when (and only when) a command needs to use the API
 */
const defaults = {
  requireUser: true,
  requireProject: true
}

const authErrors = () => ({
  onError: err => {
    if (!err || !err.response) {
      return err
    }

    const body = err.response.body
    if (!body || body.statusCode !== 401) {
      return err
    }

    const cfg = getUserConfig()
    cfg.delete('authType')
    cfg.delete('authToken')

    // @todo Trigger re-authentication?
    return err
  }
})

export default function clientWrapper(manifest, configPath) {
  const requester = client.requester.clone()
  requester.use(authErrors())

  return function (opts = {}) {
    const {requireUser, requireProject, api} = {...defaults, ...opts}
    const userConfig = getUserConfig()
    const userApiConf = userConfig.get('api')
    const token = userConfig.get('authToken')
    const apiHost = apiHosts[sanityEnv]
    const apiConfig = Object.assign(
      {},
      userApiConf || {},
      (manifest && manifest.api) || {},
      api || {}
    )

    if (apiHost) {
      apiConfig.apiHost = apiHost
    }

    if (requireUser && !token) {
      throw new Error('You must login first - run "sanity login"')
    }

    if (requireProject && !apiConfig.projectId) {
      throw new Error(
        `"${configPath}" does not contain a project identifier ("api.projectId"), `
        + 'which is required for the Sanity CLI to communicate with the Sanity API'
      )
    }

    return client({
      ...apiConfig,
      dataset: apiConfig.dataset || 'dummy',
      token: token,
      useProjectHostname: requireProject,
      requester: requester
    })
  }
}
