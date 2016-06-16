import React, {PropTypes} from 'react'
import styles from './styles/EditItem.css'
import Button from '../../buttons/Default'

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

        <div className={styles.head}>
          <h1 className={styles.title}>New {this.props.title || 'No title is set'}</h1>
          <button className={styles.close} type="button" onClick={this.handleClose}>Close</button>
        </div>

        <div className={styles.content}>
          {this.props.children}
        </div>

        <div className={styles.primaryFunctions}>
          <Button type="button" onClick={this.handleClose} kind="inverted">Close</Button>
        </div>

      </div>
    )
  }
}
