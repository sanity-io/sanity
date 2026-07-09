import {TrashIcon} from '@sanity/icons/Trash'
import {useCallback, useState} from 'react'

import {InsufficientPermissionsMessage} from '../../../components/InsufficientPermissionsMessage'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useTargetDocument} from '../../../hooks/useTargetDocument'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPairPermissions} from '../../../store/grants/documentPairPermissions'
import {useCurrentUser} from '../../../store/user/hooks'
import {DiscardVersionDialog} from '../../components/dialog/DiscardVersionDialog'
import {isGoingToUnpublish} from '../../util/isGoingToUnpublish'

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const useDiscardVersionAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, type, version} = props
  const currentUser = useCurrentUser()
  const {t} = useTranslation()
  const {selectedPerspective} = usePerspective()
  const willUnpublish = version ? isGoingToUnpublish(version) : false
  const targetDocument = useTargetDocument(id)
  // The scope of the document targeted by the selected perspective (undefined when the document
  // doesn't exist yet, in which case the permissions check falls back to the draft/published pair).
  const scopeId = targetDocument?._system.scopeId

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: scopeId,
    permission: 'discardVersion',
  })

  const [dialogOpen, setDialogOpen] = useState(false)

  // Callbacks
  const handleDialogOpen = useCallback(() => {
    setDialogOpen(true)
  }, [])

  if (!version) return null
  const insufficientPermissions = !isPermissionsLoading && !permissions?.granted

  if (insufficientPermissions) {
    return {
      disabled: true,
      icon: TrashIcon,
      label: 'no permissions',
      title: <InsufficientPermissionsMessage currentUser={currentUser} context="discard-changes" />,
    }
  }

  return {
    disabled: isPermissionsLoading || !permissions?.granted,
    dialog: dialogOpen && {
      type: 'custom',
      component: (
        <DiscardVersionDialog
          isGoingToUnpublish={willUnpublish}
          documentId={version._id}
          documentType={type}
          onClose={() => setDialogOpen(false)}
          fromPerspective={selectedPerspective}
        />
      ),
    },
    label: t('release.action.discard-version'),
    icon: TrashIcon,
    onHandle: handleDialogOpen,
    title: t('release.action.discard-version'),
  }
}

useDiscardVersionAction.action = 'discardVersion'
useDiscardVersionAction.displayName = 'DiscardVersionAction'
