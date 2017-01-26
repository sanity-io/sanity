import client from '@sanity/client'
import getUserConfig from './getUserConfig'

/**
 * Creates a wrapper/getter function to retrieve a Sanity API client.
 * Instead of spreading the error checking logic around the project,
 * we call it here when (and only when) a command needs to use the API
 */
const defaults = {
  requireUser: true,
  requireProject: true
}

export default function clientWrapper(manifest, configPath) {
  return function (opts = {}) {
    const staging = process.env.SANITY_STAGING
    const {requireUser, requireProject, api} = {...defaults, ...opts}
    const userConfig = getUserConfig()
    const userApiConf = userConfig.get('api')
    const token = userConfig.get('authToken')
    const apiConfig = Object.assign(
      {},
      userApiConf || {},
      (manifest && manifest.api) || {},
      api || {}
    )

    if (staging) {
      apiConfig.apiHost = 'https://api.sanity.work'
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
      useProjectHostname: requireProject
    })
  }
}
