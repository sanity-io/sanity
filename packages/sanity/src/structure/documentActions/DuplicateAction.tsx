import {CopyIcon} from '@sanity/icons'
import {uuid} from '@sanity/uuid'
import React, {useCallback, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {structureLocaleNamespace} from '../i18n'
import {useRouter} from 'sanity/router'
import {
  DocumentActionComponent,
  InsufficientPermissionsMessage,
  useDocumentPairPermissions,
  useDocumentOperation,
  useCurrentUser,
  useTranslation,
  useDocumentStore,
} from 'sanity'

const DISABLED_REASON_KEY = {
  NOTHING_TO_DUPLICATE: 'action.duplicate.disabled.nothing-to-duplicate',
  NOT_READY: 'action.duplicate.disabled.not-ready',
}

/** @internal */
export const DuplicateAction: DocumentActionComponent = ({id, type, onComplete}) => {
  const documentStore = useDocumentStore()
  const {duplicate} = useDocumentOperation(id, type)
  const {navigateIntent} = useRouter()
  const [isDuplicating, setDuplicating] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'duplicate',
  })

  const {t} = useTranslation(structureLocaleNamespace)

  const currentUser = useCurrentUser()

  const handle = useCallback(async () => {
    const dupeId = uuid()

    setDuplicating(true)

    // set up the listener before executing
    const duplicateSuccess = firstValueFrom(
      documentStore.pair
        .operationEvents(id, type)
        .pipe(filter((e) => e.op === 'duplicate' && e.type === 'success')),
    )
    duplicate.execute(dupeId)

    // only navigate to the duplicated document when the operation is successful
    await duplicateSuccess
    navigateIntent('edit', {id: dupeId, type})

    onComplete()
  }, [documentStore.pair, duplicate, id, navigateIntent, onComplete, type])

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
