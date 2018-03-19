import PropTypes from 'prop-types'
import React from 'react'
import styles from '../styles/contentStyles/ListItem.css'

const listItems = ['bullet', 'number', 'roman']

function ListItem(props) {
  const listItem = props.listItem
  if (!listItems.includes(listItem)) {
    throw new Error(
      `Don't know how to handle listItem '${listItem}'. ` +
        `Expected one of '${listItems.join("', '")}'`
    )
  }
  const className = `${styles[listItem]} ${styles[`level-${props.level}`]}`
  return (
    <div {...props.attributes} className={className}>
      {props.contentComponent({children: props.children})}
    </div>
  )
}

ListItem.propTypes = {
  attributes: PropTypes.object,
  listItem: PropTypes.oneOf(listItems),
  level: PropTypes.number,
  children: PropTypes.node,
  contentComponent: PropTypes.func
}

export default ListItem
