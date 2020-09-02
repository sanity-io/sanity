/* eslint-disable complexity */

import classNames from 'classnames'
import styles from 'part:@sanity/components/buttons/default-style'
import Spinner from 'part:@sanity/components/loading/spinner'
import PropTypes from 'prop-types'
import React from 'react'

export default function createButtonLike(Component, {displayName, defaultProps = {}}) {
  return class ButtonLike extends React.Component {
    static displayName =
      displayName ||
      `ButtonLike(${
        typeof Component === 'string' ? Component : Component.displayName || Component.name
      })`

    static propTypes = {
      kind: PropTypes.oneOf(['simple', 'secondary']),
      color: PropTypes.oneOf(['primary', 'success', 'danger', 'white', 'warning']),
      onBlur: PropTypes.func,
      onClick: PropTypes.func,
      children: PropTypes.node,
      inverted: PropTypes.bool,
      icon: PropTypes.func,
      loading: PropTypes.bool,
      className: PropTypes.string,
      disabled: PropTypes.bool,
      tabIndex: PropTypes.number,
      padding: PropTypes.oneOf(['large', 'default', 'small', 'none']),
      bleed: PropTypes.bool,
      selected: PropTypes.bool,
      size: PropTypes.oneOf(['extra-small', 'small', 'medium', 'large', 'extra-large'])
    }

    static defaultProps = {
      icon: null,
      onClick() {},
      kind: undefined,
      bleed: false,
      padding: 'default',
      selected: false,
      ...defaultProps
    }

    state = {
      focusSetFromOutside: null
    }

    focus() {
      if (this._element.focus) {
        this.setState({focusSetFromOutside: true})
        this._element.focus()
      }
    }

    setRootElement = el => {
      this._element = el
    }

    handleBlur = event => {
      this.setState({triggeredFocus: undefined})

      // eslint-disable-next-line react/prop-types
      if (this.props.onBlur) {
        this.props.onBlur(event)
      }
    }

    handleInnerBlur = () => {
      this.setState({focusSetFromOutside: undefined})
    }

    render() {
      const {
        kind,
        inverted,
        color,
        icon: Icon,
        loading,
        className,
        children,
        disabled,
        padding,
        bleed,
        selected,
        size,
        ...rest
      } = this.props

      const style = classNames(className, [
        styles.root,
        styles[kind],
        styles[`padding_${padding}`],
        inverted && styles.inverted,
        styles[`color__${color}`],
        styles[`size__${size}`],
        bleed && styles.bleed,
        disabled && styles.disabled,
        selected && styles.selected,
        loading && styles.loading
      ])

      return (
        <Component
          {...rest}
          className={style}
          disabled={disabled || loading}
          ref={this.setRootElement}
          tabIndex={0}
          onBlur={this.handleBlur}
        >
          {/*
            To avoid visually annoying "tab-focus-styling" when clicking,
            we catch the focus styling with tabIndex -1.
            However, to avoid onBlur being called on an focused button (when focues from outside),
            we need to check that the focus is not set from outside. (with .focus() )
          */}
          <span
            className={styles.inner}
            tabIndex={this.state.focusSetFromOutside ? undefined : -1}
            onBlur={this.handleInnerBlur}
          >
            <span className={styles.content}>
              {loading && (
                <span className={styles.spinner}>
                  <Spinner inline />
                </span>
              )}
              {Icon && (
                <div className={styles.icon}>
                  <Icon />
                </div>
              )}
              {children && <span className={styles.text}>{children}</span>}
            </span>
          </span>
        </Component>
      )
    }
  }
}
