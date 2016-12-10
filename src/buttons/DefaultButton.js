import React, {PropTypes} from 'react'
import Ink from 'react-ink'
import styles from 'part:@sanity/components/buttons/default-style'
import Spinner from 'part:@sanity/components/loading/spinner'

export default class DefaultButton extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(Object.keys(styles)),
    color: PropTypes.oneOf(['primary', 'success', 'danger']),
    onClick: PropTypes.func,
    children: PropTypes.node,
    inverted: PropTypes.bool,
    icon: PropTypes.func,
    loading: PropTypes.bool,
    ripple: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool
  }

  static defaultProps = {
    ripple: true,
    icon: null,
    onClick() {}
  }

  constructor(...args) {
    super(...args)

    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(event) {
    this.props.onClick(event)
  }

  render() {

    const {kind, ripple, disabled, inverted, color, icon, loading, className, children, ...rest} = this.props

    const Icon = icon

    const style = `
      ${styles[kind] || (inverted && styles.inverted) || styles.default}
      ${color && styles[`color__${color}`]}
      ${Icon && styles.hasIcon}
      ${className}
      ${disabled && styles.disabled}
    `

    return (
      <button
        {...rest}
        className={style}
        type="button"
        onClick={this.handleClick}
        disabled={disabled}
      >
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
      </button>
    )
  }
}
