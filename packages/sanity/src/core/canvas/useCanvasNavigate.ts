import {type Bridge} from '@sanity/message-protocol'
import {urlFor} from '@sanity/sdk-react/dashboard'
import {type ValueOf} from '@sanity/sdk/dashboard'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {catchError, from, map, of, timeout} from 'rxjs'

import {useClient} from '../hooks/useClient'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {useComlinkStore, useRenderingContextStore} from '../store/datastores'
import {useProjectOrganizationId} from '../store/project/useProjectOrganizationId'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {canvasLocaleNamespace} from './i18n'

/** How long to wait for the Dashboard to answer `dashboard/v1/context`. */
const CONTEXT_FETCH_TIMEOUT = 3000

interface CanvasNavigate {
  /** Whether the organization has Canvas; only a message bus host knows. */
  isAvailable: boolean
  /** Whether Canvas is listed. Unlisted orgs keep "Edit in Canvas" on linked documents. */
  canLink: boolean
  /** Opens Canvas at a path within it, such as `doc/<id>`. */
  openCanvas: (path: string) => void
}

/**
 * Opens Canvas through the host rendering Studio, or in the Dashboard without one.
 *
 * @internal
 */
export function useCanvasNavigate(): CanvasNavigate {
  const renderingContextStore = useRenderingContextStore()
  const connection = renderingContextStore.getMessageBusConnection()
  const hasComlinkHost = renderingContextStore.getCapabilities()?.comlink === true
  const {node} = useComlinkStore()
  const {value: organizationId} = useProjectOrganizationId()
  // Read when Canvas opens, so `openCanvas` stays the same function once the organization loads.
  const organizationIdRef = useRef(organizationId)
  useEffect(() => {
    organizationIdRef.current = organizationId
  }, [organizationId])
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const {t} = useTranslation(canvasLocaleNamespace)

  const availability$ = useMemo(() => {
    // A message bus host knows both: whether Canvas exists and how it is listed.
    if (connection) {
      return connection.subscribe('applications.list').pipe(
        map((result) => {
          if (result?.ok !== true) return {isAvailable: false, canLink: false}
          const canvas = canvasRecord(result.value)
          return {
            isAvailable: canvas !== undefined,
            canLink: canvas !== undefined && !canvas.unlisted,
          }
        }),
      )
    }
    // Over Comlink, only the Dashboard's context says how Canvas is listed. No node: fail closed.
    if (hasComlinkHost) {
      if (!node) return of({isAvailable: true, canLink: false})
      return from(node.fetch('dashboard/v1/context', undefined)).pipe(
        map((response) => ({
          isAvailable: true,
          canLink: !(
            'canvasVisibility' in response.context &&
            response.context.canvasVisibility === 'unlisted'
          ),
        })),
        timeout(CONTEXT_FETCH_TIMEOUT),
        catchError((error) => {
          console.error('Failed to read Canvas visibility from the Dashboard context', error)
          return of({isAvailable: true, canLink: false}) // fail closed
        }),
      )
    }
    // Standalone Studio has no host to ask; Canvas is assumed listed.
    return of({isAvailable: true, canLink: true})
  }, [connection, hasComlinkHost, node])
  const {isAvailable, canLink} = useObservable(availability$, {
    isAvailable: !connection,
    canLink: !connection && !hasComlinkHost,
  })

  const openCanvas = useCallback(
    (path: string) => {
      if (connection) {
        const showError = () =>
          toast.push({status: 'error', title: t('navigate-to-canvas-doc.error.failed')})
        void connection
          .emit('navigation.location.update', {
            url: `${urlFor.canvas().url()}/${path}`,
            history: 'push',
          })
          .then((reply) => {
            if (!reply.ok) showError()
          }, showError)
        return
      }

      if (hasComlinkHost && node) {
        const message: Bridge.Navigation.NavigateToResourceMessage = {
          type: 'dashboard/v1/bridge/navigate-to-resource',
          data: {resourceId: '', resourceType: 'canvas', path},
        }
        node.post(message.type, message.data)
        return
      }

      const openingOrganizationId = organizationIdRef.current
      if (!openingOrganizationId) {
        toast.push({status: 'error', title: t('navigate-to-canvas-doc.error.missing-permissions')})
        return
      }
      const isStaging = client.config().apiHost === 'https://api.sanity.work'
      window.open(
        `https://www.sanity.${isStaging ? 'work' : 'io'}/@${openingOrganizationId}/canvas/${path}`,
        '_blank',
      )
    },
    [client, connection, hasComlinkHost, node, t, toast],
  )

  return {isAvailable, canLink, openCanvas}
}

type ListedApplication = Extract<ValueOf<'applications.list'>, {ok: true}>['value'][number]

/**
 * Finds the Canvas record in the applications list, whichever shape it takes: an installation
 * (with the reference nested under `application`) or an application (top-level reference). A
 * missing `visibility` field on either shape means listed, the same as before the Dashboard
 * computed it.
 */
function canvasRecord(applications: ListedApplication[]):
  | {
      unlisted: boolean
    }
  | undefined {
  const canvas = applications.find((application) => {
    const reference =
      'application' in application ? application.application.reference : application.reference
    return reference === 'sanity/canvas'
  })
  if (!canvas) return undefined
  const visibility =
    'visibility' in canvas && typeof canvas.visibility === 'string' ? canvas.visibility : undefined
  return {unlisted: visibility === 'unlisted'}
}
