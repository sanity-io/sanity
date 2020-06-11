import classNames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/dialogs/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import CloseIcon from 'part:@sanity/base/close-icon'
import {Manager, Reference, Popper} from 'react-popper'
import {partition} from 'lodash'
import {Portal} from '../utilities/Portal'
import Stacked from '../utilities/Stacked'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'

// @todo: Rename to `Popover`
export default class PopOver extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    onClickOutside: PropTypes.func,
    onEscape: PropTypes.func,
    onAction: PropTypes.func,
    modifiers: PropTypes.object,
    placement: PropTypes.string,
    useOverlay: PropTypes.bool,
    hasAnimation: PropTypes.bool,
    color: PropTypes.oneOf(['default', 'danger']),
    padding: PropTypes.oneOf(['none', 'small', 'medium', 'large']),
    referenceElement: PropTypes.instanceOf(Element),
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
    placement: 'auto',
    useOverlay: true,
    hasAnimation: false,
    modifiers: {
      preventOverflow: {
        boundariesElement: 'viewport',
        padding: 16
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
        inverted={action.inverted}
      >
        {action.title}
      </Button>
    )
  }

  render() {
    const {useOverlay, hasAnimation, referenceElement} = this.props
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

    // Undefined referenceElement causes Popper to think it is defined
    const popperPropHack = {}
    if (referenceElement) {
      popperPropHack.referenceElement = referenceElement
    }

    return (
      <Manager>
        {!referenceElement && (
          <Reference>{({ref}) => <div ref={ref} className={styles.target} />}</Reference>
        )}
        <Portal>
          <Stacked>
            {isActive => (
              <div>
                {useOverlay && <div className={styles.overlay} />}
                <Popper placement={this.props.placement} modifiers={modifiers} {...popperPropHack}>
                  {({ref, style, placement, arrowProps}) => (
                    <div
                      ref={ref}
                      style={style}
                      data-placement={placement}
                      className={classNames(
                        styles.root,
                        styles[`color_${color}`],
                        styles[`padding_${padding}`]
                      )}
                    >
                      <div className={classNames(hasAnimation && styles.popperAnimation)}>
                        <div
                          className={title ? styles.filledArrow : styles.arrow}
                          ref={arrowProps.ref}
                          style={arrowProps.style}
                        />
                        <div
                          className={styles.arrowShadow}
                          ref={arrowProps.ref}
                          style={arrowProps.style}
                        />
                        <Escapable
                          onEscape={event =>
                            (isActive || event.shiftKey) && onEscape && onEscape(event)
                          }
                        />
                        <CaptureOutsideClicks
                          onClickOutside={isActive ? onClickOutside : undefined}
                          className={styles.popover}
                        >
                          {title && (
                            <div className={styles.header}>
                              <div className={styles.title}>
                                <h3>{title}</h3>
                              </div>
                              {onClose && (
                                <div className={styles.closeButtonContainer}>
                                  <Button
                                    className={styles.closeButton}
                                    icon={CloseIcon}
                                    kind="simple"
                                    onClick={onClose}
                                    padding="small"
                                    title="Close"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          {!title && onClose && (
                            <div className={styles.floatingCloseButtonContainer}>
                              <Button
                                icon={CloseIcon}
                                kind="simple"
                                onClick={onClose}
                                padding="small"
                                title="Close"
                              />
                            </div>
                          )}
                          <div className={styles.content}>{children}</div>
                          {actions.length > 0 && (
                            <div className={styles.footer}>
                              <ButtonGrid
                                align="end"
                                secondary={primary.map(this.createActionButton)}
                              >
                                {secondary.map(this.createActionButton)}
                              </ButtonGrid>
                            </div>
                          )}
                        </CaptureOutsideClicks>
                      </div>
                    </div>
                  )}
                </Popper>
              </div>
            )}
          </Stacked>
        </Portal>
      </Manager>
    )
  }
}
