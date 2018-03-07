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

export default class EditItemPopOver extends React.Component {

  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    onClickOutside: PropTypes.func,
    onAction: PropTypes.func,
    modifiers: PropTypes.object,
    color: PropTypes.oneOf(['default', 'danger']),
    actions: PropTypes.arrayOf(PropTypes.shape({
      kind: PropTypes.string,
      title: PropTypes.string,
      key: PropTypes.string
    }))
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

  setTargetRef = element => {
    this.target = element
    return element
  }

  setPopperRef = element => {
    this.popper = element
    return element
  }

  render() {
    const {
      title,
      color,
      children,
      actions,
      onClose,
      modifiers,
      onClickOutside
    } = this.props

    return (
      <Stacked>
        {isActive => (
          <div>
            <Escapable onEscape={event => ((isActive || event.shiftKey) && onClose())} />
            <Manager>
              <Target className={styles.target} innerRef={this.setTargetRef} />
              <Portal>
                <div className={styles.overlay} />
                <Popper
                  innerRef={this.setPopperRef}
                  className={`${styles.popper} ${styles[`color_${color}`]}`}
                  placement="auto"
                  modifiers={modifiers}
                >
                  <Arrow className={title ? styles.filledArrow : styles.arrow} />
                  <CaptureOutsideClicks onClickOutside={isActive ? onClickOutside || onClose : null}>
                    <div className={styles.popover}>
                      {
                        onClose && (
                          <button className={title ? styles.closeInverted : styles.close} type="button" onClick={onClose}>
                            <CloseIcon />
                          </button>
                        )
                      }
                      {
                        title && (
                          <h3 className={styles.title}>
                            {title}
                          </h3>
                        )
                      }
                      <div className={styles.content}>
                        {children}
                      </div>
                      {
                        actions.length > 0 && (
                          <div className={styles.footer}>
                            <div className={styles.actions}>
                              {
                                actions.map((action, i) => {
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
                                })
                              }
                            </div>
                          </div>
                        )
                      }
                    </div>
                  </CaptureOutsideClicks>
                </Popper>
              </Portal>
            </Manager>
          </div>
        )}
      </Stacked>
    )
  }
}
