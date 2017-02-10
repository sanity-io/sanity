import React, {PropTypes} from 'react'
import styles from '../styles/contentStyles/ListItem.css'

const listStyles = ['bullet', 'number', 'roman']

function ListItem(props) {
  const listStyle = props.listStyle
  if (!listStyles.includes(listStyle)) {
    throw new Error(`Don't know how to handle listStyle '${listStyle}'. Expected one of '${listStyles.join("', '")}'`)
  }
  return <li {...props.attributes} className={styles[listStyle]}>{props.children}</li>
}

ListItem.propTypes = {
  attributes: PropTypes.object,
  listStyle: PropTypes.oneOf(listStyles),
  children: PropTypes.node
}

export default ListItem
