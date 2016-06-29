import React, {PropTypes} from 'react'

import styles from 'style:@sanity/components/dialogs/fullscreen'

export default class FullScreenDialog extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['add', 'delete', 'warning', 'success', 'danger']),
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    onClose: PropTypes.func
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      opened: true
    }
    this.handleClose = this.handleClose.bind(this)
  }

  handleClose() {
    this.setState({
      opened: false
    })
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render() {

    const {kind, title, className} = this.props

    if (!styles[kind] && kind) {
      console.error(`There is no ${kind} fullscreen dialog`) // eslint-disable-line no-console
    }

    const style = `${styles[kind] || styles.root} ${className} ${this.state.opened ? styles.opened : styles.closed}`

    return (
      <div className={style}>
        <button className={styles.closeButton} onClick={this.handleClose} />
        <div className={styles.inner}>
          <h1 className={styles.heading}>{title}</h1>
          <div className={styles.content}>
            {this.props.children}
          </div>
        </div>
      </div>
    )
  }
}
