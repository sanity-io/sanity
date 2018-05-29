import PropTypes from 'prop-types'
import React from 'react'
import WithVisibility from './WithVisibility'
import ObserveForPreview from './ObserveForPreview'

const HIDE_DELAY = 20 * 1000

export default class PreviewSubscriber extends React.Component {
  static propTypes = {
    type: PropTypes.object.isRequired,
    fields: PropTypes.arrayOf(PropTypes.oneOf(['title', 'description', 'imageUrl'])),
    value: PropTypes.any.isRequired,
    ordering: PropTypes.object,
    children: PropTypes.func
  }

  renderChild = isVisible => {
    const {children, type, value, ordering, ...props} = this.props
    if (!isVisible) {
      return children({...props, snapshot: null, isLive: false, type, ordering})
    }
    return (
      <ObserveForPreview type={type} value={value} ordering={ordering}>
        {({result, error}) =>
          children({...props, snapshot: result.snapshot, isLive: true, error, type, ordering})
        }
      </ObserveForPreview>
    )
  }

  render() {
    return <WithVisibility hideDelay={HIDE_DELAY}>{this.renderChild}</WithVisibility>
  }
}
