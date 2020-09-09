import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/Hotkeys.css'

export default class Hotkeys extends React.PureComponent {
  static propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    keys: PropTypes.arrayOf(PropTypes.string)
  }

  static defaultProps = {
    size: undefined
  }

  render() {
    const {keys, size} = this.props

    if (!keys || keys.length === 0) {
      return <span />
    }

    return (
      <span className={styles.root} data-size={size}>
        {keys.map((key, i) => (
          <span className={styles.key} key={i}>
            {key}
          </span>
        ))}
      </span>
    )
  }
}
