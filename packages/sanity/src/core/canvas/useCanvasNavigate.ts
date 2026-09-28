import {type Bridge} from '@sanity/message-protocol'
import {urlFor} from '@sanity/sdk-react/dashboard'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'

import {useClient} from '../hooks/useClient'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {useComlinkStore, useRenderingContextStore} from '../store/datastores'
import {useProjectOrganizationId} from '../store/project/useProjectOrganizationId'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {canvasLocaleNamespace} from './i18n'

const ALWAYS_AVAILABLE = of(true)

interface CanvasNavigate {
  /**
   * Whether the organization has Canvas. Only a message bus host knows; standalone and over Comlink
   * it's assumed to be there.
   */
  isAvailable: boolean
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
    return connection.subscribe('applications.list').pipe(
      map(
        (result) =>
          result?.ok === true &&
          result.value.some((application) => {
            const reference =
              'application' in application
                ? application.application.reference
                : application.reference
            return reference === 'sanity/canvas'
          }),
      ),
    )
  }, [connection])
  const isAvailable = useObservable(isAvailable$, !connection)

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

  return {isAvailable, openCanvas}
}
