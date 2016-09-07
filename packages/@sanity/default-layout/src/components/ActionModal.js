import React, {PropTypes} from 'react'
import {StateLink} from '@sanity/state-router'
import FullScreenDialog from 'component:@sanity/components/dialogs/fullscreen'
import styles from 'style:@sanity/default-layout/action-modal'

function ActionModal(props) {
  return (
    <FullScreenDialog className={styles.modal} title={props.title} onClose={props.onClose}>
      <ul className={styles.content}>
        {props.actions.map(action =>
          <li className={styles.item} key={action.title}>
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
