import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/dialogs/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import ButtonCollection from 'part:@sanity/components/buttons/button-collection'
import CloseIcon from 'part:@sanity/base/close-icon'
import {Manager, Target, Popper, Arrow} from 'react-popper'
import {partition} from 'lodash'
import {Portal} from '../utilities/Portal'
import Stacked from '../utilities/Stacked'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'

export default class PopOver extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    onClickOutside: PropTypes.func,
    onEscape: PropTypes.func,
    onAction: PropTypes.func,
    modifiers: PropTypes.object,
    useOverlay: PropTypes.bool,
    color: PropTypes.oneOf(['default', 'danger']),
    padding: PropTypes.oneOf(['none', 'small', 'medium', 'large']),
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
    padding: 'medium',
    modifiers: {
      flip: {
        boundariesElement: 'viewport'
      },
      preventOverflow: {
        boundariesElement: 'viewport'
      }
    }
  }

  createActionButton = (action, i) => {
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

  renderPopper(isActive) {
    const {
      title,
      color,
      children,
      actions,
      onClose,
      onClickOutside,
      onEscape,
      modifiers,
      padding
    } = this.props

    const [primary, secondary] = partition(actions, action => action.primary)
    return (
      <Popper
        className={`${styles.popper} ${styles[`color_${color}`]}`}
        placement="auto"
        modifiers={modifiers}
      >
        <Arrow className={title ? styles.filledArrow : styles.arrow} />
        <Escapable onEscape={event => (isActive || event.shiftKey) && onEscape && onEscape()} />
        <CaptureOutsideClicks onClickOutside={isActive ? onClickOutside : undefined}>
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
            <div
              className={`
              ${actions.length > 0 ? styles.contentWithActions : styles.content}
              ${styles[`padding_${padding}`]}
            `}
            >
              {children}
            </div>
            {actions.length > 0 && (
              <div className={styles.footer}>
                <ButtonCollection align="end" secondary={primary.map(this.createActionButton)}>
                  {secondary.map(this.createActionButton)}
                </ButtonCollection>
              </div>
            )}
          </div>
        </CaptureOutsideClicks>
      </Popper>
    )
  }

  render() {
    const {useOverlay} = this.props
    return (
      <Manager>
        <Target className={styles.target} />
        <Portal>
          <Stacked>
            {isActive => (
              <div>
                {useOverlay && <div className={styles.overlay} />}
                {this.renderPopper(isActive)}
              </div>
            )}
          </Stacked>
        </Portal>
      </Manager>
    )
  }
}
