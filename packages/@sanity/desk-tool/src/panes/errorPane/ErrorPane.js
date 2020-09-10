import React from 'react'
import PropTypes from 'prop-types'
import DefaultPane from 'part:@sanity/components/panes/default'
import styles from './ErrorPane.css'

export default function ErrorPane(props) {
  return (
    <DefaultPane color="danger" title="Error" isSelected={false} isCollapsed={false}>
      <div className={styles.root}>{props.children}</div>
    </DefaultPane>
  )
}

ErrorPane.propTypes = {
  children: PropTypes.node.isRequired
}
