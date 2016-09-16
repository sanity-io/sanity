import React, {PropTypes} from 'react'
// import Ink from 'react-ink'
import styles from 'style:@sanity/components/buttons/fab'

export default class Fab extends React.Component {
  static propTypes = {
    onClick: PropTypes.func,
    inverted: PropTypes.bool,
    loading: PropTypes.bool,
    ripple: PropTypes.bool,
    colored: PropTypes.bool,
    fixed: PropTypes.bool,
    color: PropTypes.string // success, warning, danger, info
  }

  static defaultProps = {
    fixed: true,
    ripple: true
  }

  render() {
    const {ripple, onClick, colored, fixed} = this.props

    const style = `${colored ? styles.colored : styles.root} ${fixed ? styles.fixed : ''}`

    return (
      <button
        className={style}
        type="button"
        onClick={onClick}
      >
        <span className={styles.content}>+</span>
        {
          // ripple && <span className={styles.ripple}><Ink /></span>
        }
      </button>
    )
  }
}
