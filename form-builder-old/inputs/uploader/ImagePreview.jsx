
import React from 'react'

export default React.createClass({
  displayName: 'ImagePreview',
  render() {
    return (<img {...this.props} height="25"/>)
  }
})
