import React, {PropTypes} from 'react'
import styles from '../styles/contentStyles/ListItem.css'

function ListItem(props) {
  if (props.isPreview) {
    // Return as a div, because the we don't know the context it will be previewed, and
    // return in a li or wrapping in ol/ul might be very inappropriate in that context.
    return <div className={`${styles.root} ${styles.preview}`}>{props.children}</div>
  }
  return <li className={styles.root}>{props.children}</li>
}

ListItem.propTypes = {
  isPreview: PropTypes.bool,
  children: PropTypes.node
}

export default ListItem
