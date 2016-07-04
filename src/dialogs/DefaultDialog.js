import React, {PropTypes} from 'react'

import styles from 'style:@sanity/components/dialogs/default'
import Button from 'component:@sanity/components/buttons/default'

export default class DefaultDialog extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['warning', 'success', 'danger']),
    className: PropTypes.string,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onAction: PropTypes.func,
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
    onAction() {}
  }

  constructor(...args) {
    super(...args)
    this.handleActionClick = this.handleActionClick.bind(this)
  }

  componentDidMount() {
    this.dialog.showModal()
  }

  handleActionClick(e) {
    debugger
    const actionId = e.currentTarget.getAttribute('data-action-id')
    this.props.onAction(
      this.props.actions.find(action => action.id === actionId)
    )
  }

  render() {

    const {kind, title, className, onClose, actions} = this.props

    const style = styles.root

    return (
      <dialog className={style} ref={(ref) => this.dialog = ref} >
        <button className={styles.closeButton} onClick={onClose} />
        <div className={styles.inner}>
          <h1 className={styles.heading}>{title}</h1>
          <div className={styles.content}>
            {this.props.children}
          </div>
        </div>

        <div className={styles.functions}>
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
      </dialog>
    )
  }
}
