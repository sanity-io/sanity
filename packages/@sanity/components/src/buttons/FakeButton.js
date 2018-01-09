import PropTypes from 'prop-types'
import React from 'react'
import Ink from 'react-ink'
import styles from 'part:@sanity/components/buttons/default-style'
import Spinner from 'part:@sanity/components/loading/spinner'

export default class FakeButton extends React.Component {
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
    ripple: false,
    icon: null,
    onClick() {},
    kind: 'default'
  }

  constructor(...args) {
    super(...args)

    this.handleClick = this.handleClick.bind(this)

    this.state = {
      recentlyHovered: false
    }
  }

  handleClick(event) {
    this.setState({
      recentlyHovered: true
    })
    this.props.onClick(event)
    clearTimeout(this.timeOut)
    this.timeOut = setTimeout(() => {
      this.setState({
        recentlyHovered: true
      })
    }, 300)
  }

  componentWillUnmount() {
    clearTimeout(this.timeOut)
  }

  render() {

    const {kind, ripple, disabled, inverted, color, icon, loading, className, children, ...rest} = this.props

    const Icon = icon

    const style = [
      inverted && styles.inverted,
      kind ? styles[kind] : styles.default,
      color && styles[`color__${color}`],
      icon && styles.hasIcon,
      className,
      disabled && styles.disabled,
      this.state.recentlyHovered ? styles.recentlyHovered : styles.notRecentlyHovered
    ].filter(Boolean).join(' ')

    const padContent = (Icon && children && (typeof children === 'string'))

    return (
      <div
        {...rest}
        className={style}
        onClick={this.handleClick}
      >
        <div className={styles.inner}>
          {
            loading && <span className={styles.spinner}><Spinner inline /></span>
          }
          {
            Icon && <Icon className={styles.icon} />
          }
          {
            children && <span className={padContent ? styles.contentWithPad : styles.content}>{children}</span>
          }
          {
            ripple && !disabled && <Ink duration={200} opacity={0.10} radius={200} />
          }
        </div>
      </div>
    )
  }
}
