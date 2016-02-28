import React from 'react'

export default React.createClass({

  displayName: 'LatLonPreview',

  propTypes: {
    value: React.PropTypes.shape({
      lat: React.PropTypes.float,
      lon: React.PropTypes.float
    }),
    zoom: React.PropTypes.number,
    width: React.PropTypes.number,
    height: React.PropTypes.number
  },

  getDefaultProps() {
    return {
      zoom: 13,
      width: 500,
      height: 150
    }
  },

  render() {
    const value = this.props.value
    const loc = `${value.lat},${value.lon}` //eslint-disable-line comma-spacing
    const mapURL = `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${loc}&markers=${loc}&zoom=${this.props.zoom}` +
      `&size=${this.props.width}x${this.props.height}`
    return (
      <div className='form-builder__field-preview form-builder__field-preview--latlon'>
        <img src={mapURL}/>
      </div>
    )
  }

})
