import React, {PropTypes} from 'react'
import styles from './styles/EditItem.css'

export default class EditItem extends React.Component {
  constructor() {
    super()
    this.handleClose = this.handleClose.bind(this)
  }

  handleClose() {
    this.props.onClose()
  }
  render() {
    return (
      <div className={styles.root}>
        {
          //<h1 className={styles.title}>{this.props.title || 'No title is set'}</h1>
        }

        {
          //<button className={styles.close} type="button" onClick={this.handleClose}>×</button>
        }
        <div className={styles.content}>
          {this.props.children}
        </div>
        <button className={styles.bottomClose} type="button" onClick={this.handleClose}>Ok</button>
      </div>
    )
  }
}
