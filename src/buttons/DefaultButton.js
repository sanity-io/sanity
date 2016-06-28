import React, {PropTypes} from 'react'
import Ink from 'react-ink'
import styles from 'style:@sanity/base/theme/buttons/default'
import Spinner from 'component:@sanity/components/loading/spinner'

export default class DefaultButton extends React.Component {
  static propTypes = {
    kind: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.node.isRequired(),
    inverted: PropTypes.bool,
    icon: PropTypes.node,
    loading: PropTypes.bool,
    ripple: PropTypes.bool,
    color: PropTypes.string // success, warning, danger, info
  }

  handleOnClick() {
    this.props.onClick()
  }

  render() {
    const {kind, inverted, color, ripple, icon, loading} = this.props

    if (!styles[kind] && kind) {
      console.error(`There is no ${kind} button`) // eslint-disable-line no-console
    }

    const style = `${styles[kind] || styles.root} ${inverted && styles.inverted} ${color}`

    return (
      <button
        className={style}
        type="button"
        onClick={this.handleOnClick}
      >
        {
          loading && <Spinner />
        }
        {
          icon && <span className={styles.icon}>{icon}</span>
        }
        <span className={styles.content}>
          {this.props.children}
        </span>

        {
          ripple && <span className={styles.ripple}><Ink /></span>
        }
      </button>
    )
  }
}
