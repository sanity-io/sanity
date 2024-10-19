import {useCurrentUser, useUser, useWorkspace} from 'sanity'

import {type CreateLinkMetadata} from './types'

// @ts-expect-error: __SANITY_STAGING__ is a global env variable set by the vite config
const isStaging = typeof __SANITY_STAGING__ !== 'undefined' && __SANITY_STAGING__ === true

function getCreateBaseUrl(customHost?: string) {
  //@todo perhaps only support create staging through config
  const host = (customHost ?? isStaging) ? 'create-staging.sanity.build' : 'www.sanity.io'
  return `https://${host}/app/create`
}

export function useCreateLinkUrl(args: {
  docId: string
  documentType: string
  appId: string
  globalUserId: string | undefined
}): string | undefined {
  const workspace = useWorkspace()
  const currentUser = useCurrentUser()
  const userId = currentUser?.id ?? ''
  const [user] = useUser(userId)
  const globalUserId = user?.sanityUserId

  if (!globalUserId) {
    return undefined
  }
  const params = new URLSearchParams()

  params.append('projectId', workspace.projectId)
  params.append('applicationId', args.appId)
  params.append('workspaceName', workspace.name)
  params.append('documentType', args.documentType)
  params.append('documentId', args.docId)
  return `${getCreateBaseUrl()}/studio-import/${globalUserId}?${params.toString()}`
}

export function useCreateDocumentUrl(create: CreateLinkMetadata): string | undefined {
  return `${getCreateBaseUrl(create.host)}/${create.dataset}/${create._id}`
}
