import React, {PropTypes} from 'react'
import {IntentLink} from 'part:@sanity/base/router'
import FullScreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import styles from './styles/ActionModal.css'

function ActionModal(props) {
  return (
    <FullScreenDialog className={styles.modal} title={props.title} onClose={props.onClose} isOpen>
      <div className={styles.content}>
        <ul className={styles.list}>
          {props.actions.map(action =>
            <li className={styles.listItem} key={action.title}>
              <IntentLink
                onClick={props.onClose}
                className={styles.actionLink}
                intent="create"
                params={action.params}
              >
                {action.title}
              </IntentLink>
            </li>
          )}
        </ul>
      </div>
    </FullScreenDialog>
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
