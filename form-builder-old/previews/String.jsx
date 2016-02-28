import React from 'react'

export default React.createClass({

  displayName: 'StringPreview',

  propTypes: {
    value: React.PropTypes.string
  },

  render() {
    return (
      <div className="form-builder__field-preview form-builder__field-preview--reference">
        {this.props.value}
      </div>
    )
  }

})
