import {useToast} from '@sanity/ui'
import {useActorRef, useSelector} from '@xstate/react'
import {useEffect} from 'react'
import {
  type Tool,
  useActiveWorkspace,
  useClient,
  useCurrentUser,
  useGrantsStore,
  useTranslation,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {fromObservable} from 'xstate'

import {defineCreatePreviewSecretActor} from './actors/create-preview-secret'
import {defineResolveAllowPatternsActor} from './actors/resolve-allow-patterns'
import {defineResolveInitialUrlActor} from './actors/resolve-initial-url'
import {defineResolvePreviewModeActor} from './actors/resolve-preview-mode'
import {defineResolvePreviewModeUrlActor} from './actors/resolve-preview-mode-url'
import {API_VERSION} from './constants'
import {presentationLocaleNamespace} from './i18n'
import {previewUrlMachine} from './machines/preview-url'
import {PresentationSpinner} from './PresentationSpinner'
import PresentationTool from './PresentationTool'
import {
  type PresentationPluginOptions,
  type PreviewUrlAllowOption,
  type PreviewUrlOption,
} from './types'
// import {usePresentationPerspective} from './usePresentationPerspective'
import {useVercelBypassSecret} from './useVercelBypassSecret'

export default function PresentationToolGrantsCheck({
  tool,
}: {
  tool: Tool<PresentationPluginOptions>
}): React.JSX.Element {
  const {t} = useTranslation(presentationLocaleNamespace)
  const {previewUrl} = tool.options ?? {}
  const {push: pushToast} = useToast()
  const willGeneratePreviewUrlSecret =
    typeof previewUrl === 'object' || typeof previewUrl === 'function'

  const previewUrlRef = usePreviewUrlActorRef(tool.options?.previewUrl, tool.options?.allow)

  const previewAccessSharingCreatePermission = useSelector(
    previewUrlRef,
    (state) => state.context.previewAccessSharingCreatePermission,
  )
  const previewAccessSharingUpdatePermission = useSelector(
    previewUrlRef,
    (state) => state.context.previewAccessSharingUpdatePermission,
  )
  const previewAccessSharingReadPermission = useSelector(
    previewUrlRef,
    (state) => state.context.previewAccessSharingReadPermission,
  )
  const previewUrlSecretPermission = useSelector(
    previewUrlRef,
    (state) => state.context.previewUrlSecretPermission,
  )
  const url = useSelector(previewUrlRef, (state) => state.context.previewUrl)

  const canCreateUrlPreviewSecrets = previewUrlSecretPermission?.granted

  useEffect(() => {
    if (!willGeneratePreviewUrlSecret || canCreateUrlPreviewSecrets !== false) return undefined
    const raf = requestAnimationFrame(() =>
      pushToast({
        closable: true,
        status: 'error',
        duration: Infinity,
        title: t('preview-url-secret.missing-grants'),
      }),
    )
    return () => cancelAnimationFrame(raf)
  }, [canCreateUrlPreviewSecrets, pushToast, t, willGeneratePreviewUrlSecret])

  // @TODO the vercel protection bypass can be moved to the iframe level
  const [vercelProtectionBypass, vercelProtectionBypassReadyState] = useVercelBypassSecret()

  if (
    !url ||
    vercelProtectionBypassReadyState === 'loading' ||
    (willGeneratePreviewUrlSecret &&
      (!previewAccessSharingCreatePermission ||
        typeof previewAccessSharingCreatePermission.granted === 'undefined' ||
        !previewAccessSharingUpdatePermission ||
        typeof previewAccessSharingUpdatePermission.granted === 'undefined' ||
        !previewUrlSecretPermission ||
        !previewAccessSharingReadPermission ||
        typeof previewAccessSharingReadPermission.granted === 'undefined' ||
        typeof previewUrlSecretPermission.granted === 'undefined'))
  ) {
    return <PresentationSpinner />
  }

  return (
    <PresentationTool
      tool={tool}
      initialPreviewUrl={url}
      vercelProtectionBypass={vercelProtectionBypass}
      canToggleSharePreviewAccess={
        previewAccessSharingCreatePermission?.granted === true &&
        previewAccessSharingUpdatePermission?.granted === true
      }
      canUseSharedPreviewAccess={previewAccessSharingReadPermission?.granted === true}
      previewUrlRef={previewUrlRef}
    />
  )
}

function usePreviewUrlActorRef(
  previewUrlOption: PreviewUrlOption | undefined,
  allowOption: PreviewUrlAllowOption | undefined,
) {
  const grantsStore = useGrantsStore()
  const client = useClient({apiVersion: API_VERSION})
  const currentUser = useCurrentUser()
  const currentUserId = currentUser?.id
  const workspace = useActiveWorkspace()
  const studioBasePath = workspace?.activeWorkspace?.basePath || '/'
  // const perspective = usePresentationPerspective()
  const router = useRouter()
  const routerSearchParams = new URLSearchParams(router.state._searchParams)
  const previewSearchParam = routerSearchParams.get('preview')

  const actorRef = useActorRef(
    previewUrlMachine.provide({
      actors: {
        'create preview secret': defineCreatePreviewSecretActor({client, currentUserId}),
        'resolve allow patterns': defineResolveAllowPatternsActor({
          client,
          allowOption,
        }),
        'resolve initial url': defineResolveInitialUrlActor({
          client,
          studioBasePath,
          previewUrlOption,
        }),
        'resolve preview mode': defineResolvePreviewModeActor({
          client,
          previewUrlOption,
        }),
        'resolve preview mode url': defineResolvePreviewModeUrlActor({
          client,
          studioBasePath,
          previewUrlOption,
        }),
        'check permission': fromObservable(({input}) =>
          grantsStore.checkDocumentPermission(input.checkPermissionName, input.document),
        ),
      },
    }),
    {input: {previewSearchParam}},
  )

  /**
   * Sync changes to router state for the preview search param
   */
  useEffect(() => {
    actorRef.send({type: 'set preview search param', previewSearchParam})
  }, [actorRef, previewSearchParam])

  const error = useSelector(actorRef, (state) =>
    state.hasTag('error') ? state.context.error : null,
  )
  // Propagate the error to the nearest error boundary
  if (error) throw error

  return actorRef
}
