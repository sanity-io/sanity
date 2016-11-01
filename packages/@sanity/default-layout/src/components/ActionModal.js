import React, {PropTypes} from 'react'
import {StateLink} from '@sanity/state-router'
import FullScreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import styles from 'part:@sanity/default-layout/action-modal-style'

function ActionModal(props) {
  return (
    <FullScreenDialog className={styles.modal} title={props.title} onClose={props.onClose}>
      <div className={styles.content}>
        <ul className={styles.list}>
          {props.actions.map(action =>
            <li className={styles.listItem} key={action.title}>
              <StateLink
                onClick={props.onClose}
                state={action.nextState}
                className={styles.actionLink}
              >
                {action.title}
              </StateLink>
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
