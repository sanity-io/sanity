import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/edititem/popover'
import Button from 'component:@sanity/components/buttons/default'

export default class EditItemPopOver extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onClose: PropTypes.func,
    isCreatingNewItem: PropTypes.bool
  }

  static defaultProps = {
    onClose() {}
  }

  constructor() {
    super()
    this.handleClose = this.handleClose.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
  }

  handleClose() {
    this.props.onClose()
  }

  handleClick(event) {
    event.stopPropagation()
  }

  handleMouseDown(event) {
    event.stopPropagation()
  }

  render() {
    const {title, children, className, isCreatingNewItem} = this.props
    return (
      <div className={`${styles.root} ${className}`} onClick={this.handleClick} onMouseDown={this.handleMouseDown}>
        <div className={styles.inner}>
          <div className={styles.head}>
            <h3 className={styles.title}>
              {
                isCreatingNewItem && 'New '
              }
              {title}
            </h3>
            <button className={styles.close} type="button" onClick={this.handleClose}>Close</button>
          </div>

          <div className={styles.content}>
            {children}
          </div>

          <div className={styles.primaryFunctions}>
            <Button type="button" onClick={this.handleClose} ripple colored>Close</Button>
          </div>
        </div>
      </div>
    )
  }
}
