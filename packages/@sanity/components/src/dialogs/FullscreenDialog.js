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
    padding: PropTypes.oneOf(['none', 'small', 'medium', 'large']),
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
    padding: 'large',
    onAction() {},
    onClose() {},
    actions: []
  }

  createButtonFromAction = (action, i) => {
    return (
      <Button
        key={i}
        onClick={() => this.props.onAction(action)}
        data-action-index={i}
        color={action.color}
        disabled={action.disabled}
        kind={action.kind}
        autoFocus={action.autoFocus}
        className={action.secondary ? styles.actionSecondary : ''}
      >
        {action.title}
      </Button>
    )
  }

  renderActions = actions => {
    if (!actions || actions.length === 0) {
      return null
    }

    const [secondary, primary] = partition(actions, action => action.secondary)

    return (
      <ButtonCollection align="end" secondary={secondary.map(this.createButtonFromAction)}>
        {primary.map(this.createButtonFromAction)}
      </ButtonCollection>
    )
  }

  render() {
    const {color, title, className, onClose, isOpen, actions, padding} = this.props

    const classNames = [
      styles[color] || styles.default,
      isOpen ? styles.isOpen : styles.isClosed,
      className
    ]
      .filter(Boolean)
      .join(' ')

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
              <div className={styles[`padding_${padding}`]}>
                <h1 className={styles.heading}>{title}</h1>
                <div className={styles.content}>
                  {this.props.children}
                  <div className={styles.actionsWrapper}>{this.renderActions(actions)}</div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      </StackedEscapable>
    )
  }
}
