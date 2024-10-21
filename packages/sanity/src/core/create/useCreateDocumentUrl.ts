import {type CreateLinkMetadata} from './types'

// @ts-expect-error: __SANITY_STAGING__ is a global env variable set by the vite config
const isStaging = typeof __SANITY_STAGING__ !== 'undefined' && __SANITY_STAGING__ === true

function getCreateBaseUrl(customHost?: string) {
  //@todo perhaps only support create staging through config
  const host = (customHost ?? isStaging) ? 'create-staging.sanity.build' : 'www.sanity.io'
  return `https://${host}/app/create`
}

export function getCreateLinkUrl(args: {
  docId: string
  documentType: string
  appId: string
  projectId: string
  workspaceName: string
  globalUserId: string | undefined
}): string | undefined {
  const {docId, documentType, appId, projectId, workspaceName, globalUserId} = args

  if (!globalUserId) {
    return undefined
  }
  const params = new URLSearchParams()
  params.append('projectId', projectId)
  params.append('applicationId', appId)
  params.append('workspaceName', workspaceName)
  params.append('documentType', documentType)
  params.append('documentId', docId)
  return `${getCreateBaseUrl()}/studio-import/${globalUserId}?${params.toString()}`
}

export function useCreateDocumentUrl(create: CreateLinkMetadata): string | undefined {
  return `${getCreateBaseUrl(create.host)}/${create.dataset}/${create._id}`
}
