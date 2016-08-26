import client from '@sanity/client-next'
import getUserConfig from './getUserConfig'

/**
 * Creates a wrapper/getter function to retrieve a Sanity API client.
 * Instead of spreading the error checking logic around the project,
 * we call it here when (and only when) a command needs to use the API
 */
export default function clientWrapper(manifest, path) {
  return function () {
    const token = getUserConfig().get('authToken')

    if (!token) {
      throw new Error('You must login first')
    }

    if (!manifest || !manifest.api || !manifest.api.projectId) {
      throw new Error(
        `"${path}" does not contain a project identifier ("api.projectId"), `
        + 'which is required for the Sanity CLI to communicate with the Sanity API'
      )
    }

    return client(Object.assign({}, manifest.api, {token}))
  }
}
