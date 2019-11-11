import CloseIcon from 'part:@sanity/base/close-icon'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'

// eslint-disable-next-line import/prefer-default-export, complexity
export function getDocumentPaneFooterActions(props) {
  const {
    draft,
    enabledActions,
    errors,
    handlers,
    isCreatingDraft,
    isLiveEditEnabled,
    isPublishing,
    isReconnecting,
    isUnpublishing,
    published
  } = props

  const isNonexistent = !draft && !published

  const actions = [
    {
      color: 'primary',
      disabled:
        isCreatingDraft ||
        isPublishing ||
        isReconnecting ||
        isUnpublishing ||
        !draft ||
        errors.length > 0,
      id: 'publish',
      label: 'Publish',
      handleClick: handlers.publish
    },
    !isLiveEditEnabled && {
      id: 'discardChanges',
      label: 'Discard changes',
      icon: CloseIcon,
      handleClick: handlers.discardChanges
    },
    enabledActions.includes('delete') &&
      !isLiveEditEnabled && {
        disabled: !published,
        id: 'unpublish',
        label: 'Unpublish',
        icon: CloseIcon,
        handleClick: handlers.unpublish
      },
    enabledActions.includes('create') && {
      disabled: isNonexistent,
      id: 'duplicate',
      label: 'Duplicate',
      icon: ContentCopyIcon,
      handleClick: handlers.duplicate
    },
    enabledActions.includes('delete') && {
      disabled: isNonexistent,
      id: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      handleClick: handlers.delete
    }
  ]

  return actions.filter(Boolean)
}
