import {CopyIcon} from '@sanity/icons'
import {uuid} from '@sanity/uuid'
import React, {useCallback, useState} from 'react'
import {deskLocaleNamespace} from '../i18n'
import {useRouter} from 'sanity/router'
import {
  DocumentActionComponent,
  InsufficientPermissionsMessage,
  useDocumentPairPermissions,
  useDocumentOperation,
  useCurrentUser,
  useTranslation,
} from 'sanity'

const DISABLED_REASON_KEY = {
  NOTHING_TO_DUPLICATE: 'action.duplicate.disabled.nothing-to-duplicate',
  NOT_READY: 'action.duplicate.disabled.not-ready',
}

/** @internal */
export const DuplicateAction: DocumentActionComponent = ({id, type, onComplete}) => {
  const {duplicate} = useDocumentOperation(id, type)
  const {navigateIntent} = useRouter()
  const [isDuplicating, setDuplicating] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'duplicate',
  })

  const {t} = useTranslation(deskLocaleNamespace)

  const currentUser = useCurrentUser()

  const handle = useCallback(() => {
    const dupeId = uuid()

    setDuplicating(true)
    duplicate.execute(dupeId)
    navigateIntent('edit', {id: dupeId, type})
    onComplete()
  }, [duplicate, navigateIntent, onComplete, type])

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      icon: CopyIcon,
      disabled: true,
      label: t('action.duplicate.label'),
      title: (
        <InsufficientPermissionsMessage context="duplicate-document" currentUser={currentUser} />
      ),
    }
  }

  return {
    icon: CopyIcon,
    disabled: isDuplicating || Boolean(duplicate.disabled) || isPermissionsLoading,
    label: isDuplicating ? t('action.duplicate.running.label') : t('action.duplicate.label'),
    title: duplicate.disabled ? t(DISABLED_REASON_KEY[duplicate.disabled]) : '',
    onHandle: handle,
  }
}

DuplicateAction.action = 'duplicate'
