import client from '@sanity/client-next'

export default function clientWrapper(manifest, path) {
  return function () {
    if (!manifest || !manifest.api || !manifest.api.projectId) {
      throw new Error(
        `"${path}" does not contain a project identifier ("api.projectId"), `
        + 'which is required for the Sanity CLI to communicate with the Sanity API'
      )
    }

    return client(manifest.api)
  }
}
