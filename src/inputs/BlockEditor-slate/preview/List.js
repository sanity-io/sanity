import React, {PropTypes} from 'react'
import styles from '../styles/contentStyles/List.css'

const listStyles = ['bullet', 'number', 'roman']

function List(props) {
  const listStyle = props.listStyle
  const classNames = [styles.root]
  if (props.isPreview) {
    classNames.push(styles.preview)
  }
  if (listStyle === 'bullet') {
    classNames.push(styles.bullet)
    return <ul className={classNames.join(' ')}>{props.children}</ul>
  }
  if (listStyle === 'roman') {
    classNames.push(styles.roman)
    return <ol className={classNames.join(' ')}>{props.children}</ol>
  }
  if (listStyle === 'number') {
    classNames.push(styles.number)
    return <ol className={classNames.join(' ')}>{props.children}</ol>
  }
  throw new Error(`Don't know how to handle listStyle '${listStyle}'. Expected one of '${listStyles.join("', '")}'`)
}

List.propTypes = {
  listStyle: PropTypes.oneOf(listStyles),
  isPreview: PropTypes.bool,
  children: PropTypes.node
}

export default List
