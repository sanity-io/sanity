import React, {PropTypes} from 'react'
import equals from 'shallow-equals'

class PaneItem extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  render() {
    const {children} = this.props

    return (
      <li className={styles.paneItem}>
        {children}
      </li>
    )
  }
}

PaneItem.propTypes = {
  children: PropTypes.string,
  className: PropTypes.string
}

export default PaneItem
