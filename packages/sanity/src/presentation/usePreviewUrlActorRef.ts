import {useToast} from '@sanity/ui'
import {useActorRef, useSelector} from '@xstate/react'
import {useEffect} from 'react'
import {useActiveWorkspace, useClient, useCurrentUser, useGrantsStore, useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'
import {fromObservable} from 'xstate'

import {defineCreatePreviewSecretActor} from './actors/create-preview-secret'
import {defineReadSharedSecretActor} from './actors/read-shared-secret'
import {defineResolveAllowPatternsActor} from './actors/resolve-allow-patterns'
import {defineResolveInitialUrlActor} from './actors/resolve-initial-url'
import {defineResolvePreviewModeActor} from './actors/resolve-preview-mode'
import {defineResolvePreviewModeUrlActor} from './actors/resolve-preview-mode-url'
import {API_VERSION} from './constants'
import {presentationLocaleNamespace} from './i18n'
import {previewUrlMachine, type PreviewUrlRef} from './machines/preview-url'
import {type PreviewUrlAllowOption, type PreviewUrlOption} from './types'
import {usePresentationPerspective} from './usePresentationPerspective'

export function usePreviewUrlActorRef(
  previewUrlOption: PreviewUrlOption | undefined,
  allowOption: PreviewUrlAllowOption | undefined,
): PreviewUrlRef {
  const grantsStore = useGrantsStore()
  const client = useClient({apiVersion: API_VERSION})
  const currentUser = useCurrentUser()
  const currentUserId = currentUser?.id
  const workspace = useActiveWorkspace()
  const studioBasePath = workspace?.activeWorkspace?.basePath || '/'
  const router = useRouter()
  const routerSearchParams = new URLSearchParams(router.state._searchParams)
  const previewSearchParam = routerSearchParams.get('preview')
  const {push: pushToast} = useToast()
  const {t} = useTranslation(presentationLocaleNamespace)
  const perspective = usePresentationPerspective()

  const actorRef = useActorRef(
    previewUrlMachine.provide({
      actions: {
        'notify preview will likely fail': () =>
          pushToast({
            id: 'preview-url-secret.missing-grants',
            closable: true,
            status: 'error',
            duration: Infinity,
            title: t('preview-url-secret.missing-grants'),
          }),
      },
      actors: {
        'create preview secret': defineCreatePreviewSecretActor({client, currentUserId}),
        'read shared preview secret': defineReadSharedSecretActor({client}),
        'resolve allow patterns': defineResolveAllowPatternsActor({
          client,
          allowOption,
        }),
        'resolve initial url': defineResolveInitialUrlActor({
          client,
          studioBasePath,
          previewUrlOption,
          perspective,
        }),
        'resolve preview mode': defineResolvePreviewModeActor({
          client,
          previewUrlOption,
        }),
        'resolve preview mode url': defineResolvePreviewModeUrlActor({
          client,
          studioBasePath,
          previewUrlOption,
          perspective,
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
    // eslint-disable-next-line no-nested-ternary
    state.status === 'error' ? state.error : state.hasTag('error') ? state.context.error : null,
  )

  // Propagate the error to the nearest error boundary
  if (error) throw error

  return actorRef
}
