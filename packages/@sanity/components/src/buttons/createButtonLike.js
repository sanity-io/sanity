/*eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import Ink from 'react-ink'
import styles from 'part:@sanity/components/buttons/default-style'
import Spinner from 'part:@sanity/components/loading/spinner'
import cx from 'classnames'

export default function createButtonLike(Component, {displayName, defaultProps = {}}) {
  return class ButtonLike extends React.Component {
    static displayName =
      displayName ||
      `ButtonLike(${
        typeof Component === 'string' ? Component : Component.displayName || Component.name
      })`

    static propTypes = {
      kind: PropTypes.oneOf(['default', 'simple']),
      color: PropTypes.oneOf(['primary', 'success', 'danger', 'white']),
      onClick: PropTypes.func,
      children: PropTypes.node,
      inverted: PropTypes.bool,
      icon: PropTypes.func,
      loading: PropTypes.bool,
      ripple: PropTypes.bool,
      className: PropTypes.string,
      disabled: PropTypes.bool,
      tabIndex: PropTypes.number,
      padding: PropTypes.oneOf(['default', 'small'])
    }

    static defaultProps = {
      ripple: true,
      icon: null,
      onClick() {},
      kind: 'default',
      padding: 'default',
      ...defaultProps
    }

    state = {
      focusSetFromOutside: null
    }

    focus() {
      if (this._element.focus) {
        this.setState({
          focusSetFromOutside: true
        })
        this._element.focus()
      }
    }

    setRootElement = el => {
      this._element = el
    }

    handleBlur = event => {
      this.setState({
        triggeredFocus: undefined
      })
      // eslint-disable-next-line react/prop-types
      if (this.props.onBlur) {
        this.props.onBlur(event)
      }
    }

    handleInnerBlur = event => {
      this.setState({
        focusSetFromOutside: undefined
      })
    }

    render() {
      const {
        kind,
        ripple,
        inverted,
        color,
        icon: Icon,
        loading,
        className,
        children,
        padding,
        ...rest
      } = this.props

      // Should not be part of the destructing, cause it should be passed to component through rest
      const disabled = this.props.disabled

      const style = cx(className, [
        styles.root,
        styles[kind],
        styles[`padding_${padding}`],
        inverted && styles.inverted,
        color && styles[`color__${color}`],
        disabled && styles.disabled,
        !children && styles.onlyIcon
      ])

      return (
        <Component
          {...rest}
          className={style}
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
              {Icon && <Icon className={styles.icon} />}
              {children && <span className={styles.content}>{children}</span>}
              {ripple && !disabled && <Ink duration={1000} opacity={0.1} radius={200} />}
            </span>
          </span>
        </Component>
      )
    }
  }
}
