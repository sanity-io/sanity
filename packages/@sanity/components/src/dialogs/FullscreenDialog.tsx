import classNames from 'classnames'
import {partition} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import styles from 'part:@sanity/components/dialogs/fullscreen-style'
import {Portal} from 'part:@sanity/components/portal'
import React from 'react'
import StackedEscapable from '../utilities/StackedEscapable'
import {DialogAction} from './types'

interface FullScreenDialogProps {
  cardClassName?: string
  className?: string
  title?: React.ReactNode
  children?: React.ReactNode
  onClose?: () => void
  onEscape?: () => void
  isOpen?: boolean
  onAction?: (action: DialogAction) => void
  actions?: DialogAction[]

  // deprecated
  color?: 'default' | 'warning' | 'info' | 'success' | 'danger'
  padding?: 'none' | 'small' | 'medium' | 'large'
}

const noop = () => undefined

// @todo: refactor to functional component
export default class FullScreenDialog extends React.PureComponent<FullScreenDialogProps> {
  createButtonFromAction = (action: DialogAction, i: number) => {
    const {onAction} = this.props

    return (
      <Button
        key={i}
        onClick={() => onAction && onAction(action)}
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

  renderActions = (actions: DialogAction[]) => {
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
    const {title, cardClassName, className, onClose, onEscape, isOpen = true, actions} = this.props

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
