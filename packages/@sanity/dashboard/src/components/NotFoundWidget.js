import PropTypes from 'prop-types'
import React from 'react'

import styles from './NotFoundWidget.css'

function NotFoundWidget(props) {
  return (
    <div className={styles.root}>
      <div>
        {props.title && <h2 className={styles.title}>{props.title}</h2>}
        <div className={styles.content}>{props.children}</div>
      </div>
    </div>
  )
}

NotFoundWidget.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any,
  // eslint-disable-next-line react/forbid-prop-types
  title: PropTypes.any
}

NotFoundWidget.defaultProps = {
  children: null,
  title: null
}

export default NotFoundWidget
