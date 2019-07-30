import PropTypes from 'prop-types'
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import FileIcon from 'part:@sanity/base/file-icon'
import styles from './styles/ActionModal.css'
import DialogContent from 'part:@sanity/components/dialogs/content'
import CreateDocumentList from 'part:@sanity/components/lists/create-document'

function ActionModal(props) {
  const {title, actions, onClose} = props
  return (
    <Dialog className={styles.modal} onClose={onClose} isOpen padding="none">
      <div className={styles.contentWrapper}>
        <DialogContent size="auto" padding="medium">
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.listContainer}>
            <CreateDocumentList
              items={actions.map((action, i) => {
                return {
                  ...action,
                  key: `actionModal_${i}`,
                  icon: action.icon || FileIcon,
                  onClick: onClose
                }
              })}
            />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  )
}

ActionModal.defaultProps = {
  title: 'Create new',
  actions: []
}

ActionModal.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.array,
  onClose: PropTypes.func.isRequired
}

export default ActionModal
