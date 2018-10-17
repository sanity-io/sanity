import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import styles from './styles/Hotkeys.css'

export default class Hotkeys extends React.PureComponent {
  static propTypes = {
    keys: PropTypes.arrayOf(PropTypes.string)
  }

  render() {
    const {keys} = this.props

    if (!keys || keys.length === 0) {
      return <span />
    }

    return (
      <span className={styles.root}>
        {keys.map((key, i) => {
          return (
            <Fragment key={key}>
              <span className={styles.key}>{key}</span>
              {i < keys.length - 1 && <span className={styles.seperator}>+</span>}
            </Fragment>
          )
        })}
      </span>
    )
  }
}
