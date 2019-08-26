import React from 'react'
import PropTypes from 'prop-types'
import DefaultPane from 'part:@sanity/components/panes/default'
import styles from './styles/ErrorPane.css'

export default function ErrorPane(props) {
  return (
    <DefaultPane title="Error" isSelected={false} isCollapsed={false} isScrollable={false}>
      <div className={styles.root}>
        <div className={styles.message}>{props.children}</div>
      </div>
    </DefaultPane>
  )
}

ErrorPane.propTypes = {
  children: PropTypes.node.isRequired
}
