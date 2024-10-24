import {useCallback, useState} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../config'
import {START_IN_CREATE_ACTION_NAME} from '../../config/create/startInCreateSortedActions'
import {useTranslation} from '../../i18n'
import {useSchemaType} from '../../scheduledPublishing/hooks/useSchemaType'
import {isStartInCreateAutoConfirmed, setStartInCreateAutoConfirm} from '../createStorage'
import {isSanityCreateExcludedType} from '../createUtils'
import {createLocaleNamespace} from '../i18n'
import {type AppIdCache} from '../studio-app/appIdCache'
import {useStudioAppIdStore} from '../studio-app/useStudioAppIdStore'
import {type CreateLinkedSanityDocument} from '../types'
import {useSanityCreateTelemetry} from '../useSanityCreateTelemetry'
import {CreateLinkingDialog} from './CreateLinkingDialog'
import {StartInCreateDialog} from './StartInCreateDialog'

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
  const schemaType = useSchemaType(type)
  const telemetry = useSanityCreateTelemetry()

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [isLinking, setLinking] = useState(false)
  const [autoConfirm, setAutoConfirm] = useState(() => isStartInCreateAutoConfirmed())
  const closeDialog = useCallback(() => setDialogOpen(false), [])

  const linkingStarted = useCallback((dontShowAgain: boolean) => {
    setStartInCreateAutoConfirm(dontShowAgain)
    setAutoConfirm(dontShowAgain)
    setLinking(true)
  }, [])

  const isExcludedByOption = schemaType && isSanityCreateExcludedType(schemaType)
  const createLinkId = (draft?._id ?? published?._id ?? liveEdit) ? id : `drafts.${id}`

  //appId will always be undefined when start in create is disabled via config
  if (isExcludedByOption || !appId || doc?._createdAt) {
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
              createLinkId={createLinkId}
              appId={appId}
              type={type}
              autoConfirm={autoConfirm}
            />
          ),
        },
    onHandle: () => {
      if (!isDialogOpen) {
        telemetry.linkCtaClicked()
      }
      setDialogOpen(true)
    },
    tone: 'default',
  }
}
