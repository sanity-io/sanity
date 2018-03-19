// @flow
import React from 'react'

import PatchEvent, {set} from '../../PatchEvent'
import Fieldset from 'part:@sanity/components/fieldsets/default'

import ImageTool from '@sanity/imagetool'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import ImageLoader from 'part:@sanity/components/utilities/image-loader'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from '@sanity/imagetool/constants'
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
  level: number
}

type State = {
  value?: Value // cache value for moar fps
}

const PREVIEW_ASPECT_RATIOS = [
  ['Portrait', 9 / 16],
  ['Square', 1],
  ['Landscape', 16 / 9],
  ['Panorama', 4]
]

export default class ImageToolInput extends React.Component<Props, State> {
  constructor(props) {
    super()
    this.state = {
      value: props.value
    }
  }

  handleChangeEnd = () => {
    const {onChange, readOnly} = this.props
    const {value} = this.state
    if (!readOnly) {
      onChange(PatchEvent.from([set(value.crop, ['crop']), set(value.hotspot, ['hotspot'])]))
    }
    this.setState({value: this.props.value})
  }

  handleChange = (nextValue: Value) => {
    this.setState({value: nextValue})
  }

  componentWillReceiveProps(nextProps) {
    this.setState({value: nextProps.value})
  }

  render() {
    const {imageUrl, level, readOnly} = this.props
    const {value} = this.state

    return (
      <div className={styles.root}>
        <Fieldset legend="Hotspot and crop" level={level}>
          <div className={styles.wrapper}>
            <div className={styles.imageToolContainer}>
              <ImageTool
                value={value}
                src={imageUrl}
                readOnly={readOnly}
                onChangeEnd={this.handleChangeEnd}
                onChange={this.handleChange}
              />
            </div>
            <div className={styles.previewsContainer}>
              <h2>Preview</h2>
              <div className={styles.previews}>
                {PREVIEW_ASPECT_RATIOS.map(([title, ratio]) => {
                  return (
                    <div key={ratio} className={styles.preview}>
                      <h4>{title}</h4>
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
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Fieldset>
      </div>
    )
  }
}
