import React, {PropTypes} from 'react'
import Ink from 'react-ink'
import styles from 'part:@sanity/components/buttons/default-style'
import Spinner from 'part:@sanity/components/loading/spinner'

export default class DefaultButton extends React.Component {
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
    tabIndex: PropTypes.number
  }

  static defaultProps = {
    ripple: true,
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
    this.timeOut = setTimeout(() => {
      this.setState({
        recentlyHovered: true
      })
    }, 300)
  }

  render() {

    const {kind, ripple, disabled, inverted, color, icon, loading, className, children, ...rest} = this.props

    const Icon = icon

    const style = `
      ${(inverted ? styles.inverted : '')}
      ${kind ? styles[kind] : styles.default}
      ${color ? styles[`color__${color}`] : ''}
      ${Icon ? styles.hasIcon : ''}
      ${className || ''}
      ${disabled ? styles.disabled : ''}
      ${this.state.recentlyHovered ? styles.recentlyHovered : styles.notRecentlyHovered}`

    return (
      <button
        {...rest}
        className={style}
        type="button"
        onClick={this.handleClick}
        disabled={disabled}
      >
        <div className={styles.inner}>
          {
            loading && <Spinner />
          }
          {
            Icon && <span className={styles.iconContainer}><Icon className={styles.icon} /></span>
          }
          {
            children && <span className={styles.content}>{children}</span>
          }
          {
            ripple && !disabled && <Ink duration={200} opacity={0.10} radius={200} />
          }
        </div>
      </button>
    )
  }
}
