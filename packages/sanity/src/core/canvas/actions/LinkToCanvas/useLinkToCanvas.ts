import {type SanityDocument} from '@sanity/client'
import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, type Observable, of, tap, timeout} from 'rxjs'

import {createAppIdCache} from '../../../create/studio-app/appIdCache'
import {useClient} from '../../../hooks/useClient'
import {useWorkspace} from '../../../studio/workspace'

interface CanvasResponse {
  error?: string
  redirectUrl?: string
  originalDocument?: SanityDocument
  mappedDocument?: SanityDocument
  canvasContent?: unknown
}

type StudioToCanvasRequestBody = ({documentId: string} | {document: SanityDocument}) & {
  projectUser?: {name: string}
  linkedProjectTitle?: string
  schemaId: string
  localeSettings: {
    timeZone: string
    locale: string
  }
}
const useWorkspaceSchemaId = () => {
  const workspace = useWorkspace()
  return `sanity.workspace.schema.${workspace.name || 'default'}`
}
interface UseLinkToCanvasResponse {
  status: 'validating' | 'redirecting' | 'error' | 'missing-document-id'
  error?: string | null
  redirectUrl?: string
}
const initialState: UseLinkToCanvasResponse = {
  status: 'validating',
}
const CANVAS_CLIENT_CONFIG = {
  apiVersion: 'vX',
  dataset: 'playground',
}

const getCanvasLinkUrl = ({
  documentId,
  workspaceName,
  documentType,
  dataset,
  applicationId,
  projectId,
}: {
  documentId: string
  workspaceName: string
  documentType: string
  dataset: string
  applicationId: string
  projectId: string
}) => {
  // https://www.sanity.work/@oF5P8QpKU/canvas/studio-import?projectId=9wn4ukz1&da&documentType=article&documentId=drafts.4648db26-098f-49f4-93a3-97cc5c584a98&workspaceName=default&applicationId=uelr1cps6hg1s4hyq5heq7kt
  const queryParams = new URLSearchParams({
    projectId,
    dataset,
    documentType,
    documentId,
    workspaceName,
    applicationId,
  })

  return `https://www.sanity.work/@oF5P8QpKU/canvas/studio-import?${queryParams.toString()}`
}

export function useLinkToCanvas({document}: {document: SanityDocument | undefined}) {
  // Canvas requires vX api version for now
  const [appIdCache] = useState(() => createAppIdCache())
  const studioApp = {appId: 'w7r15hwlj2azs8qe43panyi4'} //  = useStudioAppIdStore(appIdCache)
  const schemaId = useWorkspaceSchemaId()
  const client = useClient(CANVAS_CLIENT_CONFIG)
  const workspace = useWorkspace()
  const dataset = client.config().dataset
  const projectId = client.config().projectId
  const canvasLinkUrl = useMemo(() => {
    if (!document?._id || !dataset || !projectId || !studioApp?.appId) {
      return null
    }
    return getCanvasLinkUrl({
      documentId: document._id,
      workspaceName: workspace.name,
      documentType: document._type,
      dataset: dataset,
      projectId: projectId,
      applicationId: studioApp?.appId || '',
    })
  }, [document, dataset, projectId, workspace.name, studioApp?.appId])

  const observable: Observable<UseLinkToCanvasResponse> = useMemo(() => {
    if (!canvasLinkUrl) {
      return of({
        status: 'validating' as const,
      }).pipe(
        timeout(5000),
        map(() => ({
          status: 'error' as const,
          error: 'Missing canvas link URL',
        })),
      )
    }
    if (!document?._id) {
      return of({
        status: 'missing-document-id' as const,
        error: 'Missing document ID',
      })
    }
    return client.observable
      .request<CanvasResponse>({
        url: `/assist/studio-to-canvas/${dataset}`,
        tag: 'sanity.canvas',
        method: 'POST',
        body: {
          // documentId: document._id,
          document,
          schemaId,
          localeSettings: {
            locale: 'en-US',
            timeZone: 'UTC',
          },
        } satisfies StudioToCanvasRequestBody,
      })
      .pipe(
        map((response) => {
          if (!response.error) {
            return {
              status: 'redirecting' as const,
              error: null,
              redirectUrl: canvasLinkUrl,
            }
          }
          return {
            status: 'error' as const,
            error: response.error,
          }
        }),
        catchError((error) => {
          return of({
            status: 'error' as const,
            error: error.message,
          })
        }),
      )
  }, [client.observable, dataset, document, schemaId, canvasLinkUrl])

  return useObservable(observable, initialState)
}
