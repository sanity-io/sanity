import PropTypes from 'prop-types'
import React from 'react'
import {IntentLink} from 'part:@sanity/base/router'
import Dialog from 'part:@sanity/components/dialogs/default'
import FileIcon from 'part:@sanity/base/file-icon'
import styles from './styles/ActionModal.css'

function ActionModal(props) {
  return (
    <Dialog className={styles.modal} title={props.title} onClose={props.onClose} isOpen>
      <div className={styles.content}>
        <h1>Create new</h1>
        <ul className={styles.list}>
          {props.actions.map(action => {
            const Icon = action.icon
            return (
              <li className={styles.listItem} key={action.title}>
                <IntentLink
                  onClick={props.onClose}
                  className={styles.actionLink}
                  intent="create"
                  params={action.params}
                >
                  <span className={styles.icon}>{Icon ? <Icon /> : <FileIcon />}</span>
                  <span>{action.title}</span>
                </IntentLink>
              </li>
            )
          })}
        </ul>
      </div>
    </Dialog>
  )
}

ActionModal.defaultProps = {
  title: 'Create',
  actions: []
}

ActionModal.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.array,
  onClose: PropTypes.func.isRequired
}

export default ActionModal
