import React from 'react'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import CreateDocumentList from 'part:@sanity/components/lists/create-document'
import FileIcon from 'part:@sanity/base/file-icon'
import styles from './ActionModal.css'

interface Props {
  actions: {icon?: React.ComponentType<{}>}[]
  onClose?: () => void
  title?: string
}

function ActionModal(props: Props) {
  const {title, actions, onClose} = props

  return (
    <FullscreenDialog cardClassName={styles.card} onClose={onClose} title={title} isOpen>
      {actions.length > 0 ? (
        <CreateDocumentList
          items={actions.map(action => ({
            ...action,
            icon: action.icon || FileIcon,
            onClick: onClose
          }))}
        />
      ) : (
        <h3>No initial value templates are configured.</h3>
      )}
    </FullscreenDialog>
  )
}

ActionModal.defaultProps = {
  title: 'New document',
  actions: []
}

export default ActionModal
