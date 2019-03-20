import React from 'react'
import PropTypes from 'prop-types'
import styles from './WidgetWrapper.css'

class WidgetWrapper extends React.PureComponent {
  static propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    children: PropTypes.any,
    width: PropTypes.oneOf(['auto', 'small', 'medium', 'large', 'full']),
    height: PropTypes.oneOf(['auto', 'small', 'medium', 'large', 'full'])
  }

  static defaultProps = {
    children: null,
    width: 'auto',
    height: 'auto'
  }

  render() {
    const {width, height, children} = this.props
    return (
      <div className={styles.root} data-width={width} data-height={height}>
        {children}
      </div>
    )
  }
}

export default WidgetWrapper
