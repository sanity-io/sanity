import React, {PropTypes} from 'react'
import Preview from './Preview'
import Link from './Link'
import ImageTool from '../../src'

const IMAGES = [
  '/hubble.jpg',
  '/koala.jpg',
  '/pigs-nose.png',
  'http://www.jpl.nasa.gov/spaceimages/images/largesize/PIA17970_hires.jpg',
  'http://placekitten.com/g/500/800',
  'http://placekitten.com/g/800/500',
  'http://placekitten.com/g/50/70',
  'http://placekitten.com/g/70/50',
  '/dog_smaller.jpg',
  '/storesmeden.jpg'
]

export default class ImageHotspotDemo extends React.Component {

  static propTypes = {
    imageIndex: PropTypes.string
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

  getImageUrl() {
    return IMAGES[this.props.imageIndex]
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

  render() {
    const value = this.state.value
    const imageUrl = this.getImageUrl()
    const HOTSPOT_WIDTH = 400
    const thumbWidth = (HOTSPOT_WIDTH - (IMAGES.length * 4)) / IMAGES.length
    return (
      <div style={{width: '100%', margin: 15, clear: 'both'}}>
        <div style={{float: 'left'}}>
          <div style={{width: HOTSPOT_WIDTH}}>
            <ImageTool
              value={value}
              imageUrl={imageUrl}
              onChange={this.handleChange}
            />
          </div>
          <div style={{width: HOTSPOT_WIDTH, outline: '1px dotted #aaa'}}>
            <ul style={{margin: 0, padding: 0, listStyle: 'none', clear: 'both'}}>
              {
                IMAGES.map((image, i) => {
                  return (
                    <li key={image} style={{display: 'inline-block', padding: 2}}>
                      <Link href={`/${i}`}>
                        <img src={image} style={{verticalAlign: 'middle', width: thumbWidth}} />
                      </Link>
                    </li>
                  )
                })
              }
            </ul>
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
            <li>
              <h3>Landscape</h3>
              <Preview aspectRatio={16 / 9} hotspot={value.hotspot} crop={value.crop} imageUrl={imageUrl} />
            </li>
            <li>
              <h3>Square</h3>
              <Preview aspectRatio={1} hotspot={value.hotspot} crop={value.crop} imageUrl={imageUrl} />
            </li>
            <li>
              <h3>Panorama</h3>
              <Preview aspectRatio={4} hotspot={value.hotspot} crop={value.crop} imageUrl={imageUrl} />
            </li>
            <li>
              <h3>Stående</h3>
              <Preview aspectRatio={9 / 16} hotspot={value.hotspot} crop={value.crop} imageUrl={imageUrl} />
            </li>
            <li>
              <h3>Uoppgitt format</h3>
              <Preview hotspot={value.hotspot} crop={value.crop} imageUrl={imageUrl} />
            </li>
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


