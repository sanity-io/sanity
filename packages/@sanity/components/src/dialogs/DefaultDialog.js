/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import styles from 'part:@sanity/components/dialogs/default-style'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import {partition, debounce} from 'lodash'
import {Portal} from '../utilities/Portal'
import Escapable from '../utilities/Escapable'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Stacked from '../utilities/Stacked'

const noop = () => {}

export default class DefaultDialog extends React.PureComponent {
  static propTypes = {
    color: PropTypes.oneOf(['default', 'warning', 'success', 'danger', 'info']),
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onEscape: PropTypes.func,
    onClickOutside: PropTypes.func,
    onAction: PropTypes.func,
    showCloseButton: PropTypes.bool,
    actionsAlign: PropTypes.oneOf(['start', 'end']),
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        icon: PropTypes.func,
        tooltip: PropTypes.string,
        kind: PropTypes.string,
        autoFocus: PropTypes.bool
      })
    )
  }

  static defaultProps = {
    showCloseButton: true,
    actionsAlign: 'end',
    onAction() {},
    onOpen() {},
    onClose() {},
    actions: [],
    color: 'default'
  }

  state = {
    contentHasOverflow: false
  }

  componentDidMount() {
    this.setFooterShadow()
    window.addEventListener('resize', this.handleResize, {passive: true})
    if (this.contentElement) {
      this.contentElement.addEventListener('scroll', this.handleScroll, {passive: true})
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize, {passive: true})
    if (this.contentElement) {
      this.contentElement.removeEventListener('scroll', this.handleScroll, {passive: true})
    }
  }

  handleResize = debounce(() => this.setFooterShadow())
  handleScroll = debounce(() => this.setFooterShadowFromScroll(), 10)

  componentDidUpdate() {
    this.setFooterShadow()
  }

  setFooterShadowFromScroll = () => {
    this.setFooterShadow()
  }

  setFooterShadow = () => {
    if (this.contentElement) {
      this.setState({
        contentHasOverflow:
          this.contentElement.scrollHeight >
          this.contentElement.clientHeight + this.contentElement.scrollTop
      })
    }
  }

  openDialogElement() {
    this.props.onOpen()
  }

  handleDialogClick = event => {
    event.stopPropagation()
  }

  setDialogElement = element => {
    this.dialog = element
  }

  setContentElement = element => {
    this.contentElement = element
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
        inverted={action.inverted}
        autoFocus={action.autoFocus}
        icon={action.icon}
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
      <ButtonGrid
        align={this.props.actionsAlign}
        secondary={secondary.map(this.createButtonFromAction)}
      >
        {primary.map(this.createButtonFromAction)}
      </ButtonGrid>
    )
  }

  render() {
    const {
      title,
      actions,
      color,
      onClose,
      onClickOutside,
      onEscape,
      className,
      showCloseButton
    } = this.props
    const {contentHasOverflow} = this.state
    const classNames = `
      ${styles.root}
      ${styles[color]}
      ${actions && actions.length > 0 ? styles.hasFunctions : ''}
      ${className}
    `
    const handleEscape = onEscape || onClose || noop

    return (
      <Portal>
        <Stacked>
          {isActive => (
            <div className={classNames}>
              <div className={styles.overlay} />
              <div className={styles.dialog}>
                <Escapable onEscape={event => (isActive || event.shiftKey) && handleEscape()} />
                <CaptureOutsideClicks
                  onClickOutside={isActive ? onClickOutside : undefined}
                  className={styles.inner}
                >
                  {!title && onClose && showCloseButton && (
                    <button className={styles.closeButtonOutside} onClick={onClose} type="button">
                      <CloseIcon color="inherit" />
                    </button>
                  )}
                  {title && (
                    <div className={styles.header}>
                      <h1 className={styles.title}>{title}</h1>
                      {onClose && showCloseButton && (
                        <button
                          className={styles.closeButton}
                          onClick={onClose}
                          type="button"
                          title="Close"
                        >
                          <div className={styles.closeButtonIcon}>
                            <CloseIcon color="inherit" />
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                  <div
                    ref={this.setContentElement}
                    className={
                      actions && actions.length > 0 ? styles.content : styles.contentWithoutFooter
                    }
                  >
                    {this.props.children}
                  </div>
                  {actions && actions.length > 0 && (
                    <div className={contentHasOverflow ? styles.footerWithShadow : styles.footer}>
                      {this.renderActions(actions)}
                    </div>
                  )}
                </CaptureOutsideClicks>
              </div>
            </div>
          )}
        </Stacked>
      </Portal>
    )
  }
}
