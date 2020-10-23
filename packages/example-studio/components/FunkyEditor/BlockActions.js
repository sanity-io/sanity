import React from 'react'
import PropTypes from 'prop-types'

import styles from './BlockActions.css'

export default class FunkyBlockActions extends React.Component {
  static propTypes = {
    block: PropTypes.shape({
      _key: PropTypes.string,
      _type: PropTypes.string,
    }).isRequired,
    insert: PropTypes.func.isRequired,
  }

  handleClick = (evnt) => {
    const {insert} = this.props
    insert({
      _type: 'block',
      children: [
        {
          _type: 'span',
          text: 'Pong!',
        },
      ],
    })
  }

  render() {
    return (
      <div className={styles.root} onClick={this.handleClick}>
        Ping
      </div>
    )
  }
}
