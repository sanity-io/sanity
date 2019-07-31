import PropTypes from 'prop-types'
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import FileIcon from 'part:@sanity/base/file-icon'
import styles from './styles/ActionModal.css'
import CreateDocumentList from 'part:@sanity/components/lists/create-document'

function ActionModal(props) {
  const {title, actions, onClose} = props
  return (
    <Dialog className={styles.modal} onClose={onClose} isOpen>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.listContainer}>
        <CreateDocumentList
          items={actions.map((action, i) => ({
            ...action,
            title: action.title,
            subtitle: action.params.type,
            key: `actionModal_${i}`,
            icon: action.icon || FileIcon,
            onClick: onClose
          }))}
        />
      </div>
    </Dialog>
  )
}

ActionModal.defaultProps = {
  title: 'New document',
  actions: []
}

ActionModal.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.array,
  onClose: PropTypes.func.isRequired
}

export default ActionModal
