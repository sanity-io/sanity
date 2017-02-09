import React, {PropTypes} from 'react'
import styles from '../styles/contentStyles/ListItem.css'

const listStyles = ['bullet', 'number', 'roman']

function ListItem(props) {
  const listStyle = props.listStyle
  if (!listStyles.includes(listStyle)) {
    throw new Error(`Don't know how to handle listStyle '${listStyle}'. Expected one of '${listStyles.join("', '")}'`)
  }
  return <li style={props.counterCss} className={styles[listStyle]}>{props.children}</li>
}

ListItem.propTypes = {
  listStyle: PropTypes.oneOf(listStyles),
  counterCss: PropTypes.object,
  children: PropTypes.node
}

export default ListItem
