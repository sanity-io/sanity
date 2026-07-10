import {CopyIcon} from '@sanity/icons/Copy'
import {uuid} from '@sanity/uuid'
import {useCallback, useMemo, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  type DuplicateDocumentActionComponent,
  getPairTarget,
  getTargetScopeId,
  InsufficientPermissionsMessage,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useDocumentStore,
  useTranslation,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {structureLocaleNamespace} from '../i18n'
import {useDocumentPane} from '../panes/document/useDocumentPane'

const DISABLED_REASON_KEY = {
  NOTHING_TO_DUPLICATE: 'action.duplicate.disabled.nothing-to-duplicate',
  NOT_READY: 'action.duplicate.disabled.not-ready',
  TARGET_NOT_FOUND: 'action.duplicate.disabled.target-not-found',
}

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const useDuplicateAction: DuplicateDocumentActionComponent = ({id, type, mapDocument}) => {
  const documentStore = useDocumentStore()
  const {targetDocumentState} = useDocumentPane()
  // The scope of the document targeted by the selected perspective (undefined when the target is
  // still resolving or the draft/published pair applies). While resolving, the action is disabled
  // below instead of silently operating on the base pair.
  const isTargetReady = targetDocumentState.status === 'ready'
  const scopeId = getTargetScopeId(targetDocumentState)

  const {duplicate} = useDocumentOperation(id, type, getPairTarget(targetDocumentState))
  const {navigateIntent} = useRouter()
  const [isDuplicating, setDuplicating] = useState(false)

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: scopeId,
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
    duplicate.execute(dupeId, {mapDocument})

    // only navigate to the duplicated document when the operation is successful
    await duplicateSuccess
    navigateIntent('edit', {id: dupeId, type})

    setDuplicating(false)
  }, [documentStore.pair, duplicate, id, mapDocument, navigateIntent, type])

  return useMemo(() => {
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
      disabled:
        isDuplicating || Boolean(duplicate.disabled) || isPermissionsLoading || !isTargetReady,
      label: isDuplicating ? t('action.duplicate.running.label') : t('action.duplicate.label'),
      title: duplicate.disabled ? t(DISABLED_REASON_KEY[duplicate.disabled]) : '',
      onHandle: handle,
    }
  }, [
    currentUser,
    duplicate.disabled,
    handle,
    isDuplicating,
    isPermissionsLoading,
    isTargetReady,
    permissions?.granted,
    t,
  ])
}

useDuplicateAction.action = 'duplicate'
useDuplicateAction.displayName = 'DuplicateAction'
