import {type SanityClient, type SanityDocument} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, type Observable, of, tap} from 'rxjs'

import {useClient} from '../../../hooks/useClient'
import {useDataset} from '../../../hooks/useDataset'
import {useProjectId} from '../../../hooks/useProjectId'
import {useWorkspaceSchemaId} from '../../../hooks/useWorkspaceSchemaId'
import {useStudioAppIdStore} from '../../../store/studio-app/useStudioAppIdStore'
import {useWorkspace} from '../../../studio/workspace'
import {type CanvasDiff} from '../../types'
import {useCanvasNavigate} from '../../useCanvasNavigate'
import {useCanvasTelemetry} from '../../useCanvasTelemetry'

const localeSettings = Intl.DateTimeFormat().resolvedOptions()

interface CanvasResponse {
  error?: string
  originalDocument?: SanityDocument
  mappedDocument?: SanityDocument
  canvasContent?: unknown
  diff?: CanvasDiff[]
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

type UseLinkToCanvasResponse =
  | {
      status: 'validating' | 'error' | 'missing-document-id'
      error?: string | null
      navigateToCanvas?: undefined
      response?: CanvasResponse
    }
  | {
      status: 'redirecting' | 'diff'
      error?: string | null
      navigateToCanvas: () => void
      response?: CanvasResponse
    }

const initialState: UseLinkToCanvasResponse = {
  status: 'validating',
}

const CANVAS_CLIENT_CONFIG = {
  apiVersion: 'v2025-04-29',
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
  const workspace = useWorkspace()
  const projectId = useProjectId()
  const dataset = useDataset()
  const {openCanvas} = useCanvasNavigate()
  const {linkRedirected, linkDialogDiffsShown} = useCanvasTelemetry()

  const {studioApp, loading: appIdLoading} = useStudioAppIdStore({
    enabled: true,
    fallbackStudioOrigin: workspace.apps?.canvas?.fallbackStudioOrigin,
  })

  const schemaId = useWorkspaceSchemaId()
  const client = useClient(CANVAS_CLIENT_CONFIG)

  const linkToCanvas$: Observable<UseLinkToCanvasResponse> = useMemo(() => {
    if (appIdLoading) {
      return of({status: 'validating'})
    }
    if (!studioApp?.appId) {
      return of({
        status: 'error',
        error: 'Studio app not found, try deploying it or set the fallbackStudioOrigin',
      })
    }
    if (!document?._id) {
      return of({
        status: 'missing-document-id',
        error: 'Missing document ID',
      })
    }

    const queryParams = new URLSearchParams({
      projectId,
      dataset,
      documentType: document._type,
      documentId: document._id,
      workspaceName: workspace.name,
      applicationId: studioApp?.appId,
    })

    return canvasPreflight({client, document, schemaId}).pipe(
      map((preflight) => {
        if (!preflight.error) {
          const status = preflight.diff?.length ? ('diff' as const) : ('redirecting' as const)

          return {
            status: status,
            error: null,
            response: preflight,
            navigateToCanvas: () => {
              linkRedirected(status === 'diff' ? 'diff-dialog' : 'redirect', preflight.diff)
              openCanvas(`studio-import?${queryParams.toString()}`)
            },
          }
        }

        return {
          status: 'error' as const,
          error: preflight.error,
          response: preflight,
          redirectUrl: undefined,
        }
      }),
      tap(({status, navigateToCanvas}) => {
        if (status === 'redirecting') {
          setTimeout(() => {
            // We want to give some time for the dialog to show the redirecting text before redirecting the user.
            navigateToCanvas()
          }, 1000)
        }
        if (status === 'diff') {
          linkDialogDiffsShown()
        }
      }),
      catchError((error) => {
        return of({
          status: 'error' as const,
          error: error.message,
        })
      }),
    )
  }, [
    appIdLoading,
    client,
    document,
    linkRedirected,
    linkDialogDiffsShown,
    openCanvas,
    schemaId,
    studioApp?.appId,
    dataset,
    workspace.name,
    projectId,
  ])

  return useObservable(linkToCanvas$, initialState)
}
