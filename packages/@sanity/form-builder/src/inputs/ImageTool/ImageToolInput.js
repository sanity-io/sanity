// @flow
import React from 'react'

import PatchEvent, {set} from '../../PatchEvent'
import FormField from 'part:@sanity/components/formfields/default'

import ImageTool from '@sanity/imagetool'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import ImageLoader from 'part:@sanity/components/utilities/image-loader'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from '@sanity/imagetool/constants'
import styles from './styles/ImageToolInput.css'

type Hotspot = {
  x: number,
  y: number,
  height: number,
  width: number,
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
  onChange: (PatchEvent) => void,
  level: number
}

const PREVIEW_ASPECT_RATIOS = [
  ['Landscape', 16 / 9],
  ['Portrait', 9 / 16],
  ['Square', 1],
  ['Panorama', 4]
]

export default class ImageToolInput extends React.Component<Props> {
  handleChange = (nextValue: Value) => {
    const {onChange} = this.props
    onChange(PatchEvent.from([
      set(nextValue.crop, ['crop']),
      set(nextValue.hotspot, ['hotspot'])
    ]))
  }

  render() {
    const {value = {}, imageUrl, level} = this.props

    return (
      <FormField
        label="Hotspot and crop"
        level={level}
      >
        <div className={styles.wrapper}>
          <div className={styles.imageToolContainer}>
            <ImageTool
              value={value}
              src={imageUrl}
              onChange={this.handleChange}
            />
          </div>
          <div className={styles.previewsContainer}>
            <h3>Example previews</h3>
            <div className={styles.previews}>
              {PREVIEW_ASPECT_RATIOS.map(([title, ratio]) => {
                return (
                  <div key={ratio} className={styles.preview}>
                    <h4>{title}</h4>
                    <div className={styles.previewImage}>
                      <ImageLoader src={imageUrl}>
                        {({image, error}) => (
                          error
                            ? <span>Unable to load image: {error.message}</span>
                            : <HotspotImage
                              aspectRatio={ratio}
                              src={image.src}
                              srcAspectRatio={image.width / image.height}
                              hotspot={value.hotspot || DEFAULT_HOTSPOT}
                              crop={value.crop || DEFAULT_CROP}
                            />
                        )}
                      </ImageLoader>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </FormField>
    )
  }
}
