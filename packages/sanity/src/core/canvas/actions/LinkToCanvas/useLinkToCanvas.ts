import {type SanityClient, type SanityDocument} from '@sanity/client'
import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, combineLatest, map, type Observable, of, tap} from 'rxjs'

import {createAppIdCache} from '../../../create/studio-app/appIdCache'
import {useStudioAppIdStore} from '../../../create/studio-app/useStudioAppIdStore'
import {useClient} from '../../../hooks/useClient'
import {useWorkspaceSchemaId} from '../../../hooks/useWorkspaceSchemaId'
import {useProjectStore} from '../../../store/_legacy/datastores'
import {type ProjectStore} from '../../../store/_legacy/project/types'
import {useWorkspace} from '../../../studio/workspace'

const localeSettings = Intl.DateTimeFormat().resolvedOptions()

interface CanvasResponse {
  error?: string
  originalDocument?: SanityDocument
  mappedDocument?: SanityDocument
  canvasContent?: unknown
  diff?: {
    indexedPath: string[]
    prevValue: unknown
    value: unknown
    type: string
  }[]
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

interface UseLinkToCanvasResponse {
  status: 'validating' | 'redirecting' | 'error' | 'missing-document-id' | 'diff'
  error?: string | null
  redirectUrl?: string
  response?: CanvasResponse
}
const initialState: UseLinkToCanvasResponse = {
  status: 'validating',
}

const CANVAS_CLIENT_CONFIG = {
  apiVersion: 'v2025-04-29',
}

const getCanvasLinkUrl = ({
  documentId,
  workspaceName,
  documentType,
  applicationId,
  client,
  projectStore,
}: {
  documentId: string
  workspaceName: string
  documentType: string
  applicationId: string
  client: SanityClient
  projectStore: ProjectStore
}) => {
  const dataset = client.config().dataset || ''
  const projectId = client.config().projectId || ''
  // TODO: If comlink is available don't get the org id, use comlink to navigate to canvas

  return projectStore.getOrganizationId().pipe(
    map((organizationId) => {
      const queryParams = new URLSearchParams({
        projectId,
        dataset,
        documentType,
        documentId,
        workspaceName,
        applicationId,
      })
      const isStaging = client.config().apiHost === 'https://api.sanity.work'

      return `https://www.sanity.${isStaging ? 'work' : 'io'}/@${organizationId}/canvas/studio-import?${queryParams.toString()}`
    }),
  )
}

const canvasPreflight = ({
  client,
  document,
  schemaId,
}: {
  client: SanityClient
  document: SanityDocument
  schemaId: string
}) => {
  const dataset = client.config().dataset
  return client.observable.request<CanvasResponse>({
    url: `/assist/studio-to-canvas/${dataset}`,
    tag: 'sanity.canvas',
    method: 'POST',
    body: {
      document,
      schemaId,
      localeSettings: {
        locale: localeSettings.locale,
        timeZone: localeSettings.timeZone,
      },
    } satisfies StudioToCanvasRequestBody,
  })
}

export function useLinkToCanvas({document}: {document: SanityDocument | undefined}) {
  const [appIdCache] = useState(() => createAppIdCache())
  const workspace = useWorkspace()
  const projectStore = useProjectStore()

  const {studioApp, loading: appIdLoading} = useStudioAppIdStore(appIdCache, {
    enabled: true,
    fallbackStudioOrigin: workspace.apps?.canvas?.fallbackStudioOrigin,
  })

  const schemaId = useWorkspaceSchemaId()
  const client = useClient(CANVAS_CLIENT_CONFIG)

  const linkToCanvas$: Observable<UseLinkToCanvasResponse> = useMemo(() => {
    if (appIdLoading) {
      return of({status: 'validating' as const})
    }
    if (!studioApp?.appId) {
      return of({
        status: 'error' as const,
        error: 'Studio app not found, try deploying it or set the fallbackStudioOrigin',
      })
    }
    if (!document?._id) {
      return of({
        status: 'missing-document-id' as const,
        error: 'Missing document ID',
      })
    }
    return combineLatest([
      canvasPreflight({client, document, schemaId}),
      getCanvasLinkUrl({
        documentId: document._id,
        workspaceName: workspace.name,
        documentType: document._type,
        applicationId: studioApp?.appId || '',
        client,
        projectStore,
      }),
    ]).pipe(
      map(([preflight, canvasLinkUrl]) => {
        if (!preflight.error) {
          return {
            status: preflight.diff?.length ? ('diff' as const) : ('redirecting' as const),
            error: null,
            redirectUrl: canvasLinkUrl,
            response: preflight,
          }
        }

        return {
          status: 'error' as const,
          error: preflight.error,
          response: preflight,
          redirectUrl: undefined,
        }
      }),
      tap(({status, redirectUrl}) => {
        if (status === 'redirecting') {
          window.open(redirectUrl, '_blank')
        }
      }),
      catchError((error) => {
        return of({
          status: 'error' as const,
          error: error.message,
        })
      }),
    )
  }, [appIdLoading, client, document, schemaId, studioApp?.appId, workspace.name, projectStore])

  return useObservable(linkToCanvas$, initialState)
}
