import React from 'react'
import cx from 'classnames'

export default React.createClass({
  displayName: 'ProgressBar',
  propTypes: {
    percent: React.PropTypes.number
  },
  getDefaultProps() {
    return {percent: 0}
  },
  render() {
    const {percent} = this.props
    return (
      <div className={cx({progressbar: true, 'progressbar--completed': percent === 100})}>
        <div className="progressbar__bar" style={{width: percent + '%'}}></div>
      </div>
    )
  }
})
