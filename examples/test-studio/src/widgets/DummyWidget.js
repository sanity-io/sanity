import PropTypes from 'prop-types'
import React from 'react'

import styles from './DummyWidget.css'

function DummyWidget(props) {
  return <div className={styles.root}>{props.children}</div>
}

DummyWidget.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any,
}

DummyWidget.defaultProps = {
  children: 'Dummy',
}

export default {
  name: 'dummy',
  component: DummyWidget,
}
