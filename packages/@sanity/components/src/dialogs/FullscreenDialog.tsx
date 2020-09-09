import classNames from 'classnames'
import {partition} from 'lodash'
import styles from 'part:@sanity/components/dialogs/fullscreen-style'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import {Portal} from 'part:@sanity/components/portal'
import PropTypes from 'prop-types'
import React from 'react'
import StackedEscapable from '../utilities/StackedEscapable'

const noop = () => {}

export default class FullScreenDialog extends React.PureComponent {
  static propTypes = {
    cardClassName: PropTypes.string,
    className: PropTypes.string,
    title: PropTypes.node,
    children: PropTypes.node,
    onClose: PropTypes.func,
    onEscape: PropTypes.func,
    isOpen: PropTypes.bool,
    onAction: PropTypes.func,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        tooltip: PropTypes.string,
        kind: PropTypes.string,
        autoFocus: PropTypes.bool,
        disabled: PropTypes.bool,
        inverted: PropTypes.bool
      })
    ),

    // deprecated
    /* eslint-disable react/no-unused-prop-types */
    color: PropTypes.oneOf(['default', 'warning', 'info', 'success', 'danger']),
    padding: PropTypes.oneOf(['none', 'small', 'medium', 'large'])
    /* eslint-enable react/no-unused-prop-types */
  }

  static defaultProps = {
    cardClassName: undefined,
    isOpen: true,
    onAction() {},
    actions: [],

    // deprecated
    color: 'default',
    padding: 'medium'
  }

  createButtonFromAction = (action, i) => {
    return (
      <Button
        key={i}
        onClick={() => this.props.onAction(action)}
        data-action-index={i}
        color={action.color}
        disabled={action.disabled}
        inverted={action.inverted}
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
      <ButtonGrid align="end" secondary={secondary.map(this.createButtonFromAction)}>
        {primary.map(this.createButtonFromAction)}
      </ButtonGrid>
    )
  }

  // eslint-disable-next-line complexity
  render() {
    const {title, cardClassName, className, onClose, onEscape, isOpen, actions} = this.props

    return (
      <StackedEscapable onEscape={onEscape || onClose || noop}>
        <Portal>
          <section
            className={classNames(styles.root, isOpen ? styles.isOpen : styles.isClosed, className)}
          >
            <div className={classNames(styles.inner, cardClassName)}>
              {(title || onClose) && (
                <header className={styles.header}>
                  {title && <h1 className={styles.title}>{title}</h1>}

                  {onClose && (
                    <div className={styles.actions}>
                      <Button
                        className={styles.closeButton}
                        icon={CloseIcon}
                        kind="simple"
                        onClick={onClose}
                        padding="small"
                      />
                    </div>
                  )}
                </header>
              )}

              {this.props.children && <div className={styles.content}>{this.props.children}</div>}

              {actions && actions.length > 0 && (
                <div className={styles.actionsWrapper}>{this.renderActions(actions)}</div>
              )}
            </div>
          </section>
        </Portal>
      </StackedEscapable>
    )
  }
}
