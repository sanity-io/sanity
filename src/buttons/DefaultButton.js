import React, {PropTypes} from 'react'
import Ink from 'react-ink'
import styles from 'style:@sanity/components/buttons/default'
import Spinner from 'component:@sanity/components/loading/spinner'

export default class DefaultButton extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['add', 'danger', 'colored']),
    onClick: PropTypes.func,
    children: PropTypes.node.isRequired,
    inverted: PropTypes.bool,
    icon: PropTypes.node,
    loading: PropTypes.bool,
    ripple: PropTypes.bool,
    colored: PropTypes.bool,
    className: PropTypes.string
  }

  static defaultProps = {
    ripple: true,
    icon: false
  }

  handleOnClick() {
    this.props.onClick()
  }

  render() {

    const {kind, inverted, color, colored, ripple, icon, loading, className} = this.props

    const Icon = icon

    if (!styles[kind] && kind) {
      console.error(`There is no ${kind} button`) // eslint-disable-line no-console
    }

    const style = `
      ${className}
      ${styles[kind] || styles.root}
      ${colored && styles.colored}
      ${inverted && styles.inverted}
      ${Icon && styles.hasIcon}
      ${color}
    `

    return (
      <button
        {...this.props}
        className={style}
        type="button"
        onClick={this.props.onClick}
      >
        {
          loading && <Spinner />
        }
        {
          Icon && <span className={styles.iconContainer}><Icon className={styles.icon} /></span>
        }
        <span className={styles.content}>
          {this.props.children}
        </span>

        {
          ripple && <Ink duration={200} opacity={0.10} radius={200} />
        }
      </button>
    )
  }
}
