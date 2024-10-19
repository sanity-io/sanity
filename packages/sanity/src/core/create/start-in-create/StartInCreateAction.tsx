import {useCallback, useState} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../config'
import {useTranslation} from '../../i18n'
import {createLocaleNamespace} from '../i18n'
import {type AppIdCache} from '../studio-app/appIdCache'
import {useStudioAppIdStore} from '../studio-app/useStudioAppIdStore'
import {type CreateLinkedSanityDocument} from '../types'
import {CreateLinkingDialog} from './CreateLinkingDialog'
import {StartInCreateDialog} from './StartInCreateDialog'

// The "Start in Create" action must be sorted first, so we need a sort key; the action string –
// we also don't want this string in the config interfaces, so we need the cheeky cast to smuggle it through
export const START_IN_CREATE_ACTION_NAME =
  'startInCreate' as unknown as DocumentActionComponent['action']

export function createStartInCreateAction(appIdCache: AppIdCache): DocumentActionComponent {
  const StartInCreateActionWrapper: DocumentActionComponent = function StartInCreateActionWrapper(
    props: DocumentActionProps,
  ): DocumentActionDescription | null {
    return StartInCreateAction({appIdCache, ...props})
  }

  StartInCreateActionWrapper.action = START_IN_CREATE_ACTION_NAME
  return StartInCreateActionWrapper
}

export function StartInCreateAction(
  props: DocumentActionProps & {appIdCache: AppIdCache},
): DocumentActionDescription | null {
  const {id, type, draft, liveEdit, published, appIdCache} = props
  const doc = (draft ?? published) as CreateLinkedSanityDocument

  const {appId} = useStudioAppIdStore(appIdCache)
  const {t} = useTranslation(createLocaleNamespace)

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [isLinking, setLinking] = useState(false)

  const closeDialog = useCallback(() => setDialogOpen(false), [])
  const linkingStarted = useCallback(() => setLinking(true), [])

  const createLinkId = (draft?._id ?? published?._id ?? liveEdit) ? id : `drafts.${id}`

  //appId will always be undefined when start in create is disabled via config
  if (!appId || doc?._createdAt) {
    return null
  }

  return {
    label: t('start-in-create-action.label'),
    dialog: isLinking
      ? {
          type: 'custom',
          component: <CreateLinkingDialog />,
        }
      : isDialogOpen && {
          type: 'dialog',
          onClose: closeDialog,
          header: t('start-in-create-dialog.header'),
          width: 'small',
          content: (
            <StartInCreateDialog
              onLinkingStarted={linkingStarted}
              publicId={id}
              createLinkId={createLinkId}
              appId={appId}
              type={type}
            />
          ),
        },
    onHandle: () => {
      setDialogOpen(true)
    },
  }
}
