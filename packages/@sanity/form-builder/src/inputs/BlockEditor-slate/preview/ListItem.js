import React, {PropTypes} from 'react'
import styles from '../styles/contentStyles/ListItem.css'

const listItems = ['bullet', 'number', 'roman']

function ListItem(props) {
  const listItem = props.listItem
  if (!listItems.includes(listItem)) {
    throw new Error(`Don't know how to handle listItem '${listItem}'. `
      + `Expected one of '${listItems.join("', '")}'`)
  }
  return (
    <li {...props.attributes} className={styles[listItem]}>
      { props.contentComponent({children: props.children}) }
    </li>
  )
}

ListItem.propTypes = {
  attributes: PropTypes.object,
  listItem: PropTypes.oneOf(listItems),
  children: PropTypes.node,
  contentComponent: PropTypes.func
}

export default ListItem
