import React, {PropTypes} from 'react'

import styles from 'style:@sanity/components/dialogs/default'
import Button from 'component:@sanity/components/buttons/default'
import dialogPolyfill from 'dialog-polyfill'

export default class DefaultDialog extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['warning', 'success', 'danger']),
    className: PropTypes.string,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onCloseClick: PropTypes.func,
    onAction: PropTypes.func,
    showHeader: PropTypes.bool,
    actions: PropTypes.arrayOf(PropTypes.shape(
      {
        title: PropTypes.string.isRequired,
        id: PropTypes.string.isRequired,
        tooltip: PropTypes.string,
        kind: PropTypes.string
      }
    ))
  }

  static defaultProps = {
    showHeader: false,
    onAction() {},
    actions: []
  }

  constructor(...args) {
    super(...args)
    this.handleActionClick = this.handleActionClick.bind(this)
    this.handleCloseClick = this.handleCloseClick.bind(this)
  }

  componentWillReceiveProps(props) {
    if (props.isOpen) {
      this.handleOpen()
    } else {
      this.handleClose()
    }
  }

  componentDidMount() {
    this.dialog = dialogPolyfill.registerDialog(this.dialogElement) || this.dialogElement
    // Now dialog acts like a native <dialog>.
  }

  handleOpen() {
    this.dialog.showModal()
  }

  handleCloseClick() {
    this.handleClose()
    this.props.onCloseClick()
  }

  handleClose() {
    this.dialog.close()
  }

  handleActionClick(event) {
    const actionId = event.currentTarget.getAttribute('data-action-id')
    this.props.onAction(
      this.props.actions.find(action => action.id === actionId)
    )
  }

  render() {
    const {title, actions, isOpen, showHeader} = this.props
    const style = isOpen ? styles.isOpen : styles.root

    return (
      <dialog className={style} ref={(ref) => this.dialogElement = ref}>

        {
          showHeader && <div className={styles.header}>
            <h1 className={styles.heading}>{title}</h1>
            <button className={styles.closeButton} onClick={this.handleCloseClick} />
          </div>
        }

        <div className={styles.inner}>

          {
            !showHeader && <div>
              <h1 className={styles.bigHeading}>{title}</h1>
              <button className={styles.bigCloseButton} onClick={this.handleCloseClick} />
            </div>
          }

          <div className={styles.content}>
            {this.props.children}
          </div>

          {
            actions.length > 0 && <div className={styles.functions}>
              {
                actions.map(action => {
                  return (
                    <Button
                      key={action.id}
                      onClick={this.handleActionClick}
                      data-action-id={action.id}
                    >
                      {action.title}
                    </Button>
                  )
                })
              }
            </div>
          }
        </div>
      </dialog>
    )
  }
}
