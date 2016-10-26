import React, {PropTypes} from 'react'

import styles from 'part:@sanity/components/imageinput/fieldset-style'
// import DefaultLabel from 'part:@sanity/components/labels/default'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import UploadIcon from 'part:@sanity/base/upload-icon'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import createImageLoader from './common/createImageLoader'
import _HotspotImage from '@sanity/imagetool/HotspotImage'
import ImageSelect from 'part:@sanity/components/imageinput/image-select'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from '@sanity/imagetool/constants'

const HotspotImage = createImageLoader(_HotspotImage, image => {
  return {srcAspectRatio: image.width / image.height}
})


export default class ImageInputFieldset extends React.Component {
  static propTypes = {
    status: PropTypes.oneOf(['ready', 'completed', 'pending', 'error']),
    legend: PropTypes.string,
    level: PropTypes.number,
    uploadingImage: PropTypes.func,
    progress: PropTypes.number,
    fieldName: PropTypes.string,
    onSelect: PropTypes.func,
    onCancel: PropTypes.func,
    hotspotImage: PropTypes.shape({
      hotspot: PropTypes.object,
      crop: PropTypes.object,
      imageUrl: PropTypes.string
    }),
    children: PropTypes.node
  }

  static defaultProps = {
  }

  componentWillMount() {
    // this._inputId = uniqueId('ImageInputFieldset')
  }

  render() {

    const {legend, level, hotspotImage, uploadingImage, fieldName, progress, status} = this.props

    return (
      <Fieldset legend={legend} level={level}>
        <div className={styles.grid}>
          <div className={hotspotImage.imageUrl ? styles.imageWrapper : styles.imageWrapperEmpty}>
            {
              //<img src={imageUrl} width="150" className={styles.imageUploading} />
            }

            {
              hotspotImage.imageUrl
              && <div className={uploadingImage ? styles.imageUploading : styles.imageUploaded}>
                <HotspotImage
                  aspectRatio="auto"
                  hotspot={hotspotImage.hotspot || DEFAULT_HOTSPOT}
                  crop={hotspotImage.crop || DEFAULT_CROP}
                  src={hotspotImage.imageUrl}
                />
              </div>
            }

            {
              !hotspotImage.imageUrl
              && <ImageSelect
                className={styles.upload}
                name={fieldName}
                onSelect={this.props.onSelect}
              >
                <div className={styles.uploadInner}>
                  <UploadIcon className={styles.uploadIcon} />
                  Upload image
                </div>
              </ImageSelect>
            }
            {
              uploadingImage && status !== 'complete'
              && <div className={styles.progressContainer}>
                <div className={styles.progressInner}>
                  {progress && <ProgressCircle completion={progress.percent} showPercent className={styles.progress} />}
                </div>
              </div>
            }
            {
              status === 'pending' && this.props.onCancel
              && <a className={styles.cancel} onClick={this.props.onCancel}>Cancel</a>
            }
            {
              status === 'complete'
              && <div className={styles.progressContainer}>
                <div className={styles.progressInner}>
                  <ProgressCircle completion={100} complete className={styles.progressComplete} />
                </div>
              </div>
            }
          </div>
          <div className={styles.content}>
            {this.props.children}
          </div>
        </div>
      </Fieldset>
    )
  }
}
