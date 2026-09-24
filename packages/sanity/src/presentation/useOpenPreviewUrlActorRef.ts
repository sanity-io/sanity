import {useActorRef} from '@xstate/react'
import {useEffect} from 'react'
import {useClient, useCurrentUser, useGrantsStore} from 'sanity'
import {fromObservable} from 'xstate'

import {defineCreatePreviewSecretActor} from './actors/create-preview-secret'
import {defineReadSharedSecretActor} from './actors/read-shared-secret'
import {defineResolvePreviewModeActor} from './actors/resolve-preview-mode'
import {API_VERSION} from './constants'
import {openPreviewUrlMachine, type OpenPreviewUrlRef} from './machines/open-preview-url'
import {type PreviewUrlOption} from './types'

export function useOpenPreviewUrlActorRef(
  previewUrlOption: PreviewUrlOption | undefined,
  targetOrigin: string,
): OpenPreviewUrlRef {
  const grantsStore = useGrantsStore()
  const client = useClient({apiVersion: API_VERSION})
  const currentUser = useCurrentUser()
  const currentUserId = currentUser?.id

  const actorRef = useActorRef(
    openPreviewUrlMachine.provide({
      actors: {
        'create preview secret': defineCreatePreviewSecretActor({client, currentUserId}),
        'read shared preview secret': defineReadSharedSecretActor({client}),
        'resolve preview mode': defineResolvePreviewModeActor({client, previewUrlOption}),
        'check permission': fromObservable(({input}) =>
          grantsStore.checkDocumentPermission(input.checkPermissionName, input.document),
        ),
      },
    }),
    {input: {targetOrigin}},
  )

  /**
   * Preview mode is resolved per origin, so follow the iframe when it moves to another one
   */
  useEffect(() => {
    actorRef.send({type: 'set target origin', targetOrigin})
  }, [actorRef, targetOrigin])

  return actorRef
}
