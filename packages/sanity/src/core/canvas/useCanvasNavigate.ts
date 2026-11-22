import {type Node} from '@sanity/comlink'
import {type Bridge, type FrameMessages} from '@sanity/message-protocol'
import {urlFor} from '@sanity/sdk-react/dashboard'
import {type ValueOf} from '@sanity/sdk/dashboard'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {catchError, from, map, of, throwError, timeout} from 'rxjs'

import {useClient} from '../hooks/useClient'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {useComlinkStore, useRenderingContextStore} from '../store/datastores'
import {useProjectOrganizationId} from '../store/project/useProjectOrganizationId'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {canvasLocaleNamespace} from './i18n'

const ALWAYS_AVAILABLE = of(true)

/**
 * The `dashboard/v1/context` reply, as newer Dashboards send it. `canvasVisibility` is optional:
 * older Dashboards omit the field, and a missing field means the organization is listed.
 */
interface DashboardContext {
  context: {canvasVisibility?: 'default' | 'unlisted'}
}

const CONTEXT_FETCH_TIMEOUT = 3000

interface CanvasNavigate {
  /**
   * Whether the organization has Canvas. Only a message bus host knows; standalone and over Comlink
   * it's assumed to be there.
   */
  isAvailable: boolean
  /**
   * Whether Canvas is listed for this organization. Separate from `isAvailable`, because
   * unlisted organizations keep "Edit in Canvas" on already-linked documents while "Link to
   * Canvas" hides.
   */
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

  const isAvailable$ = useMemo(() => {
    if (!connection) return ALWAYS_AVAILABLE
    return connection
      .subscribe('applications.list')
      .pipe(map((result) => result?.ok === true && canvasRecord(result.value) !== undefined))
  }, [connection])
  const isAvailable = useObservable(isAvailable$, !connection)

  const isUnlisted$ = useMemo(() => {
    // The message bus host lists the applications, including Canvas's visibility.
    if (connection) {
      return connection
        .subscribe('applications.list')
        .pipe(map((result) => result?.ok === true && canvasRecord(result.value)?.unlisted === true))
    }
    // Over Comlink, only the Dashboard's context says whether Canvas is unlisted.
    if (!hasComlinkHost || !node) return of(false)
    return from(node.fetch('dashboard/v1/context', undefined) as Promise<DashboardContext>).pipe(
      map((response) => response.context.canvasVisibility === 'unlisted'),
      timeout({
        first: CONTEXT_FETCH_TIMEOUT,
        with: () => throwError(() => new Error('Dashboard context fetch timed out')),
      }),
      catchError((error) => {
        console.error('Failed to read Canvas visibility from the Dashboard context', error)
        // Fail closed: a Dashboard that cannot be asked is treated as unlisted.
        return of(true)
      }),
    )
  }, [connection, hasComlinkHost, node])
  // `true` until the first value arrives, so `canLink` never flashes for unlisted organizations.
  const isUnlisted = useObservable(isUnlisted$, true)

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

  return {isAvailable, canLink: isAvailable && !isUnlisted, openCanvas}
}

type ListedApplication = Extract<ValueOf<'applications.list'>, {ok: true}>['value'][number]

/**
 * Finds the Canvas record in the applications list, whichever shape it takes: an installation
 * (with the reference nested under `application`) or an application (top-level reference).
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
  // Applications carry `visibility`; installations do not, and are listed until the Dashboard
  // adds the field to that shape too. A missing `visibility` means listed.
  const visibility =
    'visibility' in canvas && typeof canvas.visibility === 'string' ? canvas.visibility : undefined
  return {unlisted: visibility === 'unlisted'}
}
