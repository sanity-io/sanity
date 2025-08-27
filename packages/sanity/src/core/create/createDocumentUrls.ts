import {type CreateLinkMetadata} from './types'

const isStaging = process.env.SANITY_INTERNAL_ENV === 'staging'

function getCreateBaseUrl(customHost?: string) {
  const host = (customHost ?? isStaging) ? 'create-staging.sanity.build' : 'www.sanity.io'
  return `https://${host}/app/create`
}

export function getCreateDocumentUrl(create: CreateLinkMetadata): string | undefined {
  return `${getCreateBaseUrl(create.host)}/${create.dataset}/${create._id}`
}
