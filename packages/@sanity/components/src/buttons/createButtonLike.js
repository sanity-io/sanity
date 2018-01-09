import PropTypes from 'prop-types'
import React from 'react'
import Ink from 'react-ink'
import styles from 'part:@sanity/components/buttons/default-style'
import Spinner from 'part:@sanity/components/loading/spinner'
import cx from 'classnames'

export default function createButtonLike(Component, {displayName, defaultProps = {}}) {
  return class ButtonLike extends React.Component {
    static displayName = displayName || `ButtonLike(${typeof Component === 'string' ? Component : (Component.displayName || Component.name)})`

    static propTypes = {
      kind: PropTypes.oneOf(['default', 'simple', 'secondary']),
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
    }

    static defaultProps = {
      ripple: true,
      icon: null,
      onClick() {},
      kind: 'default',
      ...defaultProps
    }

    state = {
      recentlyHovered: false
    }

    componentWillUnmount() {
      clearTimeout(this.timeOut)
    }

    focus() {
      if (this._element.focus) {
        this._element.focus()
      }
    }

    setRootElement = el => {
      this._element = el
    }

    handleClick = event => {
      this.setState({
        recentlyHovered: true
      })

      this.props.onClick(event)

      clearTimeout(this.timeOut)
      this.timeOut = setTimeout(() => {
        this.setState({recentlyHovered: true})
      }, 300)
    }

    render() {

      const {kind, ripple, inverted, color, icon: Icon, loading, className, children, ...rest} = this.props

      // Should not be part of the destructing, cause it should be passed to component through rest
      const disabled = this.props.disabled

      const {recentlyHovered} = this.state

      const style = cx(className, [
        styles[kind],
        inverted && styles.inverted,
        color && styles[`color__${color}`],
        disabled && styles.disabled,
        recentlyHovered && styles.recentlyHovered,
        !children && styles.onlyIcon
      ])

      return (
        <Component
          {...rest}
          className={style}
          onClick={this.handleClick}
          ref={this.setRootElement}
        >
          <div className={styles.inner}>
            {loading && <span className={styles.spinner}><Spinner inline /></span>}
            {Icon && <Icon className={styles.icon} />}
            {children && <span className={styles.content}>{children}</span>}
            {ripple && !disabled && <Ink duration={200} opacity={0.10} radius={200} />}
          </div>
        </Component>
      )
    }
  }
}
