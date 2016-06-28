import React, {PropTypes} from 'react'
import styles from './styles/EditItem.css'
import Button from 'component:@sanity/components/buttons/default'

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
          <h3 className={styles.title}>New {this.props.title || 'No title is set'}</h3>
          <button className={styles.close} type="button" onClick={this.handleClose}>Close</button>
        </div>

        <div className={styles.content}>
          {this.props.children}
        </div>

        <div className={styles.primaryFunctions}>
          <Button type="button" onClick={this.handleClose} ripple>Close</Button>
        </div>

      </div>
    )
  }
}

EditItem.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  onClose: PropTypes.func
}
