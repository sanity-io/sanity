import PropTypes from 'prop-types'
import React from 'react'

import styles from 'part:@sanity/components/dialogs/fullscreen-style'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import ButtonCollection from 'part:@sanity/components/buttons/button-collection'
import {partition} from 'lodash'
import {Portal} from '../utilities/Portal'
import StackedEscapable from '../utilities/StackedEscapable'

export default class FullScreenDialog extends React.PureComponent {
  static propTypes = {
    color: PropTypes.oneOf(['default', 'warning', 'info', 'success', 'danger']),
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    onClose: PropTypes.func,
    isOpen: PropTypes.bool,
    onAction: PropTypes.func,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        tooltip: PropTypes.string,
        kind: PropTypes.string,
        autoFocus: PropTypes.bool
      })
    )
  }

  static defaultProps = {
    color: 'default',
    isOpen: true,
    onAction() {},
    onClose() {},
    actions: []
  }

  handleActionClick = event => {
    const actionIndex = event.currentTarget.getAttribute('data-action-index')
    this.props.onAction(this.props.actions[actionIndex])
  }

  createActionButton = (action, i) => {
    const {color} = this.props
    return (
      <Button
        key={i}
        onClick={this.handleActionClick}
        data-action-index={i}
        disabled={action.disabled}
        inverted={color && (color !== 'default')} // invert buttons for colored dialogs
        kind={action.kind}
        autoFocus={action.autoFocus}
      >
        {action.title}
      </Button>
    )
  }

  render() {
    const {color, title, className, onClose, isOpen, actions} = this.props

    const classNames = [
      styles[color] || styles.default,
      isOpen ? styles.isOpen : styles.isClosed,
      className
    ]
      .filter(Boolean)
      .join(' ')

    const [primary, secondary] = partition(actions, action => !action.secondary || action.primary)

    return (
      <StackedEscapable onEscape={onClose}>
        <Portal>
          <div className={classNames}>
            {onClose && (
              <button className={styles.closeButton} onClick={onClose} type="button">
                <CloseIcon color="inherit" />
              </button>
            )}
            <div className={styles.inner}>
              <h1 className={styles.heading}>{title}</h1>
              <div className={styles.content}>
                {this.props.children}
                <div className={styles.actionsWrapper}>
                  {actions.length > 0 && (
                    <ButtonCollection
                      align="end"
                      secondary={secondary.map(this.createActionButton)}
                    >
                      {primary.map(this.createActionButton)}
                    </ButtonCollection>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Portal>
      </StackedEscapable>
    )
  }
}
