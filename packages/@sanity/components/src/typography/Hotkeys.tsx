import React from 'react'
import styles from './Hotkeys.css'

interface HotkeysProps {
  size?: 'small' | 'medium' | 'large'
  keys?: string[]
}

export default class Hotkeys extends React.PureComponent<HotkeysProps> {
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
