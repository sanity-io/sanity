import React, {PropTypes} from 'react'

import IMAGES from './data/testImages'
import Preview from './Preview'
import ImageSelector from './ImageSelector'

const ASPECT_RATIO_OPTIONS = [
  ['None (default)', undefined],
  ['Landscape', 16 / 9],
  ['Square', 1],
  ['Wide', 4],
  ['Portrait', 9 / 16],
  ['Auto', 'auto', {height: 200}],
  ['Auto', 'auto', {width: 200}],
  ['Auto', 'auto', {height: 100, width: 200}]
].map(([title, aspect, wrapperStyle]) => ({title, aspect, wrapperStyle}))

const CROP = {
  top: 0.4,
  left: 0.0,
  bottom: 0.0,
  right: 0.1
}
const HOTSPOT = {
  x: 0.5,
  y: 0.5,
  height: 0.1,
  width: 0.1
}

export default class HotspotImageDemo extends React.PureComponent {

  static propTypes = {
    src: PropTypes.string
  }

  state = {
    selectedOption: ASPECT_RATIO_OPTIONS[0]
  }

  handleSelect = event => {
    const selected = ASPECT_RATIO_OPTIONS[event.target.value]
    this.setState({selectedOption: selected})
  }

  render() {
    const {src} = this.props
    const {selectedOption} = this.state
    const wrapperStyle = selectedOption.wrapperStyle || {}
    return (
      <div style={{padding: 5, margin: 5, float: 'left'}}>
        <ImageSelector images={IMAGES} thumbWidth={50} />
        <pre>{JSON.stringify({hotspot: HOTSPOT, crop: CROP}, null, 2)}</pre>
        <select value={ASPECT_RATIO_OPTIONS.indexOf(selectedOption)} onChange={this.handleSelect}>
          {ASPECT_RATIO_OPTIONS.map((option, i) => {
            const text = [
              option.title,
              option.wrapperStyle && JSON.stringify(option.wrapperStyle)
            ]
              .filter(Boolean)
              .join(' ')
            return <option key={i} value={i}>{text}</option>
          })}
        </select>
        <div style={{border: '2px solid cyan', ...wrapperStyle}}>
          <Preview crop={CROP} hotspot={HOTSPOT} aspectRatio={selectedOption.aspect} src={src} />
        </div>
      </div>
    )
  }
}


