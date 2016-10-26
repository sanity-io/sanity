import React, {PropTypes} from 'react'
import styles from './styles/Toolbar.css'

export default class Toolbar extends React.Component {

  static propTypes = {
    children: PropTypes.node
  }

  render() {

    return (
      <div className={styles.root}>
        {this.props.children}
      </div>
    )
  }
}
