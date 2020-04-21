import PropTypes from 'prop-types'
import React, {useContext} from 'react'
import {Item as GridListItem} from 'part:@sanity/components/lists/grid'
import {PaneRouterContext} from '../../contexts/PaneRouterContext'
import styles from './PaneItem.css'
import listStyles from '../../components/listView/ListView.css'

const PaneItemWrapper = props => {
  const {ChildLink} = useContext(PaneRouterContext)
  const {id, useGrid, layout, isSelected} = props
  const link = (
    <ChildLink childId={id} className={isSelected ? styles.linkIsSelected : styles.link}>
      {props.children}
    </ChildLink>
  )

  return useGrid ? (
    <GridListItem className={listStyles[`${layout}ListItem`]}>{link}</GridListItem>
  ) : (
    <div className={isSelected ? styles.selected : styles.item}>{link}</div>
  )
}

PaneItemWrapper.propTypes = {
  id: PropTypes.string.isRequired,
  layout: PropTypes.string,
  useGrid: PropTypes.bool,
  isSelected: PropTypes.bool,
  children: PropTypes.node
}

export default PaneItemWrapper
