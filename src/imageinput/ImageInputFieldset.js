import React, {PropTypes} from 'react'

import styles from 'part:@sanity/components/imageinput/fieldset-style'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import UploadIcon from 'part:@sanity/base/upload-icon'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import createImageLoader from './common/createImageLoader'
import _HotspotImage from '@sanity/imagetool/HotspotImage'
import ImageSelect from 'part:@sanity/components/imageinput/image-select'
import {DEFAULT_CROP} from '@sanity/imagetool/constants'
import TrashIcon from 'part:@sanity/base/trash-icon'
import Button from 'part:@sanity/components/buttons/default'

const HotspotImage = createImageLoader(_HotspotImage, image => {
  const srcAspectRatio = image.width / image.height
  return {srcAspectRatio: srcAspectRatio}
})

const DEFAULT_HOTSPOT = {
  height: 1,
  width: 1,
  x: 0.5,
  y: 0.5
}

export default class ImageInputFieldset extends React.PureComponent {
  static propTypes = {
    status: PropTypes.oneOf(['ready', 'complete', 'pending', 'error']),
    legend: PropTypes.string,
    level: PropTypes.number,
    percent: PropTypes.number,
    fieldName: PropTypes.string,
    onSelect: PropTypes.func,
    onCancel: PropTypes.func,
    onClear: PropTypes.func,
    hotspotImage: PropTypes.shape({
      hotspot: PropTypes.object,
      crop: PropTypes.object,
      imageUrl: PropTypes.string
    }),
    children: PropTypes.node,
    showContent: PropTypes.bool
  }

  static defaultProps = {
    level: 0,
    status: 'ready',
    showContent: true
  }

  constructor(...args) {
    super(...args)
    this.state = {
      aspect: null
    }
  }

  render() {

    const {legend, level, hotspotImage, fieldName, percent, status, onCancel, children} = this.props
    let {showContent} = this.props

    if (!children) {
      showContent = false
    }

    return (
      <Fieldset legend={legend} level={level} className={`${styles[`level${level}`]}`}>
        <div className={`${styles.grid} ${showContent ? styles.hasContent : styles.noContent}`}>
          <div
            className={`
              ${hotspotImage && hotspotImage.imageUrl ? styles.imageWrapper : styles.imageWrapperEmpty}
              ${status == 'error' ? styles.error : ''}
            `}
          >
            {
              ((hotspotImage && hotspotImage.imageUrl))
              && <div className={status === 'complete' || status === 'ready' ? styles.imageIsUploaded : styles.imageIsNotUploaded}>
                {
                  hotspotImage && (
                    <HotspotImage
                      aspectRatio="auto"
                      hotspot={hotspotImage.hotspot || DEFAULT_HOTSPOT}
                      crop={hotspotImage.crop || DEFAULT_CROP}
                      src={hotspotImage.imageUrl}
                    />
                  )
                }
              </div>
            }

            {
              // Empty state and ready
              status === 'ready'
              && !(hotspotImage && hotspotImage.imageUrl)
              && (
                <ImageSelect
                  className={styles.imageSelect}
                  name={fieldName}
                  onSelect={this.props.onSelect}
                >
                  <div className={styles.uploadInner}>
                    <div className={styles.uploadIconContainer}>
                      <UploadIcon className={styles.uploadIcon} />
                    </div>
                    <span className={styles.uploadIconText}>Upload image</span>
                  </div>
                </ImageSelect>
              )
            }
            {
              status !== 'complete' && status !== 'ready'
              && <div className={styles.progressContainer}>
                <div className={styles.progressInner}>
                  {percent && <ProgressCircle percent={percent} showPercent className={styles.progress} />}
                </div>
              </div>
            }
            {
              status === 'pending' && onCancel
              && <a className={styles.cancel} onClick={this.props.onCancel}>Cancel</a>
            }
            {
              status == 'error'
              && <div className={styles.errorMessage}>
                <div>Error!</div>
                <ImageSelect name={fieldName} onSelect={this.props.onSelect}>
                  <span>Try again…</span>
                </ImageSelect>
              </div>
            }

            {
              status === 'complete'
              && <div className={styles.progressContainerComplete}>
                <div className={styles.progressInner}>
                  <ProgressCircle percent={100} completed className={styles.progressComplete} />
                </div>
              </div>
            }

            {
              (status != 'error' && status != 'pending') && hotspotImage && hotspotImage.imageUrl && (
                <div className={styles.functions}>
                  <Button
                    className={styles.removeButton}
                    onClick={this.props.onClear}
                    icon={TrashIcon}
                    color="danger"
                  >
                      Remove
                  </Button>
                  <Button
                    icon={UploadIcon}
                    ripple={false}
                  >
                    <ImageSelect
                      name={fieldName}
                      onSelect={this.props.onSelect}
                    >
                      Replace image
                    </ImageSelect>
                  </Button>
                </div>
              )
            }
          </div>
          {
            children && (
              <div className={showContent ? styles.content : styles.contentAbsolute}>
                {children}
              </div>
            )
          }
        </div>
      </Fieldset>
    )
  }
}
