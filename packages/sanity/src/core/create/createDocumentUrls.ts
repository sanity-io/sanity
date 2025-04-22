import {type CreateLinkMetadata} from './types'

// @ts-expect-error: __SANITY_STAGING__ is a global env variable set by the vite config
const isStaging = typeof __SANITY_STAGING__ !== 'undefined' && __SANITY_STAGING__ === true

function getCreateBaseUrl(customHost?: string) {
  const host = (customHost ?? isStaging) ? 'create-staging.sanity.build' : 'www.sanity.io'
  return `https://${host}/app/create`
}

export function getCreateDocumentUrl(create: CreateLinkMetadata): string | undefined {
  return `${getCreateBaseUrl(create.host)}/${create.dataset}/${create._id}`
}
