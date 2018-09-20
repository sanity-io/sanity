import styles from './styles/PaneItem.css'
import listStyles from './styles/ListView.css'
import PropTypes from 'prop-types'
import React from 'react'
import Ink from 'react-ink'
import {StateLink} from 'part:@sanity/base/router'
import {Item as GridListItem} from 'part:@sanity/components/lists/grid'

export default function PaneItemWrapper(props) {
  const {useGrid, linkState, layout, isSelected} = props
  const link = (
    <StateLink state={linkState} className={styles.link}>
      {props.children}
      <Ink duration={1000} opacity={0.1} radius={200} />
    </StateLink>
  )

  return useGrid ? (
    <GridListItem className={listStyles[`${layout}ListItem`]}>{link}</GridListItem>
  ) : (
    <div className={isSelected ? styles.selected : styles.item}>{link}</div>
  )
}

PaneItemWrapper.propTypes = {
  layout: PropTypes.string,
  useGrid: PropTypes.bool,
  isSelected: PropTypes.bool,
  linkState: PropTypes.object,
  children: PropTypes.node
}
