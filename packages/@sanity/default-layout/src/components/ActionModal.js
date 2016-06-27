import React, {PropTypes} from 'react'
import styles from 'style:@sanity/default-layout/action-modal'
import {Link} from 'router:@sanity/base/router'
import locationStore from 'datastore:@sanity/base/location'

function ActionModal(props) {
  return (
    <div className={styles.modal}>
      <h1>{props.title}</h1>

      {props.actions.map(action =>
        <Link
          key={action.title}
          onClick={props.onClose}
          href={action.url}
          className={styles.actionLink}>
          {action.title}
        </Link>
      )}

      <button className={styles.closeButton} onClick={props.onClose}>✖</button>
    </div>
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
