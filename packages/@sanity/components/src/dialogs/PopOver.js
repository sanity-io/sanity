import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/dialogs/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import CloseIcon from 'part:@sanity/base/close-icon'
import {Portal} from 'react-portal'
import Stacked from '../utilities/Stacked'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'
import {Manager, Target, Popper, Arrow} from 'react-popper'

export default class EditItemPopOver extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    onClickOutside: PropTypes.func,
    onAction: PropTypes.func,
    modifiers: PropTypes.object,
    color: PropTypes.oneOf(['default', 'danger']),
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        kind: PropTypes.string,
        title: PropTypes.string,
        key: PropTypes.string
      })
    )
  }

  static defaultProps = {
    title: undefined,
    onAction() {},
    actions: [],
    color: 'default',
    modifiers: {
      flip: {
        boundariesElement: 'viewport'
      },
      preventOverflow: {
        boundariesElement: 'viewport'
      }
    }
  }

  renderPopper(isActive) {
    const {title, color, children, actions, onClose, modifiers} = this.props
    return (
      <Popper
        className={`${styles.popper} ${styles[`color_${color}`]}`}
        placement="auto"
        modifiers={modifiers}
      >
        <Arrow className={title ? styles.filledArrow : styles.arrow} />
        <Escapable onEscape={event => (isActive || event.shiftKey) && onClose()} />
        <CaptureOutsideClicks onClickOutside={isActive ? onClose : undefined}>
          <div className={styles.popover}>
            {onClose && (
              <button
                className={title ? styles.closeInverted : styles.close}
                type="button"
                onClick={onClose}
              >
                <CloseIcon />
              </button>
            )}
            {title && <h3 className={styles.title}>{title}</h3>}
            <div className={actions.length > 0 ? styles.contentWithActions : styles.content}>
              {children}
            </div>
            {actions.length > 0 && (
              <div className={styles.footer}>
                <div className={styles.actions}>
                  {actions.map((action, i) => {
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
                  })}
                </div>
              </div>
            )}
          </div>
        </CaptureOutsideClicks>
      </Popper>
    )
  }

  render() {
    return (
      <Manager>
        <Target className={styles.target} />
        <Portal>
          <Stacked>
            {isActive => (
              <div>
                <div className={styles.overlay} />
                {this.renderPopper(isActive)}
              </div>
            )}
          </Stacked>
        </Portal>
      </Manager>
    )
  }
}
