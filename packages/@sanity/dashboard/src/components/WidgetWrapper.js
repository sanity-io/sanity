import React from 'react'
import PropTypes from 'prop-types'
import styles from './WidgetWrapper.css'

class WidgetWrapper extends React.PureComponent {
  static propTypes = {
    width: PropTypes.oneOf(['auto', 'small', 'medium', 'large', 'full']),
    height: PropTypes.oneOf(['auto', 'small', 'medium', 'large', 'full']),
    style: PropTypes.object
  }

  static defaultProps = {
    width: 'auto',
    height: 'auto',
    style: {}
  }

  render() {
    const {width, height, style, children} = this.props
    return (
      <div className={styles.root} data-width={width} data-height={height} style={style}>
        {children}
      </div>
    )
  }
}

export default WidgetWrapper
