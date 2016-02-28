// This file is only temporary. ImageTool should only emit one onChange event always and this should be fixed in
// ImageTool

import ImageTool from '@sanity/imagetool'
import React from 'react'

function add(o1, o2) {
  return Object.keys(o1).reduce((res, key) => {
    res[key] = o1[key] + (o2[key] || 0)
    return res
  }, {})
}

const DEFAULT_CROP = {left: 0, top: 0, right: 0, bottom: 0}
const DEFAULT_HOTSPOT = {x: 0.5, y: 0.5, height: 1, width: 1}

export default React.createClass({ // todo: automatic constraining should be built into ImageTool
  displayName: 'ImageToolWrapper',
  propTypes: {
    value: React.PropTypes.shape({
      crop: React.PropTypes.shape({
        top: React.PropTypes.number,
        left: React.PropTypes.number,
        bottom: React.PropTypes.number,
        right: React.PropTypes.number
      }),
      hotspot: React.PropTypes.shape({
        x: React.PropTypes.number,
        y: React.PropTypes.number,
        height: React.PropTypes.number,
        width: React.PropTypes.number
      })
    }),
    onChange: React.PropTypes.func.isRequired,
    imageUrl: React.PropTypes.string.isRequired
  },

  getDefaultProps() {
    return {value: {}}
  },

  handleImageToolMove(ev) {
    const value = this.props.value
    const newHotspot = Object.assign({}, add(value.hotspot || DEFAULT_HOTSPOT, ev))
    this.props.onChange(Object.assign({}, value, {hotspot: newHotspot}))
  },

  handleImageToolResize(ev) {
    const value = this.props.value
    const newHotspot = Object.assign({}, add(value.hotspot || DEFAULT_HOTSPOT, ev))
    this.props.onChange(Object.assign({}, value, {hotspot: newHotspot}))
  },

  handleImageToolCrop(ev) {
    const value = this.props.value
    const newCrop = Object.assign({}, add(value.crop || DEFAULT_CROP, ev))
    this.props.onChange(Object.assign({}, value, {crop: newCrop}))
  },

  render() {
    const {onChange, imageUrl, value, ...rest} = this.props
    // Enable when https://github.com/eslint/eslint/issues/3271 is resolved
    /* eslint-disable no-undef */
    return (
      <ImageTool
        onCrop={this.handleImageToolCrop}
        onMove={this.handleImageToolMove}
        onResize={this.handleImageToolResize}
        imageUrl={imageUrl}
        value={value}
        onChange={onChange}
        {...rest}
      />
    )
    /* eslint-enable no-undef */
  }
})
