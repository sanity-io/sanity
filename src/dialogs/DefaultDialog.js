import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'

import styles from 'style:@sanity/components/dialogs/default'
import Button from 'component:@sanity/components/buttons/default'
import dialogPolyfill from 'dialog-polyfill'

export default class DefaultDialog extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['warning', 'success', 'danger']),
    className: PropTypes.string,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    onOpen: PropTypes.func,
    onClose: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onAction: PropTypes.func,
    showHeader: PropTypes.bool,
    actions: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      tooltip: PropTypes.string,
      kind: PropTypes.string
    }))
  }

  static defaultProps = {
    isOpen: false,
    showHeader: false,
    onAction() {},
    onOpen() {},
    actions: []
  }

  constructor(...args) {
    super(...args)
    this.handleActionClick = this.handleActionClick.bind(this)
    this.handleCloseClick = this.handleCloseClick.bind(this)
  }

  componentDidUpdate(prevProps) {
    const isOpen = this.props.isOpen
    const wasOpen = prevProps.isOpen
    if (!wasOpen && isOpen) {
      this.openDialogElement()
    } else if (wasOpen && !isOpen) {
      this.closeDialogElement()
    }
  }

  componentDidMount() {
    this.dialogElement = ReactDOM.findDOMNode(this)

    if (!this.dialogElement.showModal) {
      dialogPolyfill.registerDialog(this.dialogElement)
    }

    if (this.props.isOpen) {
      this.openDialogElement()
    } else {
      this.closeDialogElement()
    }
  }

  openDialogElement() {
    this.dialogElement.showModal()
    this.props.onOpen()
  }

  closeDialogElement() {
    if (this.dialogElement.open) {
      this.dialogElement.close()
    }
  }

  handleCloseClick() {
    this.props.onClose()
  }

  handleActionClick(event) {
    const actionId = event.currentTarget.getAttribute('data-action-id')
    this.props.onAction(
      this.props.actions.find(action => action.index === actionId)
    )
  }

  render() {
    const {title, actions, isOpen, showHeader} = this.props
    const style = `
      ${isOpen ? styles.isOpen : styles.root}
      ${showHeader ? styles.hasHeader : ''}
    `

    return (
      <dialog className={style}>

        {
          showHeader && <div className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            <button className={styles.closeButton} onClick={this.handleCloseClick} />
          </div>
        }

        <div className={styles.inner}>

          <div className={styles.content}>
            {this.props.children}
          </div>

          {
            actions.length > 0 && <div className={styles.functions}>
              {
                actions.map(action => {
                  return (
                    <Button
                      key={action.index}
                      onClick={this.handleActionClick}
                      data-action-id={action.index}
                      kind={action.kind}
                      className={styles[`button_${action.kind}`] || styles.button}
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
