import React, {PropTypes} from 'react'
import styles from '../styles/contentStyles/ListItem.css'

const listStyles = ['bullet', 'number', 'roman']

function ListItem(props) {
  const listStyle = props.listStyle
  if (!listStyles.includes(listStyle)) {
    throw new Error(`Don't know how to handle listStyle '${listStyle}'. Expected one of '${listStyles.join("', '")}'`)
  }
  const className = `${styles[listStyle]} ${props.isFirstItem ? styles.resetListCounter : ''}`
  return <li className={className}>{props.children}</li>
}

ListItem.propTypes = {
  isFirstItem: PropTypes.bool,
  listStyle: PropTypes.oneOf(listStyles),
  children: PropTypes.node
}

export default ListItem
