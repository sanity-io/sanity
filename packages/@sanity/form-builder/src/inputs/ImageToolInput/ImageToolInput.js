// @flow
import React from 'react'

import PatchEvent, {set} from '../../PatchEvent'
import Switch from 'part:@sanity/components/toggles/switch'
import {get, isEqual, pick} from 'lodash'
import ImageTool from '@sanity/imagetool'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import ImageLoader from 'part:@sanity/components/utilities/image-loader'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from '@sanity/imagetool/constants'
import type {Type} from '../../typedefs'
import styles from './styles/ImageToolInput.css'

type Hotspot = {
  x: number,
  y: number,
  height: number,
  width: number
}

type Crop = {
  left: number,
  right: number,
  top: number,
  bottom: number
}

type Value = {
  hotspot?: Hotspot,
  crop?: Crop
}

type Props = {
  imageUrl: string,
  value?: Value,
  onChange: PatchEvent => void,
  readOnly: ?boolean,
  level: number,
  type: Type
}

type State = {
  value?: Value // cache value for moar fps
}

const INITIAL_CROP = {
  top: 0.2,
  left: 0.2,
  right: 0.2,
  bottom: 0.2
}

const INITIAL_HOTSPOT = {
  x: 0.5,
  y: 0.5,
  height: 0.1,
  width: 0.1
}

const PREVIEW_ASPECT_RATIOS = [
  ['Portrait', 9 / 16, 'portrait'],
  ['Landscape', 16 / 9, 'landscape'],
  ['Square', 1, 'square'],
  ['Panorama', 4, 'panorama']
]

const hotspotKeys = ['x', 'y', 'width', 'height']
const cropKeys = ['top', 'left', 'right', 'bottom']
// const hasHotspot = value.hotspot && !isEqual(pick(value.hotspot, hotspotKeys), pick(DEFAULT_HOTSPOT, hotspotKeys))
//const hasCrop = !isEqual(pick(value.crop, cropKeys), pick(DEFAULT_CROP, cropKeys))

export default class ImageToolInput extends React.Component<Props, State> {
  constructor(props) {
    super()
    this.state = {
      value: props.value,
      tempValue: undefined,
      showCrop:
        props.value.crop &&
        !isEqual(pick(props.value.crop, cropKeys), pick(DEFAULT_CROP, cropKeys)),
      showHotspot:
        props.value.hotspot &&
        !isEqual(pick(props.value.hotspot, hotspotKeys), pick(DEFAULT_HOTSPOT, hotspotKeys))
    }
  }

  handleChangeEnd = () => {
    const {onChange, readOnly, type} = this.props
    const {value} = this.state

    // For backwards compatibility, where hotspot/crop might not have a named type yet
    const cropField = type.fields.find(
      field => field.name === 'crop' && field.type.name !== 'object'
    )
    const hotspotField = type.fields.find(
      field => field.name === 'hotspot' && field.type.name !== 'object'
    )

    if (!readOnly) {
      const crop = cropField ? {_type: cropField.type.name, ...value.crop} : value.crop
      const hotspot = hotspotField
        ? {_type: hotspotField.type.name, ...value.hotspot}
        : value.hotspot
      onChange(PatchEvent.from([set(crop, ['crop']), set(hotspot, ['hotspot'])]))
    }

    this.setState({value: this.props.value, tempValue: value || this.props.value})
  }

  handleChange = (nextValue: Value) => {
    this.setState({value: nextValue})
  }

  handleToggleHotSpot = event => {
    const checked = event.target.checked
    const value = this.state.value || INITIAL_HOTSPOT

    if (checked) {
      value.hotspot = get(this.state, 'tempValue.hotspot') || INITIAL_HOTSPOT
      this.setState({
        showHotspot: true,
        value
      })
    } else {
      value.hotspot = null
      this.setState({
        showHotspot: false,
        value
      })
    }
  }

  handleToggleCrop = event => {
    const checked = event.target.checked
    const value = this.state.value || INITIAL_CROP

    if (checked) {
      value.crop = get(this.state, 'tempValue.crop') || INITIAL_CROP
      this.setState({
        showCrop: true,
        value
      })
    } else {
      value.crop = DEFAULT_CROP
      this.setState({
        showCrop: false,
        value
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({value: nextProps.value})
  }

  render() {
    const {imageUrl, level, readOnly} = this.props
    const {value, showCrop, showHotspot} = this.state

    return (
      <div className={styles.root}>
        <h2>Hotspot and crop</h2>
        <div className={styles.wrapper}>
          <div className={styles.imageToolWrapper}>
            <div className={styles.imageToolContainer}>
              <ImageTool
                value={value}
                src={imageUrl}
                readOnly={readOnly}
                showHotspot={!!showHotspot}
                showCrop={!!showCrop}
                onChangeEnd={this.handleChangeEnd}
                onChange={this.handleChange}
              />
            </div>
            <div className={styles.tools}>
              <div>
                <Switch label="Crop" checked={!!showCrop} onChange={this.handleToggleCrop} />
              </div>
              <div style={{paddingLeft: '1em'}}>
                <Switch
                  label="Hotspot"
                  checked={!!showHotspot}
                  onChange={this.handleToggleHotSpot}
                />
              </div>
            </div>
          </div>
          <div className={styles.previewsContainer}>
            <h2 style={{display: 'none'}}>Preview</h2>
            <div className={styles.previews}>
              {PREVIEW_ASPECT_RATIOS.map(([title, ratio, name]) => {
                return (
                  <div key={ratio} className={styles.preview} title={title} data-name={name}>
                    <div className={styles.previewImage}>
                      <ImageLoader src={imageUrl}>
                        {({image, error}) =>
                          error ? (
                            <span>Unable to load image: {error.message}</span>
                          ) : (
                            <HotspotImage
                              aspectRatio={ratio}
                              src={image.src}
                              srcAspectRatio={image.width / image.height}
                              hotspot={value.hotspot || DEFAULT_HOTSPOT}
                              crop={value.crop || DEFAULT_CROP}
                            />
                          )
                        }
                      </ImageLoader>
                    </div>
                    <h4>{title}</h4>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }
}
