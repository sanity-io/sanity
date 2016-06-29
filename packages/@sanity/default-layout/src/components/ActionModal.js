import React, {PropTypes} from 'react'
import {Link} from 'router:@sanity/base/router'
import locationStore from 'datastore:@sanity/base/location'
import FullScreenDialog from 'component:@sanity/components/dialogs/fullscreen'
import styles from 'style:@sanity/default-layout/action-modal'

function ActionModal(props) {
  return (
    <FullScreenDialog className={styles.modal} title={props.title} onClose={props.onClose}>
      <ul className={styles.content}>
        {props.actions.map(action =>
          <li className={styles.item} key={action.title}>
            <Link
              onClick={props.onClose}
              href={action.url}
              className={styles.actionLink}
            >
              {action.title}
            </Link>
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
