import React, {PropTypes} from 'react'
import styles from './styles/AddItem.css'

export default class AddItem extends React.Component {
  render() {
    return (
      <div className={styles.root}>
        <h1 className={styles.title}>{this.props.title}</h1>
        <div className={styles.content}>
          {this.props.children}
        </div>
      </div>
    )
  }
}
