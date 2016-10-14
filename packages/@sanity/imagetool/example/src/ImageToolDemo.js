import React, {PropTypes} from 'react'
import Preview from './Preview'
import ImageSelector from './ImageSelector'
import ImageTool from '../../src'

import IMAGES from './data/testImages'

const PREVIEW_ASPECT_RATIOS = [
  ['None (default)', undefined],
  ['Auto', 'auto'],
  ['Landscape', 16 / 9],
  ['Square', 1],
  ['Wide', 4],
  ['Portrait', 9 / 16]
].map(([title, aspect]) => ({title, aspect}))

export default class ImageToolDemo extends React.PureComponent {

  static propTypes = {
    src: PropTypes.string.isRequired
  }

  state = {
    value: {
      hotspot: {
        x: 0.5,
        y: 0.5,
        height: 0.9,
        width: 0.9
      },
      crop: {
        top: 0.0,
        bottom: 0.0,
        left: 0.0,
        right: 0.0
      }
    }
  }

  handleHotspotChange = event => {
    const target = event.currentTarget
    const property = target.getAttribute('data-property')
    const {value} = this.state
    const newHotspot = Object.assign(value.hotspot, {
      [property]: Number(target.value)
    })
    this.setState({value: Object.assign({}, value, {hotspot: newHotspot})})
  }

  handleCropChange = event => {
    const target = event.currentTarget
    const property = target.getAttribute('data-property')
    const {value} = this.state
    const newCrop = Object.assign(value.crop, {
      [property]: Number(target.value)
    })
    this.setState({value: Object.assign({}, value, {crop: newCrop})})
  }

  handleChange = newValue => {
    this.setState({value: newValue})
  }

  renderPreview = aspectRatio => {
    const {value} = this.state
    const {src} = this.props
    const previewStyle = aspectRatio.aspect === 'auto' ? {height: 150, width: 200, display: 'inline-block'} : {}
    return (
      <div>
        <h3>{aspectRatio.title}</h3>
        <div style={{...previewStyle, outline: '1px solid #eee'}}>
          <Preview src={src} aspectRatio={aspectRatio.aspect} hotspot={value.hotspot} crop={value.crop} />
        </div>
      </div>
    )
  }

  render() {
    const value = this.state.value
    const {src} = this.props
    const HOTSPOT_WIDTH = 400
    const thumbWidth = (HOTSPOT_WIDTH - (IMAGES.length * 4)) / IMAGES.length
    return (
      <div style={{width: '100%', margin: 15, clear: 'both'}}>
        <div style={{float: 'left'}}>
          <div style={{height: 200, width: HOTSPOT_WIDTH}}>
            <ImageTool
              value={value}
              src={src}
              onChange={this.handleChange}
            />
          </div>
          <div style={{width: HOTSPOT_WIDTH, outline: '1px dotted #aaa'}}>
            <ImageSelector thumbWidth={thumbWidth} images={IMAGES} />
          </div>
          <h2>Hotspot</h2>
          <label>
            x:
            <this.range value={value.hotspot.x} onChange={this.handleHotspotChange} property="x" />
          </label>
          <label>
            y:
            <this.range value={value.hotspot.y} onChange={this.handleHotspotChange} property="y" />
          </label>
          <label>
            height:
            <this.range value={Math.abs(value.hotspot.height)} onChange={this.handleHotspotChange} property="height" />
          </label>
          <label>
            width:
            <this.range value={Math.abs(value.hotspot.width)} onChange={this.handleHotspotChange} property="width" />
          </label>
          <h2>Crop</h2>
          <label>
            left:
            <this.range value={value.crop.left} onChange={this.handleCropChange} property="left" />
          </label>
          <label>
            right:
            <this.range value={value.crop.right} onChange={this.handleCropChange} property="right" />
          </label>
          <label>
            top:
            <this.range value={value.crop.top} onChange={this.handleCropChange} property="top" />
          </label>
          <label>
            bottom:
            <this.range value={value.crop.bottom} onChange={this.handleCropChange} property="bottom" />
          </label>
          <h2>Value</h2>
          <pre>
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
        <div style={{padding: 5, margin: 5, float: 'left'}}>
          <ul className="previews">
            {PREVIEW_ASPECT_RATIOS.map((aspectRatio, i) => {
              return <li key={i}>{this.renderPreview(aspectRatio)}</li>
            })}
          </ul>
        </div>
      </div>
    )
  }

  range(props) {
    return (
      <input
        value={props.value}
        type="range"
        min="0"
        max="1"
        step="0.001"
        onChange={props.onChange}
        data-property={props.property}
      />
    )
  }
}


